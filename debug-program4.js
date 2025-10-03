const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugProgram4() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    const targetId = '6882c37cd780be404f48a922';
    console.log('🔍 찾는 프로그램 ID:', targetId);
    
    // 실제 Program 모델로 찾기
    const program = await Program.findById(targetId);
    console.log('📊 Program.findById 결과:', program ? '찾음' : '없음');
    
    if (program) {
      console.log('✅ 프로그램 정보:');
      console.log('   - 제목:', program.title);
      console.log('   - ID:', program._id);
      console.log('   - 활성화:', program.isActive);
    } else {
      console.log('❌ 프로그램을 찾을 수 없습니다.');
      
      // 모든 프로그램 확인
      const allPrograms = await Program.find({}, '_id title');
      console.log('\n📋 데이터베이스의 모든 프로그램:');
      allPrograms.forEach((p, index) => {
        console.log(`${index + 1}. ${p.title} - ID: ${p._id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

debugProgram4();
