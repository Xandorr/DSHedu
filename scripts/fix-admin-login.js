const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import User model
const User = require('../models/User');

async function fixAdminLogin() {
  try {
    console.log('🔧 관리자 로그인 수정 스크립트 시작...');
    
    // MongoDB 연결
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI 환경변수가 설정되지 않았습니다.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 연결 성공');

    const adminEmail = 'admin@dshedu.net';
    const adminPassword = 'admin123';

    // 기존 관리자 계정 찾기
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('👤 기존 관리자 계정 발견:', admin.name);
      console.log('📧 이메일:', admin.email);
      console.log('🔑 역할:', admin.role);
      
      // 비밀번호를 직접 해시화하여 저장
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      console.log('🔐 새로운 비밀번호 해시 생성 완료');
      console.log('🔐 해시 샘플:', hashedPassword.substring(0, 30) + '...');
      
      // 비밀번호 직접 업데이트 (pre-save 훅 우회)
      await User.updateOne(
        { _id: admin._id },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin' // 역할도 확실하게 admin으로 설정
          }
        }
      );
      
      console.log('✅ 관리자 비밀번호 업데이트 완료');
      
      // 업데이트된 사용자 다시 조회
      admin = await User.findOne({ email: adminEmail });
      
      // 비밀번호 검증 테스트
      console.log('\n🧪 비밀번호 검증 테스트 시작...');
      const isMatch = await bcrypt.compare(adminPassword, admin.password);
      console.log('🔍 비밀번호 일치 여부:', isMatch);
      
      if (isMatch) {
        console.log('✅ 비밀번호 검증 성공! 로그인이 정상적으로 작동해야 합니다.');
      } else {
        console.log('❌ 비밀번호 검증 실패! 추가 조치가 필요합니다.');
      }
      
    } else {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.');
      console.log('📝 새로운 관리자 계정을 생성합니다...');
      
      // 비밀번호를 직접 해시화
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // 새 관리자 계정 생성
      admin = new User({
        name: 'DSH에듀 관리자',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '010-0000-0000',
        communityLevel: {
          level: 5,
          experience: 9999,
          title: '다이아몬드',
          badges: [{
            name: '관리자',
            description: '사이트 관리자',
            earnedAt: new Date()
          }]
        },
        activityStats: {
          postsCount: 0,
          commentsCount: 0,
          likesReceived: 0,
          lastActiveAt: new Date()
        }
      });
      
      // save 시 pre-save 훅이 다시 해시화할 수 있으므로 주의
      // 하지만 isModified('password') 체크가 있어서 문제없을 것
      await admin.save({ validateBeforeSave: true });
      
      console.log('✅ 새 관리자 계정 생성 완료');
      
      // 비밀번호 검증 테스트
      console.log('\n🧪 비밀번호 검증 테스트 시작...');
      const isMatch = await bcrypt.compare(adminPassword, admin.password);
      console.log('🔍 비밀번호 일치 여부:', isMatch);
      
      if (isMatch) {
        console.log('✅ 비밀번호 검증 성공! 로그인이 정상적으로 작동해야 합니다.');
      } else {
        console.log('❌ 비밀번호 검증 실패! 추가 조치가 필요합니다.');
      }
    }

    console.log('\n📋 최종 관리자 계정 정보:');
    console.log('  이메일:', adminEmail);
    console.log('  비밀번호:', adminPassword);
    console.log('  역할:', admin.role);
    console.log('  이름:', admin.name);
    
    console.log('\n✅ 관리자 로그인 수정 완료!');
    console.log('🔐 이제 다음 정보로 로그인하세요:');
    console.log('  이메일: admin@dshedu.net');
    console.log('  비밀번호: admin123');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 MongoDB 연결 종료');
    process.exit(0);
  }
}

// 스크립트 실행
fixAdminLogin();

