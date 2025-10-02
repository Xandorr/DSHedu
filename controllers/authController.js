const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 프로필 사진 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('프로필 사진은 이미지 파일만 업로드 가능합니다.'));
    }
  }
});

exports.upload = upload;

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    console.log('📝 회원가입 요청 데이터:', { name, email, phone, role });
    console.log('📝 req.body 전체:', req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    console.log('👤 사용자 생성 중 - 역할:', role, '기본값 적용 후:', role || 'parent');
    const user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'parent',
      communityLevel: {
        level: 1,
        experience: 0,
        title: '브론즈',
        badges: []
      },
      activityStats: {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        lastActiveAt: new Date()
      }
    });

    await user.save();
    console.log('✅ 사용자 저장 완료 - 최종 역할:', user.role);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('👤 프로필 업데이트 요청:', req.user.name);
    console.log('📝 업데이트 데이터:', req.body);
    
    const { 
      name, 
      phone, 
      birthDate, 
      role,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      address,
      zipCode,
      emailNotifications,
      language
    } = req.body;
    
    console.log('📝 주소 필드:', { address, zipCode });
    
    // 현재 사용자 찾기
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // 역할 변경 권한 검사 (관리자만 역할 변경 가능)
    if (role && role !== currentUser.role) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '역할은 관리자만 변경할 수 있습니다.'
        });
      }
    }

    // 업데이트할 데이터 준비
    const updateData = {
      name: name !== undefined ? name : currentUser.name,
      phone: phone !== undefined ? phone : currentUser.phone,
      birthDate: birthDate ? new Date(birthDate) : currentUser.birthDate,
      role: role !== undefined ? role : currentUser.role,
      emergencyContact: {
        name: emergencyContactName !== undefined ? emergencyContactName : currentUser.emergencyContact?.name,
        phone: emergencyContactPhone !== undefined ? emergencyContactPhone : currentUser.emergencyContact?.phone,
        relationship: emergencyContactRelationship !== undefined ? emergencyContactRelationship : currentUser.emergencyContact?.relationship
      },
      address: {
        street: address !== undefined ? address : currentUser.address?.street,
        city: currentUser.address?.city,
        state: currentUser.address?.state,
        zipCode: zipCode !== undefined ? zipCode : currentUser.address?.zipCode,
        country: currentUser.address?.country || 'USA'
      },
      preferences: {
        emailNotifications: emailNotifications !== undefined ? emailNotifications === 'true' : currentUser.preferences?.emailNotifications,
        language: language !== undefined ? language : currentUser.preferences?.language || 'ko'
      }
    };

    // 프로필 사진 업로드 처리
    if (req.file) {
      // 기존 프로필 사진 삭제
      if (currentUser.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '..', 'public', currentUser.profilePhoto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log('🗑️ 기존 프로필 사진 삭제:', oldPhotoPath);
        }
      }
      
      updateData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
      console.log('📷 새 프로필 사진 업로드:', updateData.profilePhoto);
    }

    // 사용자 정보 업데이트
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ 프로필 업데이트 완료:', user.name);
    console.log('📝 업데이트된 주소 정보:', user.address);

    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user
    });
  } catch (error) {
    console.error('❌ 프로필 업데이트 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    console.log('🔐 비밀번호 변경 요청:', req.user.name);
    
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
      });
    }

    // 현재 사용자 찾기
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // 소셜 로그인 사용자는 비밀번호 변경 불가
    if (user.googleId || user.kakaoId || user.naverId) {
      return res.status(400).json({
        success: false,
        message: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.'
      });
    }

    // 현재 비밀번호 확인
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.'
      });
    }

    // 새 비밀번호 설정
    user.password = newPassword;
    await user.save();

    console.log('✅ 비밀번호 변경 완료:', user.name);

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    console.error('❌ 비밀번호 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== 관리자용 사용자 관리 API =====

// 관리자용 사용자 목록 조회
exports.getAdminUsers = async (req, res) => {
  try {
    console.log('👥 관리자 사용자 목록 조회');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // 역할 필터
    if (req.query.role && req.query.role !== 'all') {
      query.role = req.query.role;
    }
    
    // 검색
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📊 조회 결과: ${users.length}명 사용자 (전체 ${total}명)`);
    
    // AJAX 요청인 경우 JSON 응답
    if (req.xhr || req.headers.accept?.indexOf('json') > -1 || req.headers.accept === '*/*') {
      return res.json({
        success: true,
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    }
    
    // 일반 웹 요청인 경우 뷰 렌더링
    res.render('admin-panel', {
      title: '관리자 패널',
      description: '사용자 관리 시스템',
      user: req.user,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      activeTab: 'users'
    });
    
  } catch (error) {
    console.error('❌ 관리자 사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 관리자용 사용자 상세 조회
exports.getAdminUser = async (req, res) => {
  try {
    console.log('👤 관리자 사용자 상세 조회:', req.params.id);
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 등록 정보도 함께 조회
    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({ user: user._id })
      .populate('program', 'title category startDate endDate')
      .sort({ createdAt: -1 });
    
    console.log(`✅ 사용자 상세 조회 성공: ${user.name}`);
    
    res.json({
      success: true,
      user,
      enrollments
    });
    
  } catch (error) {
    console.error('❌ 관리자 사용자 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보를 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 관리자용 사용자 정보 수정
exports.updateAdminUser = async (req, res) => {
  try {
    console.log('✏️ 관리자 사용자 수정 요청:', req.params.id);
    console.log('📝 수정 데이터:', req.body);
    
    const { 
      name, 
      email, 
      role, 
      phone, 
      isActive,
      birthDate,
      address,
      zipCode,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      emailNotifications
    } = req.body;
    
    const updateData = {};
    
    // 기본 정보
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive === 'true';
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    
    // 주소 정보
    if (address !== undefined || zipCode !== undefined) {
      updateData.address = {
        street: address !== undefined ? address : undefined,
        zipCode: zipCode !== undefined ? zipCode : undefined
      };
    }
    
    // 비상 연락처
    if (emergencyContactName !== undefined || emergencyContactPhone !== undefined || emergencyContactRelationship !== undefined) {
      updateData.emergencyContact = {
        name: emergencyContactName !== undefined ? emergencyContactName : undefined,
        phone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
        relationship: emergencyContactRelationship !== undefined ? emergencyContactRelationship : undefined
      };
    }
    
    // 알림 설정
    if (emailNotifications !== undefined) {
      updateData.preferences = {
        emailNotifications: emailNotifications === 'true' || emailNotifications === true
      };
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    console.log(`✅ 사용자 수정 완료: ${user.name}`);
    
    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      user
    });
    
  } catch (error) {
    console.error('❌ 관리자 사용자 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 관리자용 사용자 삭제
exports.deleteAdminUser = async (req, res) => {
  try {
    console.log('🗑️ 관리자 사용자 삭제 요청:', req.params.id);
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 자기 자신은 삭제할 수 없음
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '자기 자신은 삭제할 수 없습니다.'
      });
    }
    
    // 관련 데이터 삭제 처리
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Enrollment = require('../models/Enrollment');
    
    // 1. 사용자가 작성한 게시글 삭제
    const userPosts = await Post.find({ author: user._id });
    for (const post of userPosts) {
      // 게시글의 댓글들도 삭제
      await Comment.deleteMany({ post: post._id });
      // 게시글 삭제
      await Post.findByIdAndDelete(post._id);
    }
    console.log(`📝 삭제된 게시글 수: ${userPosts.length}개`);
    
    // 2. 사용자가 작성한 댓글들 삭제 (다른 게시글의 댓글)
    const deletedComments = await Comment.deleteMany({ author: user._id });
    console.log(`💬 삭제된 댓글 수: ${deletedComments.deletedCount}개`);
    
    // 3. 사용자의 등록 정보 삭제
    const userEnrollments = await Enrollment.find({ user: user._id });
    for (const enrollment of userEnrollments) {
      // 프로그램 등록 인원수 감소 (정식 등록인 경우만)
      if (enrollment.program && enrollment.status !== 'wishlist') {
        await require('../models/Program').findByIdAndUpdate(enrollment.program, {
          $inc: { enrolled: -1 }
        });
      }
    }
    await Enrollment.deleteMany({ user: user._id });
    console.log(`📋 삭제된 등록 정보 수: ${userEnrollments.length}개`);
    
    // 4. 다른 게시글에서 이 사용자를 좋아요한 기록 제거
    await Post.updateMany(
      { likes: user._id },
      { $pull: { likes: user._id } }
    );
    console.log(`❤️ 좋아요 기록 정리 완료`);
    
    // 5. 마지막으로 사용자 삭제
    await User.findByIdAndDelete(req.params.id);
    
    console.log(`✅ 사용자 삭제 완료: ${user.name} (관련 데이터 모두 정리됨)`);
    
    res.json({
      success: true,
      message: '사용자와 관련된 모든 데이터가 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 관리자 사용자 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 회원 탈퇴 (본인 계정 삭제)
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;
    
    console.log(`🗑️ 회원 탈퇴 요청: ${req.user.name} (${req.user.email})`);
    
    // 사용자 확인
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 소셜 로그인 사용자 확인 (비밀번호가 없는 경우)
    const isSocialUser = !user.password || user.googleId || user.kakaoId || user.naverId;
    
    if (!isSocialUser) {
      // 일반 사용자 (비밀번호가 있는 경우) - 비밀번호 검증
      if (!password) {
        return res.status(400).json({
          success: false,
          message: '비밀번호를 입력해주세요.'
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '비밀번호가 올바르지 않습니다.'
        });
      }
    } else {
      // 소셜 로그인 사용자 - 비밀번호 검증 건너뛰기
      console.log(`🔐 소셜 로그인 사용자 - 비밀번호 검증 건너뛰기: ${user.name}`);
    }
    
    // 관리자는 탈퇴할 수 없음
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 계정은 탈퇴할 수 없습니다.'
      });
    }
    
    console.log(`🗑️ 회원 탈퇴 시작: ${user.name}`);
    
    // 관련 모델들 import
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Enrollment = require('../models/Enrollment');
    
    // 1. 사용자가 작성한 게시글 삭제
    const userPosts = await Post.find({ author: user._id });
    for (const post of userPosts) {
      // 게시글의 댓글들도 삭제
      await Comment.deleteMany({ post: post._id });
      // 게시글 삭제
      await Post.findByIdAndDelete(post._id);
    }
    console.log(`📝 삭제된 게시글 수: ${userPosts.length}개`);
    
    // 2. 사용자가 작성한 댓글들 삭제 (다른 게시글의 댓글)
    const deletedComments = await Comment.deleteMany({ author: user._id });
    console.log(`💬 삭제된 댓글 수: ${deletedComments.deletedCount}개`);
    
    // 3. 사용자의 등록 정보 삭제
    const userEnrollments = await Enrollment.find({ user: user._id });
    for (const enrollment of userEnrollments) {
      // 프로그램 등록 인원수 감소 (정식 등록인 경우만)
      if (enrollment.program && enrollment.status !== 'wishlist') {
        await require('../models/Program').findByIdAndUpdate(enrollment.program, {
          $inc: { enrolled: -1 }
        });
      }
    }
    await Enrollment.deleteMany({ user: user._id });
    console.log(`📋 삭제된 등록 정보 수: ${userEnrollments.length}개`);
    
    // 4. 다른 게시글에서 이 사용자를 좋아요한 기록 제거
    await Post.updateMany(
      { likes: user._id },
      { $pull: { likes: user._id } }
    );
    console.log(`❤️ 좋아요 기록 정리 완료`);
    
    // 5. 마지막으로 사용자 삭제
    await User.findByIdAndDelete(userId);
    
    console.log(`✅ 회원 탈퇴 완료: ${user.name} (관련 데이터 모두 정리됨)`);
    
    // 세션 종료
    req.logout((err) => {
      if (err) {
        console.error('세션 종료 오류:', err);
      }
    });
    
    res.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.'
    });
    
  } catch (error) {
    console.error('❌ 회원 탈퇴 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원 탈퇴 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}; 