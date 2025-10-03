const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User 모델 정의
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  googleId: String,
  kakaoId: String,
  naverId: String,
  profilePhoto: String,
  communityLevel: {
    level: { type: Number, default: 1 },
    title: { type: String, default: '새싹' },
    experience: { type: Number, default: 0 }
  },
  activityStats: {
    posts: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 기존 관리자 계정 삭제
    await User.deleteMany({ role: 'admin' });
    console.log('🗑️ 기존 관리자 계정 삭제 완료');
    
    // 새 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      name: '관리자',
      email: 'admin@dshedu.net',
      password: hashedPassword,
      role: 'admin',
      communityLevel: {
        level: 5,
        title: '관리자',
        experience: 9999
      },
      activityStats: {
        posts: 0,
        comments: 0,
        likes: 0
      }
    });
    
    await admin.save();
    console.log('✅ 새 관리자 계정 생성 완료:');
    console.log('   이메일: admin@dshedu.net');
    console.log('   비밀번호: admin123');
    console.log('   이름: 관리자');
    
    // 생성된 계정 확인
    const createdAdmin = await User.findOne({ email: 'admin@dshedu.net' });
    console.log('🔍 생성된 계정 확인:', {
      id: createdAdmin._id,
      name: createdAdmin.name,
      email: createdAdmin.email,
      role: createdAdmin.role
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

createAdmin();
