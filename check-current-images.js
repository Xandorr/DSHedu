const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkCurrentImages() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 모든 프로그램 조회
    const programs = await Program.find({});
    console.log(`📊 총 ${programs.length}개 프로그램 발견\n`);
    
    // 각 프로그램의 현재 이미지 확인
    programs.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   - 현재 이미지: ${program.photos[0] || '이미지 없음'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

checkCurrentImages();
