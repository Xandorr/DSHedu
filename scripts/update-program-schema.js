const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Program = require('../models/Program');

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

// 프로그램 스키마 업데이트
const updateProgramSchema = async () => {
  try {
    console.log('🔄 프로그램 스키마 업데이트 시작...');
    
    // 기존 프로그램들 조회
    const programs = await Program.find({});
    console.log(`📊 업데이트할 프로그램 수: ${programs.length}개`);
    
    let updatedCount = 0;
    
    for (const program of programs) {
      try {
        // 새로운 필드가 없는 경우에만 업데이트
        if (!program.originalPrice && program.price) {
          const updateData = {
            originalPrice: program.price,
            discountPercent: 0,
            discountedPrice: program.price
          };
          
          await Program.findByIdAndUpdate(program._id, updateData);
          console.log(`✅ 업데이트 완료: ${program.title}`);
          updatedCount++;
        } else if (program.originalPrice) {
          console.log(`⏭️  이미 업데이트됨: ${program.title}`);
        } else {
          console.log(`⚠️  가격 정보 없음: ${program.title}`);
        }
      } catch (error) {
        console.error(`❌ 업데이트 실패 (${program.title}):`, error.message);
      }
    }
    
    console.log(`🎉 스키마 업데이트 완료! ${updatedCount}개 프로그램이 업데이트되었습니다.`);
    
    // 업데이트된 프로그램들 확인
    const updatedPrograms = await Program.find({}).select('title originalPrice discountPercent discountedPrice price');
    
    console.log('\n📋 업데이트 결과:');
    updatedPrograms.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   원래가격: $${program.originalPrice}`);
      console.log(`   할인율: ${program.discountPercent}%`);
      console.log(`   할인가격: $${program.discountedPrice}`);
      console.log(`   최종가격: $${program.price}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 스키마 업데이트 오류:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 데이터베이스 연결 종료');
    process.exit(0);
  }
};

// 스크립트 실행
const runUpdate = async () => {
  await connectDB();
  await updateProgramSchema();
};

// 직접 실행 시
if (require.main === module) {
  runUpdate();
}

module.exports = { runUpdate }; 