const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

// MongoDB 연결
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dsh_edu');
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
}

// 로그인 테스트
async function testLogin(email, password) {
  try {
    console.log(`🔍 로그인 테스트 시작:`);
    console.log(`   이메일: ${email}`);
    console.log(`   비밀번호: ${password}`);
    console.log('');

    // 1. 사용자 찾기
    console.log('1️⃣ 사용자 검색 중...');
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ 해당 이메일의 사용자를 찾을 수 없습니다.');
      return false;
    }
    
    console.log(`✅ 사용자 발견: ${user.name} (${user.email})`);
    console.log(`   역할: ${user.role}`);
    console.log(`   저장된 비밀번호 해시: ${user.password.substring(0, 30)}...`);
    console.log('');

    // 2. 비밀번호 확인
    console.log('2️⃣ 비밀번호 검증 중...');
    
    if (!user.password) {
      console.log('❌ 비밀번호가 설정되지 않았습니다 (소셜 로그인 계정일 수 있음).');
      return false;
    }

    // bcrypt로 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      console.log('✅ 비밀번호가 일치합니다!');
      console.log('🎉 로그인 성공!');
      return true;
    } else {
      console.log('❌ 비밀번호가 일치하지 않습니다.');
      
      // 디버깅을 위해 새로 해시를 만들어 비교해보기
      console.log('\n🔧 디버깅 정보:');
      const newHash = await bcrypt.hash(password, 10);
      console.log(`   입력한 비밀번호의 새 해시: ${newHash.substring(0, 30)}...`);
      console.log(`   저장된 해시와 비교: ${user.password === newHash ? '같음' : '다름'}`);
      
      return false;
    }

  } catch (error) {
    console.error('❌ 로그인 테스트 중 오류:', error);
    return false;
  }
}

// 비밀번호 강제 재설정
async function forceResetPassword(email, newPassword) {
  try {
    console.log(`🔄 ${email} 계정의 비밀번호를 강제로 재설정합니다...`);
    
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log('❌ 사용자를 찾을 수 없습니다.');
      return;
    }

    // 새 비밀번호를 직접 해싱하여 저장
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // 사용자 정보 업데이트
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword,
      updatedAt: new Date()
    });
    
    console.log('✅ 비밀번호가 강제로 재설정되었습니다.');
    console.log(`   새 비밀번호: ${newPassword}`);
    console.log(`   새 해시: ${hashedPassword.substring(0, 30)}...`);
    
    // 즉시 테스트
    console.log('\n🧪 재설정 후 로그인 테스트:');
    await testLogin(email, newPassword);
    
  } catch (error) {
    console.error('❌ 비밀번호 강제 재설정 중 오류:', error);
  }
}

// 메인 함수
async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔐 DSH에듀 로그인 테스트 도구\n');

  switch (command) {
    case 'test':
      if (!args[1] || !args[2]) {
        console.log('❌ 사용법: node scripts/test-login.js test <이메일> <비밀번호>');
        console.log('   예시: node scripts/test-login.js test josh.lee@dshedu.net vmflstm12');
        break;
      }
      await testLogin(args[1], args[2]);
      break;

    case 'reset':
      if (!args[1] || !args[2]) {
        console.log('❌ 사용법: node scripts/test-login.js reset <이메일> <새비밀번호>');
        console.log('   예시: node scripts/test-login.js reset josh.lee@dshedu.net vmflstm12');
        break;
      }
      await forceResetPassword(args[1], args[2]);
      break;

    default:
      console.log('📖 사용 가능한 명령어:');
      console.log('  test <이메일> <비밀번호>     - 로그인 테스트');
      console.log('  reset <이메일> <새비밀번호>  - 비밀번호 강제 재설정');
      console.log('');
      console.log('💡 예시:');
      console.log('  node scripts/test-login.js test josh.lee@dshedu.net vmflstm12');
      console.log('  node scripts/test-login.js reset josh.lee@dshedu.net vmflstm12');
  }

  mongoose.connection.close();
}

// 스크립트 실행
main().catch(console.error); 