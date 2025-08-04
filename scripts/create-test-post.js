require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

// MongoDB 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/education-camps');
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

const createTestPost = async () => {
  try {
    // 관리자 계정 찾기
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.');
      return;
    }

    // 태그가 있는 테스트 게시글 생성
    const testPost = new Post({
      title: '태그 검색 테스트 게시글',
      content: `이 게시글은 태그 검색 기능을 테스트하기 위한 게시글입니다.

다음과 같은 태그들이 포함되어 있습니다:
- 캠프
- 여행
- 영어
- 문화체험
- 정보공유

이 게시글로 태그 검색이 제대로 작동하는지 테스트해보세요!`,
      author: admin._id,
      category: 'info',
      tags: ['캠프', '여행', '영어', '문화체험', '정보공유', 'test'],
      isPublished: true,
      views: 0
    });

    await testPost.save();
    console.log('✅ 태그 테스트 게시글 생성 완료:', testPost.title);
    console.log('🏷️ 포함된 태그:', testPost.tags);

    // 기존 게시글들의 태그 상태도 확인
    const postsWithTags = await Post.find({ tags: { $exists: true, $not: { $size: 0 } } });
    console.log('📝 태그가 있는 게시글 수:', postsWithTags.length);
    
    postsWithTags.forEach(post => {
      console.log(`- ${post.title}: [${post.tags.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('❌ 테스트 게시글 생성 중 오류:', error);
  }
};

const main = async () => {
  await connectDB();
  await createTestPost();
  await mongoose.connection.close();
  console.log('🔌 데이터베이스 연결 종료');
  process.exit(0);
};

main(); 