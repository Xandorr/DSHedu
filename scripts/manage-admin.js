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

// 사용자 비밀번호 변경
async function changePassword(email, newPassword) {
  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ 이메일 "${email}"을 가진 사용자를 찾을 수 없습니다.`);
      return;
    }

    // 새 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // 비밀번호 업데이트
    user.password = hashedPassword;
    await user.save();
    
    console.log(`✅ "${user.name}" (${email})님의 비밀번호가 변경되었습니다.`);
    console.log(`   새 비밀번호: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ 비밀번호 변경 중 오류:', error);
  }
}

// 사용자 계정 삭제
async function deleteUser(email) {
  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ 이메일 "${email}"을 가진 사용자를 찾을 수 없습니다.`);
      return;
    }

    const userName = user.name;
    const userRole = user.role;
    
    await User.findOneAndDelete({ email: email });
    
    console.log(`✅ 사용자가 삭제되었습니다:`);
    console.log(`   이름: ${userName}`);
    console.log(`   이메일: ${email}`);
    console.log(`   역할: ${userRole}`);
    
  } catch (error) {
    console.error('❌ 사용자 삭제 중 오류:', error);
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
    console.log(`   비밀번호: ${password}`);
    console.log(`   역할: 관리자`);
    
  } catch (error) {
    console.error('❌ 관리자 생성 중 오류:', error);
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

// 모든 관리자 목록 조회
async function listAdmins() {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email createdAt');
    
    if (admins.length === 0) {
      console.log('📋 등록된 관리자가 없습니다.');
      return;
    }

    console.log(`📋 등록된 관리자 목록 (총 ${admins.length}명):`);
    console.log('='.repeat(50));
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`      가입일: ${admin.createdAt.toLocaleDateString('ko-KR')} ${admin.createdAt.toLocaleTimeString('ko-KR')}`);
    });
    
  } catch (error) {
    console.error('❌ 관리자 목록 조회 중 오류:', error);
  }
}

// 계정 정보 조회
async function getUserInfo(email) {
  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ 이메일 "${email}"을 가진 사용자를 찾을 수 없습니다.`);
      return;
    }

    console.log(`🔍 사용자 정보:`);
    console.log(`   이름: ${user.name}`);
    console.log(`   이메일: ${user.email}`);
    console.log(`   역할: ${user.role === 'admin' ? '🔱 관리자' : user.role}`);
    console.log(`   가입일: ${user.createdAt.toLocaleDateString('ko-KR')} ${user.createdAt.toLocaleTimeString('ko-KR')}`);
    console.log(`   비밀번호: ${user.password ? '🔒 설정됨' : '❌ 소셜로그인'}`);
    
  } catch (error) {
    console.error('❌ 사용자 정보 조회 중 오류:', error);
  }
}

// 기존 계정 삭제 후 새 관리자 생성
async function replaceAdmin(oldEmail, newAdminData) {
  try {
    console.log(`🔄 기존 계정 "${oldEmail}" 삭제 중...`);
    await deleteUser(oldEmail);
    
    console.log(`\n🆕 새 관리자 계정 생성 중...`);
    await createNewAdmin(newAdminData);
    
    console.log(`\n✅ 관리자 계정 교체가 완료되었습니다!`);
    
  } catch (error) {
    console.error('❌ 관리자 교체 중 오류:', error);
  }
}

// 메인 함수
async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔧 DSH에듀 관리자 계정 관리 도구\n');

  switch (command) {
    case 'change-password':
      if (!args[1] || !args[2]) {
        console.log('❌ 사용법: node scripts/manage-admin.js change-password <이메일> <새비밀번호>');
        console.log('   예시: node scripts/manage-admin.js change-password admin@dshedu.net newpassword123');
        break;
      }
      await changePassword(args[1], args[2]);
      break;

    case 'delete':
      if (!args[1]) {
        console.log('❌ 사용법: node scripts/manage-admin.js delete <이메일>');
        console.log('   예시: node scripts/manage-admin.js delete admin@dshedu.net');
        break;
      }
      console.log(`⚠️  정말로 "${args[1]}" 계정을 삭제하시겠습니까?`);
      console.log('   이 작업은 되돌릴 수 없습니다.');
      await deleteUser(args[1]);
      break;

    case 'create':
      if (!args[1] || !args[2] || !args[3]) {
        console.log('❌ 사용법: node scripts/manage-admin.js create <이름> <이메일> <비밀번호>');
        console.log('   예시: node scripts/manage-admin.js create "내이름" my@email.com mypassword123');
        break;
      }
      await createNewAdmin({
        name: args[1],
        email: args[2],
        password: args[3]
      });
      break;

    case 'replace':
      if (!args[1] || !args[2] || !args[3] || !args[4]) {
        console.log('❌ 사용법: node scripts/manage-admin.js replace <기존이메일> <새이름> <새이메일> <새비밀번호>');
        console.log('   예시: node scripts/manage-admin.js replace admin@dshedu.net "내이름" my@email.com mypassword123');
        break;
      }
      await replaceAdmin(args[1], {
        name: args[2],
        email: args[3],
        password: args[4]
      });
      break;

    case 'make-admin':
      if (!args[1]) {
        console.log('❌ 사용법: node scripts/manage-admin.js make-admin <이메일>');
        console.log('   예시: node scripts/manage-admin.js make-admin user@example.com');
        break;
      }
      await makeUserAdmin(args[1]);
      break;

    case 'list':
      await listAdmins();
      break;

    case 'info':
      if (!args[1]) {
        console.log('❌ 사용법: node scripts/manage-admin.js info <이메일>');
        console.log('   예시: node scripts/manage-admin.js info admin@dshedu.net');
        break;
      }
      await getUserInfo(args[1]);
      break;

    default:
      console.log('📖 사용 가능한 명령어:');
      console.log('');
      console.log('🔒 비밀번호 관리:');
      console.log('  change-password <이메일> <새비밀번호>  - 비밀번호 변경');
      console.log('');
      console.log('👤 계정 관리:');
      console.log('  create <이름> <이메일> <비밀번호>      - 새 관리자 계정 생성');
      console.log('  delete <이메일>                      - 계정 삭제');
      console.log('  replace <기존이메일> <새이름> <새이메일> <새비밀번호> - 계정 교체');
      console.log('  make-admin <이메일>                  - 기존 사용자를 관리자로 변경');
      console.log('');
      console.log('📋 정보 조회:');
      console.log('  list                                - 모든 관리자 목록');
      console.log('  info <이메일>                        - 특정 사용자 정보');
      console.log('');
      console.log('💡 추천 사용법:');
      console.log('  1️⃣ 기존 계정 삭제 후 새로 만들기:');
      console.log('     node scripts/manage-admin.js replace admin@dshedu.net "내이름" my@email.com mypass123');
      console.log('');
      console.log('  2️⃣ 기존 계정 비밀번호만 변경:');
      console.log('     node scripts/manage-admin.js change-password admin@dshedu.net newpassword');
  }

  mongoose.connection.close();
}

// 스크립트 실행
main().catch(console.error); 