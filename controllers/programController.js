const Program = require('../models/Program');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/programs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'program-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

exports.upload = upload;

// Get all programs
exports.getAllPrograms = async (req, res) => {
  try {
    const { category, location, featured, minAge, maxAge } = req.query;
    const query = { isActive: true };

    // Add filters if provided
    if (category) query.category = category;
    if (location) query['location.city'] = location;
    if (featured) query.featured = featured === 'true';
    if (minAge) query['ageRange.min'] = { $gte: parseInt(minAge) };
    if (maxAge) query['ageRange.max'] = { $lte: parseInt(maxAge) };

    const programs = await Program.find(query).sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single program
exports.getProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    res.status(200).json({
      success: true,
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new program (admin only)
exports.createProgram = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const program = await Program.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Program created successfully',
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update program (admin only)
exports.updateProgram = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const program = await Program.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Program updated successfully',
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete program (admin only)
exports.deleteProgram = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const program = await Program.findByIdAndDelete(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Program deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get featured programs
exports.getFeaturedPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ 
      featured: true, 
      isActive: true 
    }).limit(6);

    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== 관리자용 웹 뷰 메서드들 =====

// 관리자 패널용 프로그램 목록 조회
exports.getAdminPrograms = async (req, res) => {
  try {
    console.log('🔍 관리자 프로그램 목록 조회');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // 카테고리 필터
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    // 상태 필터
    if (req.query.status && req.query.status !== 'all') {
      query.isActive = req.query.status === 'active';
    }
    
    // 검색
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'location.city': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const programs = await Program.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Program.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📊 조회 결과: ${programs.length}개 프로그램 (전체 ${total}개)`);
    
    // AJAX 요청인 경우 JSON 응답
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.json({
        success: true,
        programs,
        pagination: {
          currentPage: page,
          totalPages,
          totalPrograms: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    }
    
    // 일반 웹 요청인 경우 뷰 렌더링
    res.render('admin-panel', {
      title: '관리자 패널',
      description: '프로그램 관리 시스템',
      user: req.user,
      programs,
      pagination: {
        currentPage: page,
        totalPages,
        totalPrograms: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      activeTab: 'programs'
    });
    
  } catch (error) {
    console.error('❌ 관리자 프로그램 목록 조회 오류:', error);
    res.status(500).render('error', {
      title: '오류',
      message: '프로그램 목록을 불러오는 중 오류가 발생했습니다.',
      user: req.user
    });
  }
};

// 프로그램 생성 (관리자용)
exports.createProgramAdmin = async (req, res) => {
  try {
    console.log('📝 관리자 프로그램 생성 요청:', req.body);
    
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }
    
    // 업로드된 이미지 파일 처리
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photos.push(`/uploads/programs/${file.filename}`);
      });
    }
    
    // 웹 URL 이미지 처리
    if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      req.body.imageUrls.forEach(url => {
        if (url && url.trim()) {
          photos.push(url.trim());
        }
      });
    }
    
    // 할인 계산
    const originalPrice = parseFloat(req.body.originalPrice) || 0;
    const discountPercent = parseFloat(req.body.discountPercent) || 0;
    const discountedPrice = originalPrice * (1 - discountPercent / 100);
    const finalPrice = discountPercent > 0 ? discountedPrice : originalPrice;

    // 프로그램 데이터 생성
    const programData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: {
        name: req.body.locationName,
        address: req.body.locationAddress, // 주/도와 주소가 합쳐진 전체 주소
        city: req.body.locationCity,
        state: '', // 더 이상 사용하지 않음
        country: req.body.locationCountry || 'USA'
      },
      ageRange: {
        min: parseInt(req.body.ageMin) || 0,
        max: parseInt(req.body.ageMax) || 99
      },
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      originalPrice: originalPrice,
      discountPercent: discountPercent,
      discountedPrice: discountedPrice,
      price: finalPrice,
      currency: req.body.currency || 'USD',
      capacity: parseInt(req.body.capacity),
      sortOrder: parseInt(req.body.sortOrder) || 0,
      activities: req.body.activities ? req.body.activities.split(',').map(a => a.trim()) : [],
      features: req.body.features ? JSON.parse(req.body.features) : [],
      photos: photos,
      featured: req.body.featured === 'on' || req.body.featured === 'true',
      isActive: req.body.isActive === 'true'
    };
    
    // 강사 정보 처리
    if (req.body.instructors) {
      try {
        programData.instructors = JSON.parse(req.body.instructors);
      } catch (e) {
        programData.instructors = [];
      }
    }
    
    const program = await Program.create(programData);
    
    console.log('✅ 프로그램 생성 완료:', program.title);
    
    res.json({
      success: true,
      message: '프로그램이 성공적으로 생성되었습니다.',
      program
    });
    
  } catch (error) {
    console.error('❌ 프로그램 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 프로그램 수정 (관리자용)
exports.updateProgramAdmin = async (req, res) => {
  try {
    console.log('✏️ 관리자 프로그램 수정 요청:', req.params.id);
    console.log('📋 수정 요청 데이터:', {
      title: req.body.title,
      originalPrice: req.body.originalPrice,
      discountPercent: req.body.discountPercent,
      sortOrder: req.body.sortOrder,
      files: req.files ? req.files.length : 0,
      method: req.body._method || req.method
    });
    
    // method-override 필드 제거
    if (req.body._method) {
      delete req.body._method;
    }
    
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }
    
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }
    
    // 새로운 이미지 파일 처리 (기존 이미지 유지 + 새 파일 추가)
    let photos = program.photos || [];
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => `/uploads/programs/${file.filename}`);
      photos = [...photos, ...newPhotos];
    }
    
    // 웹 URL 이미지 처리 (새로 추가된 URL만)
    if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      req.body.imageUrls.forEach(url => {
        if (url && url.trim()) {
          // 중복 체크: 이미 존재하는 URL인지 확인
          if (!photos.includes(url.trim())) {
            photos.push(url.trim());
          }
        }
      });
    }
    
    // 할인 계산
    const originalPrice = parseFloat(req.body.originalPrice) || 0;
    const discountPercent = parseFloat(req.body.discountPercent) || 0;
    const discountedPrice = originalPrice * (1 - discountPercent / 100);
    const finalPrice = discountPercent > 0 ? discountedPrice : originalPrice;
    
    console.log('💰 수정 시 가격 계산 정보:', {
      originalPrice,
      discountPercent,
      discountedPrice,
      finalPrice
    });
    
    console.log('🔍 isActive 필드 디버깅:', {
      'req.body.isActive': req.body.isActive,
      'typeof req.body.isActive': typeof req.body.isActive,
      'req.body.isActive === "true"': req.body.isActive === 'true',
      '최종 isActive 값': req.body.isActive === 'true'
    });

    // 프로그램 데이터 업데이트
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: {
        name: req.body.locationName,
        address: req.body.locationAddress, // 주/도와 주소가 합쳐진 전체 주소
        city: req.body.locationCity,
        state: '', // 더 이상 사용하지 않음
        country: req.body.locationCountry || 'USA'
      },
      ageRange: {
        min: parseInt(req.body.ageMin) || 0,
        max: parseInt(req.body.ageMax) || 99
      },
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      originalPrice: originalPrice,
      discountPercent: discountPercent,
      discountedPrice: discountedPrice,
      price: finalPrice,
      currency: req.body.currency || 'USD',
      capacity: parseInt(req.body.capacity),
      sortOrder: parseInt(req.body.sortOrder) || 0,
      activities: req.body.activities ? req.body.activities.split(',').map(a => a.trim()) : [],
      features: req.body.features ? JSON.parse(req.body.features) : [],
      photos: photos,
      featured: req.body.featured === 'on' || req.body.featured === 'true',
      isActive: req.body.isActive === 'true'
    };
    
    // 강사 정보 처리
    if (req.body.instructors) {
      try {
        updateData.instructors = JSON.parse(req.body.instructors);
      } catch (e) {
        updateData.instructors = program.instructors || [];
      }
    }
    
    const updatedProgram = await Program.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('✅ 프로그램 수정 완료:', {
      title: updatedProgram.title,
      isActive: updatedProgram.isActive,
      'isActive 타입': typeof updatedProgram.isActive
    });
    
    res.json({
      success: true,
      message: '프로그램이 성공적으로 수정되었습니다.',
      program: updatedProgram
    });
    
  } catch (error) {
    console.error('❌ 프로그램 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 프로그램 삭제 (관리자용)
exports.deleteProgramAdmin = async (req, res) => {
  try {
    console.log('🗑️ 관리자 프로그램 삭제 요청:', req.params.id);
    
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }
    
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }
    
    // 프로그램 이미지 파일 삭제 (로컬 파일만)
    if (program.photos && program.photos.length > 0) {
      program.photos.forEach(photo => {
        // 로컬 파일인 경우만 파일 시스템에서 삭제
        if (photo.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '..', 'public', photo);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log('✅ 로컬 이미지 파일 삭제:', filePath);
            } catch (fileError) {
              console.warn('⚠️ 로컬 파일 삭제 실패:', fileError.message);
            }
          }
        } else {
          console.log('🌐 웹 URL 이미지 (파일 시스템에서 제거하지 않음):', photo);
        }
      });
    }
    
    await Program.findByIdAndDelete(req.params.id);
    
    console.log('✅ 프로그램 삭제 완료:', program.title);
    
    res.json({
      success: true,
      message: '프로그램이 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 프로그램 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 프로그램 이미지 삭제 (관리자용)
exports.deleteProgramImage = async (req, res) => {
  try {
    console.log('🗑️ 프로그램 이미지 삭제 요청:', req.params.id);
    console.log('📷 삭제할 이미지 URL:', req.body.imageUrl);
    
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }
    
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }
    
    const imageUrl = req.body.imageUrl;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: '삭제할 이미지 URL이 필요합니다.'
      });
    }
    
    // 이미지가 프로그램의 photos 배열에 있는지 확인
    const imageIndex = program.photos.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '해당 이미지를 찾을 수 없습니다.'
      });
    }
    
    // 파일 시스템에서 이미지 파일 삭제 (로컬 파일인 경우만)
    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', 'public', imageUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('✅ 파일 시스템에서 이미지 삭제 완료:', filePath);
        } catch (fileError) {
          console.warn('⚠️ 파일 삭제 실패 (계속 진행):', fileError.message);
        }
      }
    } else {
      console.log('🌐 웹 URL 이미지 삭제 (파일 시스템에서 제거하지 않음):', imageUrl);
    }
    
    // 데이터베이스에서 이미지 URL 제거
    program.photos.splice(imageIndex, 1);
    await program.save();
    
    console.log('✅ 데이터베이스에서 이미지 URL 제거 완료');
    
    res.json({
      success: true,
      message: '이미지가 성공적으로 삭제되었습니다.',
      remainingImages: program.photos.length
    });
    
  } catch (error) {
    console.error('❌ 이미지 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 프로그램 상세 조회 (관리자용)
exports.getProgramAdmin = async (req, res) => {
  try {
    console.log('📖 관리자 프로그램 상세 조회:', req.params.id);
    
    const program = await Program.findById(req.params.id);
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      program
    });
    
  } catch (error) {
    console.error('❌ 프로그램 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}; 