const Enrollment = require('../models/Enrollment');
const Program = require('../models/Program');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Get user enrollments
exports.getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate('program', 'title category startDate endDate location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all enrollments for admin
exports.getAdminEnrollments = async (req, res) => {
  try {
    console.log('👥 관리자 등록 목록 조회');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const search = req.query.search || '';
    
    // 검색 조건 구성
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { 'student.name': { $regex: search, $options: 'i' } },
        { 'emergencyContact.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const enrollments = await Enrollment.find(query)
      .populate('user', 'name email')
      .populate('program', 'title category startDate endDate location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Enrollment.countDocuments(query);
    
    console.log(`📊 조회 결과: ${enrollments.length}개 등록 (전체 ${total}개)`);
    
    res.json({
      success: true,
      data: enrollments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    console.error('❌ 관리자 등록 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single enrollment
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('program')
      .populate('user', 'name email phone');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user is authorized to access this enrollment
    if (enrollment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const { programId, student, emergencyContact } = req.body;

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    // Check if program is full
    if (program.enrolled >= program.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Program is full'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user.id,
      program: programId,
      student,
      emergencyContact
    });

    await enrollment.save();

    // Send confirmation email
    sendEnrollmentConfirmation(req.user.email, enrollment, program);

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update enrollment status by admin
exports.updateAdminEnrollmentStatus = async (req, res) => {
  try {
    console.log('✏️ 관리자 등록 상태 수정 요청:', req.params.id);
    console.log('📝 수정 데이터:', req.body);

    const { status } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('program', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: '등록 정보를 찾을 수 없습니다.'
      });
    }

    // 현재 상태 저장 (프로그램 등록 인원수 업데이트를 위해)
    const previousStatus = enrollment.status;

    // 상태 업데이트
    enrollment.status = status;
    await enrollment.save();

    // 관리자가 pending → confirmed로 승인할 때 프로그램 등록 인원수 증가
    if (previousStatus === 'pending' && status === 'confirmed') {
      await Program.findByIdAndUpdate(enrollment.program._id, {
        $inc: { enrolled: 1 }
      });
      console.log('📈 프로그램 등록 인원수 증가:', enrollment.program.title);
    }

    console.log('✅ 등록 상태 수정 완료:', enrollment.user.name, '->', status);

    res.json({
      success: true,
      message: '등록 상태가 성공적으로 업데이트되었습니다.',
      enrollment
    });
  } catch (error) {
    console.error('❌ 관리자 등록 상태 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// Delete enrollment by admin
exports.deleteAdminEnrollment = async (req, res) => {
  try {
    console.log('🗑️ 관리자 등록 삭제 요청:', req.params.id);
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('program', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: '등록 정보를 찾을 수 없습니다.'
      });
    }

    // 프로그램 등록 인원수 감소 (정식 등록인 경우만)
    if (enrollment.program && enrollment.status !== 'wishlist') {
      await Program.findByIdAndUpdate(enrollment.program._id, {
        $inc: { enrolled: -1 }
      });
    }

    // 등록 삭제
    await Enrollment.findByIdAndDelete(req.params.id);

    console.log('✅ 등록 삭제 완료:', enrollment.user.name, '-', enrollment.program.title);

    res.json({
      success: true,
      message: '등록이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('❌ 관리자 등록 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// Update enrollment status
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Only admin can update enrollment status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment status updated successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentDetails } = req.body;

    // Only admin can update payment status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentDetails },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// Helper function to send confirmation email
const sendEnrollmentConfirmation = async (email, enrollment, program) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Enrollment Confirmation - ${program.title}`,
      html: `
        <h1>Enrollment Confirmation</h1>
        <p>Thank you for enrolling in our program!</p>
        <h2>Program Details:</h2>
        <p><strong>Program:</strong> ${program.title}</p>
        <p><strong>Category:</strong> ${program.category}</p>
        <p><strong>Dates:</strong> ${new Date(program.startDate).toLocaleDateString()} - ${new Date(program.endDate).toLocaleDateString()}</p>
        <p><strong>Location:</strong> ${program.location.name}, ${program.location.city}, ${program.location.state}</p>
        <h2>Enrollment Status:</h2>
        <p>Your enrollment is currently <strong>${enrollment.status}</strong>.</p>
        <p>Payment Status: <strong>${enrollment.paymentStatus}</strong></p>
        <p>Please keep this email for your records. You can also view your enrollments on your dashboard.</p>
        <p>If you have any questions, please contact us.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

// Cancel enrollment
exports.cancelEnrollment = async (req, res) => {
  try {
    console.log('🚫 등록 취소 요청 시작:', req.params.id, '사용자:', req.user ? req.user.name : 'undefined');
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('program', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: '등록 정보를 찾을 수 없습니다.'
      });
    }

    // 본인의 등록인지 확인 (관리자는 모든 등록 취소 가능)
    if (enrollment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '본인의 등록만 취소할 수 있습니다.'
      });
    }

    // 이미 완료된 등록은 취소 불가
    if (enrollment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '완료된 등록은 취소할 수 없습니다.'
      });
    }

    // 등록을 완전히 삭제
    await Enrollment.findByIdAndDelete(req.params.id);

    // 프로그램 등록 인원수 감소 (정식 등록인 경우만)
    if (enrollment.program && enrollment.status !== 'wishlist') {
      await Program.findByIdAndUpdate(enrollment.program, {
        $inc: { enrolled: -1 }
      });
    }

    console.log('✅ 등록 삭제 완료:', enrollment.program?.title);

    res.json({
      success: true,
      message: '등록이 성공적으로 취소되어 목록에서 제거되었습니다.'
    });
  } catch (error) {
    console.error('❌ 등록 취소 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Download certificate
exports.downloadCertificate = async (req, res) => {
  try {
    console.log('📜 수료증 다운로드 요청:', req.params.id, '사용자:', req.user.name);
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('program', 'title category startDate endDate')
      .populate('user', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: '등록 정보를 찾을 수 없습니다.'
      });
    }

    // 본인의 등록인지 확인 (관리자는 모든 수료증 다운로드 가능)
    if (enrollment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '본인의 수료증만 다운로드할 수 있습니다.'
      });
    }

    // 완료된 등록만 수료증 다운로드 가능
    if (enrollment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '완료된 프로그램만 수료증을 다운로드할 수 있습니다.'
      });
    }

    // 수료증 파일 경로 (실제로는 PDF 생성 라이브러리 사용)
    const certificateDir = path.join(__dirname, '..', 'public', 'certificates');
    const certificateFileName = `certificate_${enrollment._id}.pdf`;
    const certificatePath = path.join(certificateDir, certificateFileName);

    // 수료증 디렉토리 생성
    if (!fs.existsSync(certificateDir)) {
      fs.mkdirSync(certificateDir, { recursive: true });
    }

    // 임시로 텍스트 파일 생성 (실제로는 PDF 라이브러리 사용해야 함)
    if (!fs.existsSync(certificatePath)) {
      const certificateContent = `
===== 수료증 =====

프로그램: ${enrollment.program.title}
카테고리: ${enrollment.program.category}
수료자: ${enrollment.user.name}
이메일: ${enrollment.user.email}
프로그램 기간: ${new Date(enrollment.program.startDate).toLocaleDateString('ko-KR')} - ${new Date(enrollment.program.endDate).toLocaleDateString('ko-KR')}
수료일: ${new Date(enrollment.completedAt || enrollment.updatedAt).toLocaleDateString('ko-KR')}

본 수료증은 위 프로그램을 성공적으로 완료했음을 증명합니다.

DSH 에듀케이션
      `;
      
      fs.writeFileSync(certificatePath, certificateContent, 'utf8');
    }

    console.log('✅ 수료증 다운로드 제공:', certificateFileName);

    // 파일 다운로드 응답
    res.download(certificatePath, certificateFileName, (err) => {
      if (err) {
        console.error('❌ 수료증 다운로드 오류:', err);
        res.status(500).json({
          success: false,
          message: '수료증 다운로드 중 오류가 발생했습니다.'
        });
      }
    });
  } catch (error) {
    console.error('❌ 수료증 다운로드 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { programId } = req.params;
    
    console.log('❤️ 찜하기 요청:', programId, '사용자:', req.user.name);

    // 프로그램이 존재하는지 확인
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }

    // 이미 찜한 프로그램인지 확인
    const existingWishlist = await Enrollment.findOne({
      user: req.user._id,
      program: programId,
      status: 'wishlist'
    });

    if (existingWishlist) {
      return res.status(400).json({
        success: false,
        message: '이미 찜한 프로그램입니다.'
      });
    }

    // 찜하기 등록 생성
    const wishlistItem = new Enrollment({
      user: req.user._id,
      program: programId,
      status: 'wishlist',
      // 찜하기는 학생 정보 없이도 생성 가능
      student: {
        name: 'Wishlist Item',
        age: 0
      }
    });

    await wishlistItem.save();

    console.log('✅ 찜하기 완료:', program.title);

    res.json({
      success: true,
      message: '찜 목록에 추가되었습니다.',
      enrollment: wishlistItem
    });
  } catch (error) {
    console.error('❌ 찜하기 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { programId } = req.params;
    
    console.log('💔 찜하기 취소 요청:', programId, '사용자:', req.user.name);

    // 찜한 항목 찾기
    const wishlistItem = await Enrollment.findOne({
      user: req.user._id,
      program: programId,
      status: 'wishlist'
    }).populate('program', 'title');

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: '찜한 프로그램을 찾을 수 없습니다.'
      });
    }

    // 찜하기 항목 삭제
    await Enrollment.findByIdAndDelete(wishlistItem._id);

    console.log('✅ 찜하기 취소 완료:', wishlistItem.program?.title);

    res.json({
      success: true,
      message: '찜 목록에서 제거되었습니다.'
    });
  } catch (error) {
    console.error('❌ 찜하기 취소 오료:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Convert wishlist to enrollment
exports.enrollFromWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const { student, emergencyContact } = req.body;
    
    console.log('📝 찜하기에서 정식 등록 전환:', id, '사용자:', req.user.name);

    // 찜하기 항목 찾기
    const wishlistItem = await Enrollment.findById(id).populate('program');

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: '찜한 프로그램을 찾을 수 없습니다.'
      });
    }

    // 본인의 찜하기인지 확인
    if (wishlistItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '본인의 찜 목록만 등록할 수 있습니다.'
      });
    }

    // 찜하기 상태가 아닌 경우
    if (wishlistItem.status !== 'wishlist') {
      return res.status(400).json({
        success: false,
        message: '이미 등록된 프로그램입니다.'
      });
    }

    // 프로그램 정원 확인
    if (wishlistItem.program.enrolled >= wishlistItem.program.capacity) {
      return res.status(400).json({
        success: false,
        message: '프로그램 정원이 가득 찼습니다.'
      });
    }

    // 찜하기를 정식 등록으로 전환
    wishlistItem.status = 'pending';
    wishlistItem.student = student;
    wishlistItem.emergencyContact = emergencyContact;
    
    await wishlistItem.save();

    console.log('✅ 정식 등록 전환 완료:', wishlistItem.program.title);

    res.json({
      success: true,
      message: '성공적으로 등록되었습니다.',
      enrollment: wishlistItem
    });
  } catch (error) {
    console.error('❌ 정식 등록 전환 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 