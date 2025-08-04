const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Program = require('../models/Program');
const { programs } = require('../config/programs');

// 환경 변수 로드
dotenv.config();

// MongoDB 연결
const connectDB = async () => {
  try {
    console.log('📡 MongoDB 연결 중...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

// 날짜 파싱 함수
const parseDateRange = (dateRange) => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  // 다양한 날짜 형식 처리
  if (dateRange.includes(' - ')) {
    const [startStr, endStr] = dateRange.split(' - ');
    
    // "2025년 7월 10일 - 8월 5일" 형식
    if (startStr.includes('년') && endStr.includes('일')) {
      const startMatch = startStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
      const endMatch = endStr.includes('년') 
        ? endStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
        : endStr.match(/(\d{1,2})월\s*(\d{1,2})일/);
      
      if (startMatch) {
        const startYear = parseInt(startMatch[1]);
        const startMonth = parseInt(startMatch[2]);
        const startDay = parseInt(startMatch[3]);
        
        let endYear, endMonth, endDay;
        if (endMatch && endMatch.length === 4) {
          // 완전한 날짜 (년도 포함)
          endYear = parseInt(endMatch[1]);
          endMonth = parseInt(endMatch[2]);
          endDay = parseInt(endMatch[3]);
        } else if (endMatch && endMatch.length === 3) {
          // 년도 없는 날짜
          endYear = startYear;
          endMonth = parseInt(endMatch[1]);
          endDay = parseInt(endMatch[2]);
          
          // 월이 시작월보다 작으면 다음 해로 간주
          if (endMonth < startMonth) {
            endYear = startYear + 1;
          }
        }
        
        return {
          startDate: new Date(startYear, startMonth - 1, startDay),
          endDate: new Date(endYear, endMonth - 1, endDay)
        };
      }
    }
    
    // "2025년 7월 7일 - 7월 18일" 형식
    if (startStr.includes('년') && !endStr.includes('년')) {
      const startMatch = startStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
      const endMatch = endStr.match(/(\d{1,2})월\s*(\d{1,2})일/);
      
      if (startMatch && endMatch) {
        const startYear = parseInt(startMatch[1]);
        const startMonth = parseInt(startMatch[2]);
        const startDay = parseInt(startMatch[3]);
        const endMonth = parseInt(endMatch[1]);
        const endDay = parseInt(endMatch[2]);
        
        return {
          startDate: new Date(startYear, startMonth - 1, startDay),
          endDate: new Date(startYear, endMonth - 1, endDay)
        };
      }
    }
  }
  
  // 단일 날짜 "2025년 7월 19일"
  if (dateRange.includes('년') && dateRange.includes('월') && dateRange.includes('일')) {
    const match = dateRange.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);
      const date = new Date(year, month - 1, day);
      
      return {
        startDate: date,
        endDate: date
      };
    }
  }
  
  // 기본값 (파싱 실패 시)
  console.warn(`⚠️ 날짜 파싱 실패: ${dateRange}, 기본값 사용`);
  return {
    startDate: new Date(nextYear, 6, 1), // 2025년 7월 1일
    endDate: new Date(nextYear, 6, 31)   // 2025년 7월 31일
  };
};

// 연령대 파싱 함수
const parseAgeRange = (ageRange) => {
  const match = ageRange.match(/(\d+)-(\d+)세/);
  if (match) {
    return {
      min: parseInt(match[1]),
      max: parseInt(match[2])
    };
  }
  
  // 기본값
  return { min: 7, max: 18 };
};

// 가격 파싱 함수
const parsePrice = (priceStr) => {
  // "$1,511부터", "$6,719" 등에서 숫자만 추출
  const match = priceStr.match(/\$?([\d,]+)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 1000; // 기본값
};

// 위치 파싱 함수
const parseLocation = (locationStr) => {
  // 간단한 위치 파싱
  const parts = locationStr.split(' ');
  
  return {
    name: locationStr,
    address: '',
    city: parts[0] || '',
    state: parts.length > 1 ? parts[1] : '',
    zipCode: '',
    country: 'USA'
  };
};

// 카테고리 매핑
const mapCategory = (category) => {
  const categoryMap = {
    'summer': 'summer',
    'winter': 'winter', 
    'special': 'special'
  };
  return categoryMap[category] || 'special';
};

// 프로그램 데이터 변환 함수
const transformProgram = (oldProgram) => {
  const { startDate, endDate } = parseDateRange(oldProgram.dateRange);
  const ageRange = parseAgeRange(oldProgram.ageRange);
  const price = parsePrice(oldProgram.discountedPrice || oldProgram.price);
  const location = parseLocation(oldProgram.location);
  
  return {
    title: oldProgram.title,
    description: oldProgram.description,
    category: mapCategory(oldProgram.category),
    location: location,
    ageRange: ageRange,
    startDate: startDate,
    endDate: endDate,
    price: price,
    currency: 'USD',
    capacity: 30, // 기본 정원
    enrolled: 0,
    instructors: [],
    activities: oldProgram.features || [],
    photos: oldProgram.image ? [oldProgram.image] : [],
    featured: oldProgram.featured || false,
    isActive: true
  };
};

// 메인 마이그레이션 함수
const migratePrograms = async () => {
  try {
    console.log('🚀 프로그램 마이그레이션 시작...');
    
    // 기존 프로그램 삭제 (중복 방지)
    await Program.deleteMany({});
    console.log('🗑️ 기존 프로그램 데이터 삭제 완료');
    
    const transformedPrograms = [];
    
    // 각 프로그램 변환
    for (const oldProgram of programs) {
      try {
        const newProgram = transformProgram(oldProgram);
        transformedPrograms.push(newProgram);
        console.log(`✅ 변환 완료: ${newProgram.title}`);
      } catch (error) {
        console.error(`❌ 변환 실패 (ID: ${oldProgram.id}):`, error.message);
      }
    }
    
    // 데이터베이스에 삽입
    const insertedPrograms = await Program.insertMany(transformedPrograms);
    console.log(`🎉 ${insertedPrograms.length}개 프로그램이 성공적으로 삽입되었습니다!`);
    
    // 삽입된 프로그램 요약 출력
    insertedPrograms.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title} (${program.category})`);
      console.log(`   📅 ${program.startDate.toLocaleDateString()} - ${program.endDate.toLocaleDateString()}`);
      console.log(`   💰 $${program.price} | 👥 ${program.capacity}명 | ⭐ ${program.featured ? '추천' : '일반'}`);
      console.log('');
    });
    
    console.log('✅ 프로그램 마이그레이션 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 데이터베이스 연결 종료');
    process.exit(0);
  }
};

// 스크립트 실행
const runMigration = async () => {
  await connectDB();
  await migratePrograms();
};

// 직접 실행 시
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, transformProgram }; 