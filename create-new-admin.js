const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User 모델 import
const User = require('./models/User');

async function createNewAdmin() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // 기존 관리자 계정 삭제
    await User.deleteMany({ role: 'admin' });
    console.log('🗑️ 기존 관리자 계정 삭제 완료');

    // 새 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = new User({
      name: '관리자',
      email: 'admin@dshedu.net',
      password: hashedPassword,
      role: 'admin',
      communityLevel: {
        level: 5,
        title: '마스터',
        experience: 10000
      },
      activityStats: {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        lastActivity: new Date()
      }
    });

    await newAdmin.save();
    console.log('✅ 새 관리자 계정 생성 완료:');
    console.log('   이메일: admin@dshedu.net');
    console.log('   비밀번호: admin123');
    console.log('   이름: 관리자');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

createNewAdmin();
