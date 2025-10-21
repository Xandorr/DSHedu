const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import User model
const User = require('../models/User');

async function testAdminAccount() {
  try {
    console.log('🔧 관리자 계정 테스트 시작...');
    
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
    const testPassword = 'admin123';

    // 관리자 계정 찾기
    const admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log('❌ 관리자 계정이 존재하지 않습니다.');
      process.exit(1);
    }

    console.log('\n📋 관리자 계정 정보:');
    console.log('- 이름:', admin.name);
    console.log('- 이메일:', admin.email);
    console.log('- 역할:', admin.role);
    console.log('- 비밀번호 해시:', admin.password ? admin.password.substring(0, 30) + '...' : '없음');
    console.log('- 생성일:', admin.createdAt);

    // User 모델의 comparePassword 메서드 사용
    console.log('\n🔐 비밀번호 검증 테스트:');
    if (admin.comparePassword) {
      const isMatch = await admin.comparePassword(testPassword);
      console.log(`- comparePassword 메서드 결과: ${isMatch ? '✅ 성공' : '❌ 실패'}`);
    } else {
      console.log('❌ comparePassword 메서드가 정의되지 않았습니다.');
    }

    // bcrypt.compare 직접 사용
    const directMatch = await bcrypt.compare(testPassword, admin.password);
    console.log(`- bcrypt.compare 직접 결과: ${directMatch ? '✅ 성공' : '❌ 실패'}`);

    // 테스트용 새 해시 생성
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('\n🔬 테스트 해시 생성:');
    console.log('- 새 해시:', newHash.substring(0, 30) + '...');
    const newHashMatch = await bcrypt.compare(testPassword, newHash);
    console.log(`- 새 해시 검증: ${newHashMatch ? '✅ 성공' : '❌ 실패'}`);

    // 비밀번호가 일치하지 않으면 재설정
    if (!directMatch) {
      console.log('\n⚠️  비밀번호가 일치하지 않습니다. 비밀번호를 재설정합니다...');
      admin.password = testPassword;
      await admin.save();
      console.log('✅ 비밀번호 재설정 완료');
      
      // 재설정 후 다시 테스트
      const retestMatch = await bcrypt.compare(testPassword, admin.password);
      console.log(`- 재설정 후 검증: ${retestMatch ? '✅ 성공' : '❌ 실패'}`);
    } else {
      console.log('\n✅ 비밀번호가 올바르게 설정되어 있습니다!');
    }

    await mongoose.connection.close();
    console.log('\n✅ 테스트 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

testAdminAccount();

