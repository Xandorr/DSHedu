const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Program = require('../models/Program');

async function updateSortOrder() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // 모든 프로그램 가져오기 (생성 날짜 순)
    const programs = await Program.find({}).sort({ createdAt: 1 });
    console.log(`📋 총 ${programs.length}개 프로그램 발견`);

    // 각 프로그램에 순서 할당
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      const sortOrder = (i + 1) * 10; // 10, 20, 30... (사이에 삽입 가능)
      
      await Program.findByIdAndUpdate(program._id, { sortOrder });
      console.log(`🔄 ${i + 1}. "${program.title}" → sortOrder: ${sortOrder}`);
    }

    console.log(`✅ ${programs.length}개 프로그램의 sortOrder 업데이트 완료`);
    console.log('💡 이제 관리자 패널에서 순서를 조정할 수 있습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    // 연결 종료
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
updateSortOrder(); 