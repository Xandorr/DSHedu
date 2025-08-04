require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

// MongoDB 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/education-camps', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

const createNotice = async () => {
  try {
    // 관리자 계정 찾기 또는 생성
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('관리자 계정을 찾을 수 없어 새로 생성합니다...');
      admin = new User({
        name: '관리자',
        email: 'admin@dshedu.net',
        password: 'hashed_password', // 실제로는 해시된 비밀번호
        role: 'admin'
      });
      await admin.save();
      console.log('✅ 관리자 계정 생성 완료');
    }

    // 기존 이용수칙 공지사항이 있는지 확인
    const existingNotice = await Post.findOne({ 
      title: { $regex: '커뮤니티 이용수칙' },
      category: 'notice'
    });

    if (existingNotice) {
      console.log('✅ 이미 이용수칙 공지사항이 존재합니다:', existingNotice.title);
      return;
    }

    // 공지사항 생성
    const notice = new Post({
      title: '📋 커뮤니티 이용수칙 및 안내사항',
      content: `안녕하세요, DSH에듀 커뮤니티 회원 여러분!

건전하고 유익한 커뮤니티 환경 조성을 위해 다음 이용수칙을 안내드립니다.

## 📝 게시판 이용수칙

**✅ 권장사항**
• 서로 존중하고 배려하는 마음으로 소통해주세요
• 건설적이고 유익한 정보를 공유해주세요
• 궁금한 점은 언제든 Q&A 게시판을 활용해주세요
• 개인정보 보호를 위해 연락처 등 민감정보 공유는 자제해주세요

**❌ 금지사항**
• 욕설, 비방, 차별적 표현
• 상업적 광고나 스팸성 게시물
• 타인의 개인정보 무단 게시
• 저작권을 침해하는 콘텐츠

## 🏕️ 프로그램 관련 특별 안내

**프로그램 참여 경험담의 경우**, 더 많은 분들께 도움이 되도록 저희가 별도로 **공식 후기 페이지**에 정리하여 홈페이지 메인에 소개할 예정입니다. 

이를 위해 프로그램 직접 참여자분들의 소중한 경험담은 **개별 연락**을 통해 정식으로 수집하고 있으며, 게시판에 올려주신 관련 글들은 정리 과정에서 **이동 또는 정리**될 수 있음을 양해 부탁드립니다.

## 💬 카테고리별 이용 가이드

• **자유게시판**: 일상 이야기, 캠프 준비 팁 등 자유로운 소통
• **정보 공유**: 유학/캠프 관련 유용한 정보와 노하우
• **Q&A**: 궁금한 점 질문 및 답변
• **공지사항**: 중요한 안내사항 (관리자만 작성 가능)

## 🤝 함께 만들어가는 커뮤니티

여러분의 적극적인 참여와 배려로 더욱 따뜻하고 유익한 커뮤니티를 만들어가겠습니다.

문의사항이 있으시면 언제든 연락해주세요!

DSH에듀 드림 ❤️`,
      author: admin._id,
      category: 'notice',
      tags: ['이용수칙', '안내', '커뮤니티', '공지'],
      isPublished: true,
      views: 0
    });

    await notice.save();
    console.log('✅ 공지사항 생성 완료:', notice.title);

    // 환영 공지사항도 생성
    const welcomeNotice = await Post.findOne({ 
      title: { $regex: '환영합니다' },
      category: 'notice'
    });

    if (!welcomeNotice) {
      const welcome = new Post({
        title: '🎉 DSH에듀 커뮤니티에 오신 것을 환영합니다!',
        content: `안녕하세요! DSH에듀 커뮤니티에 오신 것을 진심으로 환영합니다.

이곳은 미국 캠프 프로그램에 참여하신 분들과 관심 있는 분들이 모여 소중한 경험과 정보를 나누는 공간입니다.

**커뮤니티 이용 안내:**
- 🗣️ 자유게시판: 일상 이야기, 질문, 정보 공유
- 📊 정보 공유: 캠프 참여 정보와 경험담
- 📢 공지사항: 중요한 안내사항
- ❓ Q&A: 궁금한 점 문의

많은 참여 부탁드립니다! 😊`,
        author: admin._id,
        category: 'notice',
        tags: ['환영', '안내', '커뮤니티'],
        isPublished: true,
        views: 0,
        createdAt: new Date('2025-03-01')
      });

      await welcome.save();
      console.log('✅ 환영 공지사항 생성 완료:', welcome.title);
    }

    console.log('🎉 모든 공지사항 생성이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 공지사항 생성 중 오류 발생:', error);
  }
};

const main = async () => {
  await connectDB();
  await createNotice();
  await mongoose.connection.close();
  console.log('🔌 데이터베이스 연결 종료');
  process.exit(0);
};

main(); 