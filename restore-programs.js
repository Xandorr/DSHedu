const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function restorePrograms() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 기존 프로그램들 삭제
    console.log('🗑️ 기존 프로그램들 삭제 중...');
    await Program.deleteMany({});
    console.log('✅ 기존 프로그램들 삭제 완료');
    
    // 원래 프로그램들 데이터
    const programsData = [
      {
        title: '음악 밴드 캠프',
        description: '미국 조지아주 뉴넌 명문 사립학교 The Heritage School에서 1주간 진행되는 음악 캠프',
        category: 'summer',
        location: {
          name: 'The Heritage School',
          city: 'Newnan',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 12, max: 18 },
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-21'),
        originalPrice: 310,
        discountPercent: 10,
        discountedPrice: 279,
        price: 279,
        currency: 'USD',
        capacity: 20,
        enrolled: 0,
        activities: ['음악 연습', '밴드 공연', '음악 이론'],
        features: ['전문 강사', '최신 장비', '공연 기회'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: true,
        isActive: true,
        sortOrder: 1
      },
      {
        title: '유소년 풋볼 캠프',
        description: '미국 조지아주 뉴넌에서 진행되는 유소년 풋볼 캠프',
        category: 'summer',
        location: {
          name: 'Newnan Sports Complex',
          city: 'Newnan',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 8, max: 14 },
        startDate: new Date('2024-07-22'),
        endDate: new Date('2024-07-28'),
        originalPrice: 130,
        discountPercent: 10,
        discountedPrice: 117,
        price: 117,
        currency: 'USD',
        capacity: 30,
        enrolled: 0,
        activities: ['풋볼 훈련', '체력 단련', '팀워크'],
        features: ['전문 코치', '안전 장비', '경기 참여'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: true,
        isActive: true,
        sortOrder: 2
      },
      {
        title: 'iDTech STEM 캠프',
        description: '미국 조지아주 애틀란타에서 진행되는 STEM 교육 캠프',
        category: 'summer',
        location: {
          name: 'Georgia Tech',
          city: 'Atlanta',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 10, max: 17 },
        startDate: new Date('2024-08-05'),
        endDate: new Date('2024-08-11'),
        originalPrice: 1685,
        discountPercent: 10,
        discountedPrice: 1516.5,
        price: 1516.5,
        currency: 'USD',
        capacity: 25,
        enrolled: 0,
        activities: ['프로그래밍', '로봇공학', '게임 개발'],
        features: ['최신 기술', '전문 강사', '프로젝트 완성'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: true,
        isActive: true,
        sortOrder: 3
      }
    ];
    
    // 프로그램들 생성
    console.log('📝 프로그램들 생성 중...');
    const createdPrograms = [];
    
    for (const programData of programsData) {
      const program = new Program(programData);
      await program.save();
      createdPrograms.push(program);
      console.log(`✅ ${program.title} 생성 완료 (ID: ${program._id})`);
    }
    
    console.log(`\n🎉 총 ${createdPrograms.length}개 프로그램 생성 완료!`);
    
    // 생성된 프로그램들로 테스트
    console.log('\n🔍 생성된 프로그램들로 findById 테스트:');
    for (const program of createdPrograms) {
      const foundProgram = await Program.findById(program._id);
      console.log(`   - ${program.title}: ${foundProgram ? '성공' : '실패'}`);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

restorePrograms();
