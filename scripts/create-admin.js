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

// 기존 사용자를 관리자로 변경
async function makeUserAdmin(email) {
  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ 이메일 "${email}"을 가진 사용자를 찾을 수 없습니다.`);
      return;
    }

    user.role = 'admin';
    await user.save();
    
    console.log(`✅ "${user.name}" (${email})님이 관리자로 변경되었습니다.`);
  } catch (error) {
    console.error('❌ 관리자 변경 중 오류:', error);
  }
}

// 새 관리자 계정 생성
async function createNewAdmin(adminData) {
  try {
    const { name, email, password } = adminData;
    
    // 이미 존재하는지 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ 이메일 "${email}"은 이미 사용 중입니다.`);
      return;
    }

    // 새 관리자 생성
    const admin = new User({
      name,
      email,
      password,
      role: 'admin'
    });

    await admin.save();
    console.log(`✅ 새 관리자 계정이 생성되었습니다:`);
    console.log(`   이름: ${name}`);
    console.log(`   이메일: ${email}`);
    console.log(`   역할: 관리자`);
  } catch (error) {
    console.error('❌ 관리자 생성 중 오류:', error);
  }
}

// 모든 관리자 목록 조회
async function listAdmins() {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email createdAt');
    
    if (admins.length === 0) {
      console.log('📋 등록된 관리자가 없습니다.');
      return;
    }

    console.log('📋 등록된 관리자 목록:');
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - 가입일: ${admin.createdAt.toLocaleDateString('ko-KR')}`);
    });
  } catch (error) {
    console.error('❌ 관리자 목록 조회 중 오류:', error);
  }
}

// 메인 함수
async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'make-admin':
      if (!args[1]) {
        console.log('❌ 사용법: node scripts/create-admin.js make-admin <이메일>');
        console.log('   예시: node scripts/create-admin.js make-admin admin@dshedu.net');
        break;
      }
      await makeUserAdmin(args[1]);
      break;

    case 'create':
      if (!args[1] || !args[2] || !args[3]) {
        console.log('❌ 사용법: node scripts/create-admin.js create <이름> <이메일> <비밀번호>');
        console.log('   예시: node scripts/create-admin.js create "관리자" admin@dshedu.net mypassword123');
        break;
      }
      await createNewAdmin({
        name: args[1],
        email: args[2],
        password: args[3]
      });
      break;

    case 'list':
      await listAdmins();
      break;

    default:
      console.log('🔧 DSH에듀 관리자 계정 관리 도구');
      console.log('');
      console.log('사용 가능한 명령어:');
      console.log('  make-admin <이메일>           - 기존 사용자를 관리자로 변경');
      console.log('  create <이름> <이메일> <비밀번호>  - 새 관리자 계정 생성');
      console.log('  list                        - 모든 관리자 목록 조회');
      console.log('');
      console.log('예시:');
      console.log('  node scripts/create-admin.js make-admin user@example.com');
      console.log('  node scripts/create-admin.js create "김관리" admin@dshedu.net admin123');
      console.log('  node scripts/create-admin.js list');
  }

  mongoose.connection.close();
}

// 스크립트 실행
main().catch(console.error); 