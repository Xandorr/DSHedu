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

// 프로그램별 이미지 URL 매핑
const programImageMapping = {
  '유소년 풋볼 캠프': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758942044/Gemini_Generated_Image_knjrdjknjrdjknjr_ffwtrn.png',
  'Play-well LEGO Full Day Session': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1759118759/Gemini_Generated_Image_30uak430uak430ua_ekqjyy.png',
  'Y Break Camp': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1759199116/Gemini_Generated_Image_47a7f347a7f347a7_gln8xw.png',
  'Montessori School Camp': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758942402/Gemini_Generated_Image_izj74vizj74vizj7_mfgyjs.png',
  'Advanced Mathematics': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1759119811/Gemini_Generated_Image_ic4b0cic4b0cic4b_hg8xjn.png'
};

async function updateProgramImages() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공\n');
    
    // 모든 프로그램 조회
    const programs = await Program.find({});
    console.log(`📊 총 ${programs.length}개 프로그램 발견\n`);
    
    let updatedCount = 0;
    
    for (const program of programs) {
      const newImageUrl = programImageMapping[program.title];
      
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
    console.log('\n📋 업데이트된 프로그램 목록:');
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

updateProgramImages();
