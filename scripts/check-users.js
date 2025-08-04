const mongoose = require('mongoose');
const User = require('../models/User');
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

// 사용자 정보 표시 함수
function displayUser(user, index) {
  console.log(`\n👤 사용자 ${index + 1}:`);
  console.log(`   ID: ${user._id}`);
  console.log(`   이름: ${user.name}`);
  console.log(`   이메일: ${user.email}`);
  console.log(`   역할: ${user.role === 'admin' ? '🔱 관리자' : user.role === 'parent' ? '👨‍👩‍👧‍👦 학부모' : '👨‍🎓 학생'}`);
  console.log(`   가입일: ${user.createdAt.toLocaleDateString('ko-KR')} ${user.createdAt.toLocaleTimeString('ko-KR')}`);
  console.log(`   비밀번호: ${user.password ? '🔒 암호화됨 (bcrypt)' : '❌ 소셜로그인'}`);
  
  // 소셜 로그인 정보
  if (user.googleId) console.log(`   Google ID: ${user.googleId}`);
  if (user.kakaoId) console.log(`   Kakao ID: ${user.kakaoId}`);
  if (user.naverId) console.log(`   Naver ID: ${user.naverId}`);
}

// 모든 사용자 조회
async function listAllUsers() {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('📋 등록된 사용자가 없습니다.');
      return;
    }

    console.log(`📋 전체 사용자 목록 (총 ${users.length}명):`);
    console.log('='.repeat(50));
    
    users.forEach((user, index) => {
      displayUser(user, index);
    });
    
    // 통계
    const adminCount = users.filter(u => u.role === 'admin').length;
    const parentCount = users.filter(u => u.role === 'parent').length;
    const studentCount = users.filter(u => u.role === 'student').length;
    
    console.log('\n📊 사용자 통계:');
    console.log(`   🔱 관리자: ${adminCount}명`);
    console.log(`   👨‍👩‍👧‍👦 학부모: ${parentCount}명`);
    console.log(`   👨‍🎓 학생: ${studentCount}명`);
    
  } catch (error) {
    console.error('❌ 사용자 목록 조회 중 오류:', error);
  }
}

// 관리자만 조회
async function listAdmins() {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    
    if (admins.length === 0) {
      console.log('📋 등록된 관리자가 없습니다.');
      return;
    }

    console.log(`🔱 관리자 목록 (총 ${admins.length}명):`);
    console.log('='.repeat(50));
    
    admins.forEach((admin, index) => {
      displayUser(admin, index);
    });
    
  } catch (error) {
    console.error('❌ 관리자 목록 조회 중 오류:', error);
  }
}

// 특정 사용자 검색
async function findUser(email) {
  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ 이메일 "${email}"을 가진 사용자를 찾을 수 없습니다.`);
      return;
    }

    console.log(`🔍 사용자 검색 결과:`);
    console.log('='.repeat(50));
    displayUser(user, 0);
    
  } catch (error) {
    console.error('❌ 사용자 검색 중 오류:', error);
  }
}

// 데이터베이스 연결 상태 확인
async function checkDBConnection() {
  try {
    const dbStats = await mongoose.connection.db.stats();
    const userCount = await User.countDocuments();
    
    console.log('🗄️ 데이터베이스 정보:');
    console.log(`   데이터베이스명: ${mongoose.connection.name}`);
    console.log(`   호스트: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`   상태: ${mongoose.connection.readyState === 1 ? '✅ 연결됨' : '❌ 연결안됨'}`);
    console.log(`   총 사용자 수: ${userCount}명`);
    console.log(`   데이터베이스 크기: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ 데이터베이스 정보 조회 중 오류:', error);
  }
}

// 메인 함수
async function main() {
  await connectDB();
  
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔍 DSH에듀 사용자 데이터베이스 조회 도구\n');

  switch (command) {
    case 'all':
      await listAllUsers();
      break;

    case 'admins':
      await listAdmins();
      break;

    case 'find':
      if (!args[1]) {
        console.log('❌ 사용법: node scripts/check-users.js find <이메일>');
        console.log('   예시: node scripts/check-users.js find admin@dshedu.net');
        break;
      }
      await findUser(args[1]);
      break;

    case 'info':
      await checkDBConnection();
      break;

    default:
      console.log('📖 사용 가능한 명령어:');
      console.log('  all                     - 모든 사용자 목록 조회');
      console.log('  admins                  - 관리자만 조회');
      console.log('  find <이메일>           - 특정 사용자 검색');
      console.log('  info                    - 데이터베이스 정보');
      console.log('');
      console.log('💡 예시:');
      console.log('  node scripts/check-users.js all');
      console.log('  node scripts/check-users.js admins');
      console.log('  node scripts/check-users.js find admin@dshedu.net');
      console.log('  node scripts/check-users.js info');
  }

  mongoose.connection.close();
}

// 스크립트 실행
main().catch(console.error); 