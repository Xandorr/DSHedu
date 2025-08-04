const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/posts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// 게시글 목록 조회
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;

    let query = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      console.log('🔍 검색어:', search);
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ];
      console.log('🏷️ 태그 검색 조건 추가됨, 검색 조건:', JSON.stringify(query.$or, null, 2));
    }

    console.log('📝 게시글 조회 쿼리:', JSON.stringify(query, null, 2));

    const skip = (page - 1) * limit;

    let posts = [];
    let total = 0;

    try {
      // 공지사항 우선, 그 다음 최신순으로 정렬
      posts = await Post.find(query)
        .populate('author', 'name email')
        .sort({ 
          category: 1,  // notice가 먼저 오도록 (알파벳 순서상 notice < general < info < qna)
          createdAt: -1 
        })
        .skip(skip)
        .limit(limit);

      // 공지사항을 맨 앞으로 이동시키는 추가 정렬
      posts.sort((a, b) => {
        if (a.category === 'notice' && b.category !== 'notice') return -1;
        if (a.category !== 'notice' && b.category === 'notice') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      total = await Post.countDocuments(query);
    } catch (dbError) {
      console.log('❌ 데이터베이스 연결 실패, 테스트 데이터 사용:', dbError.message);
      
      // 테스트 데이터 (MongoDB 연결 실패 시)
      const testPosts = [
        {
          _id: '1',
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
          category: 'notice',
          author: { _id: req.user?._id || '1', name: req.user?.name || '관리자', email: req.user?.email || 'admin@dshedu.net' },
          createdAt: new Date('2024-12-15'),
          tags: ['이용수칙', '안내', '커뮤니티', '공지'],
          views: 234,
          likes: [],
          getExcerpt: function(length = 100) {
            return this.content.substring(0, length) + '...';
          }
        },
        {
          _id: '2',
          title: '🎉 DSH에듀 커뮤니티에 오신 것을 환영합니다!',
          content: `안녕하세요! DSH에듀 커뮤니티에 오신 것을 진심으로 환영합니다.

이곳은 미국 캠프 프로그램에 참여하신 분들과 관심 있는 분들이 모여 소중한 경험과 정보를 나누는 공간입니다.

**커뮤니티 이용 안내:**
- 🗣️ 자유게시판: 일상 이야기, 질문, 정보 공유
- 📊 정보 공유: 캠프 참여 정보와 경험담
- 📢 공지사항: 중요한 안내사항
- ❓ Q&A: 궁금한 점 문의

많은 참여 부탁드립니다! 😊`,
          category: 'notice',
          author: { _id: req.user?._id || '1', name: req.user?.name || '관리자', email: req.user?.email || 'admin@dshedu.net' },
          createdAt: new Date('2025-03-01'),
          tags: ['환영', '안내', '커뮤니티'],
          views: 156,
          likes: [],
          getExcerpt: function(length = 100) {
            return this.content.substring(0, length) + '...';
          }
        },
        {
          _id: '3',
          title: '2024년 여름 캠프 참여 정보 공유 - 정말 잊을 수 없는 경험이었어요!',
          content: `이번 여름 DSH에듀 캠프에 참여했는데, 정말 환상적인 경험이었습니다!

**유용한 정보들:**
1. 다양한 국가의 친구들과 만날 수 있었어요
2. 영어 실력이 눈에 띄게 향상되었습니다
3. 미국 문화를 직접 체험할 수 있었어요
4. 독립성과 자신감이 많이 늘었습니다

특히 홈스테이 가족들이 정말 친절하셨고, 현지 학교 수업도 흥미로웠어요.

내년에도 꼭 참여하고 싶습니다! 추천해요 👍`,
          category: 'info',
          author: { _id: req.user?._id || '1', name: req.user?.name || '김수진', email: 'student@dshedu.net' },
          createdAt: new Date('2024-11-28'),
          tags: ['여름캠프', '정보공유', '영어', '문화체험'],
          views: 89,
          likes: [],
          getExcerpt: function(length = 100) {
            return this.content.substring(0, length) + '...';
          }
        },
        {
          _id: '4',
          title: '캠프 준비할 때 꼭 챙겨야 할 것들은?',
          content: `안녕하세요! 내년 여름 캠프 참여를 계획하고 있는데, 미리 준비해야 할 것들이 궁금합니다.

**특히 궁금한 점들:**
- 어떤 옷들을 가져가야 할까요?
- 한국 음식이나 선물을 가져가도 괜찮나요?
- 휴대폰 사용은 어떻게 되나요?
- 용돈은 얼마 정도 가져가는 게 좋을까요?

경험자분들의 조언 부탁드려요! 🙏`,
          category: 'qna',
          author: { _id: req.user?._id || '1', name: req.user?.name || '이민준', email: 'parent@dshedu.net' },
          createdAt: new Date('2024-11-25'),
          tags: ['준비물', 'Q&A', '조언'],
          views: 34,
          likes: [],
          getExcerpt: function(length = 100) {
            return this.content.substring(0, length) + '...';
          }
        }
      ];

             // 카테고리 필터링
       if (category && category !== 'all') {
         posts = testPosts.filter(post => post.category === category);
       } else {
         posts = testPosts;
       }

       // 검색 필터링
       if (search) {
         posts = posts.filter(post => 
           post.title.toLowerCase().includes(search.toLowerCase()) ||
           post.content.toLowerCase().includes(search.toLowerCase()) ||
           (post.tags && post.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
         );
       }

       // 공지사항 우선 정렬
       posts.sort((a, b) => {
         if (a.category === 'notice' && b.category !== 'notice') return -1;
         if (a.category !== 'notice' && b.category === 'notice') return 1;
         return new Date(b.createdAt) - new Date(a.createdAt);
       });

       total = posts.length;
       posts = posts.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(total / limit);

    console.log('📝 조회된 게시글 수:', posts.length);
    console.log('📝 전체 게시글 수:', total);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    }

    res.render('posts/index', {
      title: '커뮤니티',
      description: 'DSH에듀 회원 커뮤니티',
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      category: category || 'all',
      search: search || '',
      user: req.user
    });

  } catch (error) {
    console.error('게시글 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 게시글 상세 조회
exports.getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    console.log('📖 게시글 상세 조회:', postId);
    
    let post;
    let comments = [];

    try {
      // MongoDB에서 게시글 조회 시도
      post = await Post.findById(postId)
        .populate('author', 'name email role createdAt')
        .populate('likes', 'name');

      if (post) {
        // 조회수 증가
        await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });

        // 댓글 조회
        comments = await Comment.find({ post: postId, parentComment: null, isDeleted: false })
          .populate('author', 'name email role')
          .sort({ createdAt: 1 });

        console.log('✅ 게시글 조회 성공:', post.title);
      }
    } catch (dbError) {
      console.log('❌ 데이터베이스 연결 실패, 테스트 데이터 사용:', dbError.message);
      
      // 테스트 데이터
      const testPosts = [
        {
          _id: '1',
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

따라서 프로그램 후기 관련 글은 정리 후 이동될 수 있음을 미리 양해 부탁드립니다. 😊

궁금한 사항이 있으시면 언제든 Q&A 게시판이나 문의하기를 통해 연락주세요!

감사합니다. 🙏`,
          category: 'notice',
          author: { _id: '1', name: '관리자', email: 'admin@dshedu.net', role: 'admin' },
          createdAt: new Date('2024-12-15'),
          tags: ['이용수칙', '안내', '커뮤니티', '공지'],
          views: 234,
          likes: [],
          getExcerpt: function(length = 100) {
            return this.content.substring(0, length) + '...';
          }
        },
                 {
           _id: '2',
           title: '🎉 DSH에듀 커뮤니티에 오신 것을 환영합니다!',
           content: `안녕하세요! DSH에듀 커뮤니티에 오신 것을 진심으로 환영합니다.

이곳은 미국 캠프 프로그램에 참여하신 분들과 관심 있는 분들이 모여 소중한 경험과 정보를 나누는 공간입니다.

**커뮤니티 이용 안내:**
- 🗣️ 자유게시판: 일상 이야기, 질문, 정보 공유
- 📊 정보 공유: 캠프 참여 정보와 경험담
- 📢 공지사항: 중요한 안내사항
- ❓ Q&A: 궁금한 점 문의

많은 참여 부탁드립니다! 😊`,
           category: 'notice',
           author: { _id: '1', name: '관리자', email: 'admin@dshedu.net', role: 'admin' },
           createdAt: new Date('2025-03-01'),
          tags: ['환영', '안내', '커뮤니티'],
          views: 156,
          likes: [],
          getExcerpt: function(length = 100) {
            return this.content.substring(0, length) + '...';
          }
        }
      ];

      post = testPosts.find(p => p._id === postId);
    }

    if (!post) {
      console.log('❌ 게시글을 찾을 수 없음:', postId);
      return res.status(404).render('error', {
        title: '게시글을 찾을 수 없습니다',
        message: '요청하신 게시글이 존재하지 않습니다.',
        user: req.user
      });
    }

    console.log('📝 댓글 수:', comments.length);

    res.render('posts/show', {
      title: post.title,
      description: typeof post.getExcerpt === 'function' ? post.getExcerpt(160) : post.content.substring(0, 160) + '...',
      post,
      comments,
      user: req.user
    });

  } catch (error) {
    console.error('게시글 조회 오류:', error);
    res.status(500).render('error', {
      title: '오류가 발생했습니다',
      message: '게시글을 불러오는 중 오류가 발생했습니다.',
      user: req.user
    });
  }
};

// 게시글 작성 폼
exports.getCreatePost = (req, res) => {
  res.render('posts/create', {
    title: '새 글 작성',
    description: '새로운 게시글을 작성해보세요',
    user: req.user
  });
};

// 게시글 작성
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags, youtubeUrl } = req.body;
    
    console.log('📝 게시글 작성 시도:', { title, category, content: content?.substring(0, 50) + '...' });
    
    const images = req.files ? req.files.map(file => `/uploads/posts/${file.filename}`) : [];

    const post = new Post({
      title,
      content,
      author: req.user._id,
      category: category || 'general',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      youtubeUrl: youtubeUrl || '',
      images,
      isPublished: true // 명시적으로 설정
    });

    const savedPost = await post.save();
    console.log('✅ 게시글 저장 완료:', savedPost._id, savedPost.title);

    res.redirect(`/posts/${savedPost._id}`);

  } catch (error) {
    console.error('게시글 작성 오류:', error);
    res.status(500).render('posts/create', {
      title: '새 글 작성',
      description: '새로운 게시글을 작성해보세요',
      user: req.user,
      error: '게시글 작성 중 오류가 발생했습니다.',
      formData: req.body
    });
  }
};

// 게시글 수정 폼
exports.getEditPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).render('error', {
        title: '게시글을 찾을 수 없습니다',
        message: '요청하신 게시글이 존재하지 않습니다.',
        user: req.user
      });
    }

    // 권한 확인
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).render('error', {
        title: '접근 권한이 없습니다',
        message: '이 게시글을 수정할 권한이 없습니다.',
        user: req.user
      });
    }

    res.render('posts/edit', {
      title: '게시글 수정',
      description: '게시글을 수정합니다',
      post,
      user: req.user
    });

  } catch (error) {
    console.error('게시글 수정 폼 오류:', error);
    res.status(500).render('error', {
      title: '오류가 발생했습니다',
      message: '게시글 수정 페이지를 불러오는 중 오류가 발생했습니다.',
      user: req.user
    });
  }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
  try {
    const { title, content, category, tags, youtubeUrl, removeImages } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    // 기존 이미지 처리
    let currentImages = [...post.images];
    
    // 삭제할 이미지들 처리
    if (removeImages) {
      try {
        const indicesToRemove = JSON.parse(removeImages);
        console.log('삭제할 이미지 인덱스들:', indicesToRemove);
        
        // 인덱스를 역순으로 정렬하여 삭제 (큰 인덱스부터 삭제해야 인덱스 변경 방지)
        indicesToRemove.sort((a, b) => b - a);
        
        indicesToRemove.forEach(index => {
          if (index >= 0 && index < currentImages.length) {
            const imagePath = currentImages[index];
            
            // 실제 파일 삭제
            if (imagePath) {
              const fullPath = path.join(__dirname, '..', 'public', imagePath);
              if (fs.existsSync(fullPath)) {
                try {
                  fs.unlinkSync(fullPath);
                  console.log('이미지 파일 삭제됨:', fullPath);
                } catch (fileError) {
                  console.error('이미지 파일 삭제 실패:', fileError);
                }
              }
            }
            
            // 배열에서 제거
            currentImages.splice(index, 1);
          }
        });
      } catch (parseError) {
        console.error('removeImages 파싱 오류:', parseError);
      }
    }

    // 새로운 이미지 추가
    const newImages = req.files ? req.files.map(file => `/uploads/posts/${file.filename}`) : [];
    
    post.title = title;
    post.content = content;
    post.category = category || 'general';
    post.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
    post.youtubeUrl = youtubeUrl || '';
    post.images = [...currentImages, ...newImages];
    post.updatedAt = new Date();

    await post.save();

    console.log('게시글 수정 완료:', {
      제목: post.title,
      기존이미지수: post.images.length - newImages.length,
      새이미지수: newImages.length,
      최종이미지수: post.images.length
    });

    res.redirect(`/posts/${post._id}`);

  } catch (error) {
    console.error('게시글 수정 오류:', error);
    res.status(500).json({ error: '게시글 수정 중 오류가 발생했습니다.' });
  }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    // 관련 댓글들도 삭제
    await Comment.deleteMany({ post: req.params.id });

    // 업로드된 이미지 파일들 삭제
    post.images.forEach(imagePath => {
      const fullPath = path.join(__dirname, '..', 'public', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await Post.findByIdAndDelete(req.params.id);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ message: '게시글이 삭제되었습니다.' });
    }

    res.redirect('/posts');

  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    res.status(500).json({ error: '게시글 삭제 중 오류가 발생했습니다.' });
  }
};

// 댓글 작성
exports.createComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const postId = req.params.id;

    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      parentComment: parentComment || null
    });

    await comment.save();
    await comment.populate('author', 'name email role');

    res.json({
      success: true,
      comment
    });

  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.json({ message: '댓글이 삭제되었습니다.' });

  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
  }
};

// 좋아요 토글
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // 좋아요 취소
      post.likes.splice(likeIndex, 1);
    } else {
      // 좋아요 추가
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      liked: likeIndex === -1,
      likesCount: post.likes.length
    });

  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
  }
};

module.exports = {
  upload: upload.array('images', 5), // 최대 5개 이미지
  ...exports
}; 