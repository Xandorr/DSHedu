const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function restoreAllPrograms() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 기존 프로그램들 삭제
    console.log('🗑️ 기존 프로그램들 삭제 중...');
    await Program.deleteMany({});
    console.log('✅ 기존 프로그램들 삭제 완료');
    
    // 원래 9개 프로그램들 데이터
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
      },
      {
        title: 'iDTech STEM 캠프 Academies',
        description: '고급 STEM 교육을 위한 iDTech Academies 프로그램',
        category: 'summer',
        location: {
          name: 'Georgia Tech',
          city: 'Atlanta',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 13, max: 18 },
        startDate: new Date('2024-08-12'),
        endDate: new Date('2024-08-18'),
        originalPrice: 6719,
        discountPercent: 10,
        discountedPrice: 6047.1,
        price: 6047.1,
        currency: 'USD',
        capacity: 20,
        enrolled: 0,
        activities: ['고급 프로그래밍', 'AI/ML', '사이버 보안'],
        features: ['고급 과정', '전문 강사', '포트폴리오 제작'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: true,
        isActive: true,
        sortOrder: 4
      },
      {
        title: 'Play-well LEGO Full Day Session',
        description: 'LEGO를 활용한 창의적 교육 프로그램',
        category: 'summer',
        location: {
          name: 'Play-well Center',
          city: 'Atlanta',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 6, max: 12 },
        startDate: new Date('2024-07-29'),
        endDate: new Date('2024-08-04'),
        originalPrice: 311.1,
        discountPercent: 10,
        discountedPrice: 279.99,
        price: 279.99,
        currency: 'USD',
        capacity: 15,
        enrolled: 0,
        activities: ['LEGO 건축', '창의적 사고', '팀 프로젝트'],
        features: ['전문 LEGO 세트', '창의적 교육', '안전한 환경'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: true,
        isActive: true,
        sortOrder: 5
      },
      {
        title: 'Y Break Camp',
        description: '겨울 방학 동안 진행되는 YMCA 브레이크 캠프',
        category: 'winter',
        location: {
          name: 'YMCA Newnan',
          city: 'Newnan',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 5, max: 12 },
        startDate: new Date('2024-12-23'),
        endDate: new Date('2024-12-29'),
        originalPrice: 500,
        discountPercent: 10,
        discountedPrice: 450,
        price: 450,
        currency: 'USD',
        capacity: 25,
        enrolled: 0,
        activities: ['체육 활동', '예술 활동', '게임'],
        features: ['안전한 환경', '경험 있는 스태프', '다양한 활동'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: false,
        isActive: true,
        sortOrder: 6
      },
      {
        title: 'Montessori School Camp',
        description: '몬테소리 교육법을 적용한 겨울 캠프',
        category: 'winter',
        location: {
          name: 'Montessori School of Newnan',
          city: 'Newnan',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 3, max: 8 },
        startDate: new Date('2024-12-30'),
        endDate: new Date('2025-01-05'),
        originalPrice: 500,
        discountPercent: 10,
        discountedPrice: 450,
        price: 450,
        currency: 'USD',
        capacity: 20,
        enrolled: 0,
        activities: ['몬테소리 교구', '자율 학습', '창의적 활동'],
        features: ['몬테소리 교육법', '전문 교사', '개별 맞춤 교육'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: false,
        isActive: true,
        sortOrder: 7
      },
      {
        title: 'Advanced Mathematics',
        description: '고급 수학 교육을 위한 특별 프로그램',
        category: 'special',
        location: {
          name: 'Math Excellence Center',
          city: 'Atlanta',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 14, max: 18 },
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-07'),
        originalPrice: 300,
        discountPercent: 10,
        discountedPrice: 270,
        price: 270,
        currency: 'USD',
        capacity: 15,
        enrolled: 0,
        activities: ['고급 수학', '문제 해결', '수학 경시대회 준비'],
        features: ['전문 수학 강사', '고급 교재', '개별 지도'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: false,
        isActive: true,
        sortOrder: 8
      },
      {
        title: '애틀란타 대학 캠퍼스 & 시티 투어',
        description: '애틀란타의 주요 대학들과 도시 명소를 탐방하는 투어 프로그램',
        category: 'special',
        location: {
          name: 'Atlanta University District',
          city: 'Atlanta',
          state: 'GA',
          country: 'USA'
        },
        ageRange: { min: 16, max: 18 },
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-10-21'),
        originalPrice: 800,
        discountPercent: 10,
        discountedPrice: 720,
        price: 720,
        currency: 'USD',
        capacity: 20,
        enrolled: 0,
        activities: ['대학 캠퍼스 투어', '도시 명소 방문', '대학 입학 상담'],
        features: ['전문 가이드', '대학 관계자 만남', '입학 정보 제공'],
        photos: ['https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/Gemini_Generated_Image_2g0e672g0e672g0e_x0qj1i.png'],
        featured: false,
        isActive: true,
        sortOrder: 9
      }
    ];
    
    // 프로그램들 생성
    console.log('📝 9개 프로그램들 생성 중...');
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
    
    console.log('\n📊 프로그램 카테고리별 분포:');
    const summerCount = createdPrograms.filter(p => p.category === 'summer').length;
    const winterCount = createdPrograms.filter(p => p.category === 'winter').length;
    const specialCount = createdPrograms.filter(p => p.category === 'special').length;
    console.log(`   - 여름 캠프: ${summerCount}개`);
    console.log(`   - 겨울 캠프: ${winterCount}개`);
    console.log(`   - 특별 프로그램: ${specialCount}개`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

restoreAllPrograms();
