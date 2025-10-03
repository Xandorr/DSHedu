const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createTestProgram() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 기존 프로그램들 삭제
    console.log('🗑️ 기존 프로그램들 삭제 중...');
    await Program.deleteMany({});
    console.log('✅ 기존 프로그램들 삭제 완료');
    
    // 새로운 테스트 프로그램 생성
    const testProgram = new Program({
      title: '테스트 프로그램',
      description: '프로그램 상세보기 테스트용 프로그램입니다.',
      category: 'summer',
      location: {
        name: '테스트 위치',
        city: 'Atlanta',
        state: 'GA',
        country: 'USA'
      },
      ageRange: {
        min: 10,
        max: 18
      },
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-07'),
      originalPrice: 500,
      discountPercent: 10,
      discountedPrice: 450,
      price: 450,
      currency: 'USD',
      capacity: 20,
      enrolled: 0,
      activities: ['테스트 활동 1', '테스트 활동 2'],
      features: ['특징 1', '특징 2'],
      photos: ['https://via.placeholder.com/400x300?text=Test+Program'],
      featured: true,
      isActive: true,
      sortOrder: 1
    });
    
    await testProgram.save();
    console.log('✅ 테스트 프로그램 생성 완료');
    console.log('   - ID:', testProgram._id);
    console.log('   - 제목:', testProgram.title);
    
    // 생성된 프로그램으로 테스트
    const foundProgram = await Program.findById(testProgram._id);
    console.log('🔍 생성된 프로그램으로 findById 테스트:', foundProgram ? '성공' : '실패');
    
    if (foundProgram) {
      console.log('✅ 프로그램 상세보기 테스트 성공!');
      console.log('   - 테스트 URL: http://localhost:3001/programs/' + testProgram._id);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

createTestProgram();
