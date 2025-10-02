const mongoose = require('mongoose');
const Program = require('../models/Program');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/education-camp-website', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkProgramStatus() {
  try {
    console.log('🔍 프로그램 상태 확인 중...\n');
    
    const programs = await Program.find({}).select('title isActive createdAt updatedAt');
    
    console.log(`📊 총 ${programs.length}개 프로그램 발견:\n`);
    
    programs.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   - 활성화 상태: ${program.isActive ? '✅ 활성' : '❌ 비활성'}`);
      console.log(`   - 생성일: ${program.createdAt.toLocaleString('ko-KR')}`);
      console.log(`   - 수정일: ${program.updatedAt.toLocaleString('ko-KR')}`);
      console.log('');
    });
    
    const activeCount = programs.filter(p => p.isActive).length;
    const inactiveCount = programs.filter(p => !p.isActive).length;
    
    console.log(`📈 요약:`);
    console.log(`   - 활성 프로그램: ${activeCount}개`);
    console.log(`   - 비활성 프로그램: ${inactiveCount}개`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkProgramStatus();

