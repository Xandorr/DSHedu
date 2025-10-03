const mongoose = require('mongoose');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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
  sortOrder: Number,
  activities: [String],
  features: [String],
  photos: [String],
  featured: Boolean,
  isActive: Boolean,
  instructors: [Object]
});

const Program = mongoose.model('Program', programSchema);

async function checkPrograms() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    const programs = await Program.find({});
    console.log(`📊 총 프로그램 수: ${programs.length}`);
    
    if (programs.length > 0) {
      console.log('\n📋 프로그램 목록:');
      programs.forEach((program, index) => {
        console.log(`${index + 1}. ${program.title} (ID: ${program._id})`);
        console.log(`   - 활성화: ${program.isActive}`);
        console.log(`   - 카테고리: ${program.category}`);
        console.log(`   - 가격: $${program.price || program.originalPrice}`);
        console.log(`   - 이미지: ${program.photos ? program.photos.length : 0}개`);
        console.log('');
      });
    } else {
      console.log('❌ 프로그램이 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

checkPrograms();
