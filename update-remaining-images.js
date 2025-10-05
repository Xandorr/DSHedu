const mongoose = require('mongoose');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

// Program 모델 정의
const programSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String
  },
  ageRange: {
    min: Number,
    max: Number
  },
  startDate: Date,
  endDate: Date,
  originalPrice: Number,
  discountPercent: Number,
  discountedPrice: Number,
  price: Number,
  currency: String,
  capacity: Number,
  enrolled: Number,
  instructors: [Object],
  activities: [String],
  features: [String],
  photos: [String],
  featured: Boolean,
  isActive: Boolean,
  sortOrder: Number
});

const Program = mongoose.model('Program', programSchema);

// 나머지 프로그램별 이미지 URL 매핑
const remainingProgramImageMapping = {
  'iDTech STEM 캠프': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758853468/Gemini_Generated_Image_rqcolerqcolerqco_bd4f9i.png',
  'iDTech STEM 캠프 Academies': 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  '애틀란타 대학 캠퍼스 & 시티 투어': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
};

async function updateRemainingImages() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공\n');
    
    // 모든 프로그램 조회
    const programs = await Program.find({});
    console.log(`📊 총 ${programs.length}개 프로그램 발견\n`);
    
    let updatedCount = 0;
    
    for (const program of programs) {
      const newImageUrl = remainingProgramImageMapping[program.title];
      
      if (newImageUrl) {
        console.log(`🔄 업데이트 중: ${program.title}`);
        console.log(`   기존 이미지: ${program.photos[0] || '이미지 없음'}`);
        console.log(`   새 이미지: ${newImageUrl}`);
        
        // 이미지 URL 업데이트
        await Program.findByIdAndUpdate(program._id, {
          $set: { photos: [newImageUrl] }
        });
        
        console.log(`   ✅ 업데이트 완료\n`);
        updatedCount++;
      } else {
        console.log(`⏭️  매핑 없음: ${program.title} (이미지 유지)\n`);
      }
    }
    
    console.log(`🎉 이미지 업데이트 완료!`);
    console.log(`📊 총 ${updatedCount}개 프로그램 이미지 업데이트됨`);
    
    // 업데이트된 프로그램들 확인
    console.log('\n📋 최종 프로그램 이미지 목록:');
    const updatedPrograms = await Program.find({});
    updatedPrograms.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   이미지: ${program.photos[0] || '이미지 없음'}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 MongoDB 연결 종료');
  }
}

updateRemainingImages();
