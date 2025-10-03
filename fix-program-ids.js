const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixProgramIds() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 모든 프로그램 조회
    const programs = await Program.find({});
    console.log(`📊 총 프로그램 수: ${programs.length}`);
    
    if (programs.length === 0) {
      console.log('❌ 프로그램이 없습니다.');
      return;
    }
    
    console.log('\n📋 현재 프로그램 목록:');
    programs.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   - ID: ${program._id}`);
      console.log(`   - 활성화: ${program.isActive}`);
      console.log(`   - 카테고리: ${program.category}`);
      console.log('');
    });
    
    // 첫 번째 프로그램으로 테스트
    const firstProgram = programs[0];
    console.log('🔍 첫 번째 프로그램 테스트:');
    console.log('   - 제목:', firstProgram.title);
    console.log('   - ID:', firstProgram._id);
    
    // 이 ID로 다시 찾기
    const foundProgram = await Program.findById(firstProgram._id);
    console.log('   - findById 결과:', foundProgram ? '성공' : '실패');
    
    if (!foundProgram) {
      console.log('❌ findById 실패 - 데이터 무결성 문제 가능성');
      
      // 컬렉션 직접 조회
      const collection = mongoose.connection.db.collection('programs');
      const directDoc = await collection.findOne({ _id: firstProgram._id });
      console.log('   - 컬렉션 직접 조회:', directDoc ? '성공' : '실패');
      
      if (directDoc) {
        console.log('   - 직접 조회된 제목:', directDoc.title);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

fixProgramIds();
