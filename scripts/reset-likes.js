const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB 연결
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dsh_edu', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
}

// 모든 사용자의 likesReceived를 0으로 리셋
async function resetLikesReceived() {
  try {
    console.log('🔄 사용자들의 likesReceived 값 초기화 중...');
    
    const result = await User.updateMany(
      {}, // 모든 사용자
      { 
        $set: { 
          'activityStats.likesReceived': 0 
        } 
      }
    );
    
    console.log(`✅ ${result.modifiedCount}명의 사용자 likesReceived 값이 0으로 초기화되었습니다.`);
    
    // 현재 사용자들의 상태 확인
    const users = await User.find({}, 'name email activityStats.likesReceived');
    console.log('\n📊 현재 사용자 상태:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): 좋아요 ${user.activityStats?.likesReceived || 0}개`);
    });
    
  } catch (error) {
    console.error('❌ likesReceived 초기화 오류:', error);
  }
}

// 메인 함수
async function main() {
  await connectDB();
  await resetLikesReceived();
  mongoose.connection.close();
  console.log('\n✅ 작업 완료');
}

// 스크립트 실행
main().catch(console.error);
