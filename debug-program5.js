const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugProgram5() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    const targetId = '6882c37cd780be404f48a922';
    console.log('🔍 문제의 프로그램 ID:', targetId);
    
    // 다양한 방법으로 찾기
    console.log('\n1. findById 시도:');
    const byId = await Program.findById(targetId);
    console.log('   결과:', byId ? '성공' : '실패');
    
    console.log('\n2. findOne with _id 시도:');
    const byFindOne = await Program.findOne({ _id: targetId });
    console.log('   결과:', byFindOne ? '성공' : '실패');
    
    console.log('\n3. findOne with ObjectId 시도:');
    const objectId = new mongoose.Types.ObjectId(targetId);
    const byObjectId = await Program.findOne({ _id: objectId });
    console.log('   결과:', byObjectId ? '성공' : '실패');
    
    console.log('\n4. 컬렉션 직접 조회:');
    const collection = mongoose.connection.db.collection('programs');
    const byCollection = await collection.findOne({ _id: objectId });
    console.log('   결과:', byCollection ? '성공' : '실패');
    
    if (byCollection) {
      console.log('   제목:', byCollection.title);
    }
    
    console.log('\n5. 모든 문서의 _id 확인:');
    const allDocs = await collection.find({}).limit(3).toArray();
    allDocs.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.title} - _id: ${doc._id}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

debugProgram5();
