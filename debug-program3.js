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

async function debugProgram3() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 첫 번째 프로그램의 실제 ID 확인
    const firstProgram = await Program.findOne({});
    if (firstProgram) {
      console.log('📊 첫 번째 프로그램 정보:');
      console.log('   - 제목:', firstProgram.title);
      console.log('   - ID:', firstProgram._id);
      console.log('   - ID 타입:', typeof firstProgram._id);
      console.log('   - ID 문자열:', firstProgram._id.toString());
      
      // 이 ID로 다시 찾기
      const foundProgram = await Program.findById(firstProgram._id);
      console.log('🔍 같은 ID로 다시 찾기:', foundProgram ? '성공' : '실패');
      
      // 문자열로 찾기
      const foundByString = await Program.findById(firstProgram._id.toString());
      console.log('🔍 문자열 ID로 찾기:', foundByString ? '성공' : '실패');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

debugProgram3();
