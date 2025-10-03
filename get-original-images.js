const mongoose = require('mongoose');

// 예전 MongoDB 클러스터 URI (마이그레이션 전)
const OLD_MONGODB_URI = 'mongodb+srv://admin:Vmflstm!2@cluster0.dpkbup9.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

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

async function getOriginalImages() {
  try {
    console.log('🔗 예전 MongoDB 클러스터 연결 중...');
    console.log('📍 클러스터: cluster0.dpkbup9.mongodb.net');
    
    await mongoose.connect(OLD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ 예전 MongoDB 클러스터 연결 성공');
    
    // 모든 프로그램 조회
    const programs = await Program.find({});
    console.log(`📊 총 ${programs.length}개 프로그램 발견\n`);
    
    // 각 프로그램의 이미지 URL 추출
    const programImages = {};
    
    programs.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   - 이미지: ${program.photos[0] || '이미지 없음'}`);
      
      if (program.photos && program.photos.length > 0) {
        programImages[program.title] = program.photos[0];
      }
      console.log('');
    });
    
    console.log('📋 추출된 이미지 URL 매핑:');
    console.log(JSON.stringify(programImages, null, 2));
    
    return programImages;
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    
    if (error.message.includes('authentication failed')) {
      console.log('🔐 인증 실패 - 비밀번호가 변경되었을 수 있습니다.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 네트워크 오류 - 클러스터를 찾을 수 없습니다.');
    } else if (error.message.includes('timeout')) {
      console.log('⏰ 연결 시간 초과 - 클러스터가 비활성화되었을 수 있습니다.');
    }
    
    return null;
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

getOriginalImages();
