const mongoose = require('mongoose');
require('dotenv').config();

// Post 모델 import
const Post = require('./models/Post');

async function deleteAllPosts() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // 모든 게시글 삭제
    const result = await Post.deleteMany({});
    console.log(`🗑️ ${result.deletedCount}개의 게시글 삭제 완료`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

deleteAllPosts();
