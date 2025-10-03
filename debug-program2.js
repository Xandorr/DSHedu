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

async function debugProgram2() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    const targetId = '6882c37cd780be404f48a922';
    console.log('🔍 찾는 프로그램 ID:', targetId);
    
    // ObjectId로 변환해서 찾기
    const objectId = new mongoose.Types.ObjectId(targetId);
    console.log('🔧 ObjectId로 변환:', objectId);
    
    const program = await Program.findById(objectId);
    console.log('📊 findById(ObjectId) 결과:', program ? '찾음' : '없음');
    
    if (program) {
      console.log('✅ 프로그램 정보:');
      console.log('   - 제목:', program.title);
      console.log('   - ID:', program._id);
      console.log('   - 활성화:', program.isActive);
    } else {
      console.log('❌ ObjectId로도 찾을 수 없습니다.');
      
      // 문자열로 직접 찾기
      const programByString = await Program.findOne({ _id: targetId });
      console.log('📊 findOne({_id: string}) 결과:', programByString ? '찾음' : '없음');
      
      if (programByString) {
        console.log('✅ 문자열로 찾은 프로그램:');
        console.log('   - 제목:', programByString.title);
        console.log('   - ID:', programByString._id);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

debugProgram2();
