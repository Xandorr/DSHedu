const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const mongoose = require('mongoose');
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

    // 비밀글 필터링: 작성자와 관리자만 볼 수 있음
    if (req.user) {
      if (req.user.role === 'admin') {
        // 관리자: 모든 게시글 볼 수 있음 (비밀글 제한 없음)
        // query에 isPrivate 조건을 추가하지 않음
      } else {
        // 일반 사용자: 자신의 비밀글 + 모든 공개글 (isPrivate가 false이거나 null/undefined인 경우)
        query.$or = [
          { isPrivate: false }, // 공개글
          { isPrivate: { $exists: false } }, // isPrivate 필드가 없는 기존 게시글
          { isPrivate: null }, // isPrivate가 null인 기존 게시글
          { isPrivate: true, author: req.user._id } // 자신의 비밀글
        ];
      }
    } else {
      // 비로그인 사용자: 공개글만 (isPrivate가 false이거나 null/undefined인 경우)
      query.$or = [
        { isPrivate: false },
        { isPrivate: { $exists: false } },
        { isPrivate: null }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      console.log('🔍 검색어:', search);
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ];
      
      // 기존 비밀글 조건과 검색 조건을 결합
      if (query.$or) {
        // 비밀글 조건이 있는 경우, 검색 조건과 AND로 결합
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
      console.log('🏷️ 태그 검색 조건 추가됨, 검색 조건:', JSON.stringify(searchConditions, null, 2));
    }

    console.log('📝 게시글 조회 쿼리:', JSON.stringify(query, null, 2));

    const skip = (page - 1) * limit;

    let posts = [];
    let total = 0;

    try {
      // 공지사항 우선, 그 다음 최신순으로 정렬
      posts = await Post.find(query)
        .populate('author', 'name email profilePhoto role communityLevel activityStats')
        .populate('likes', 'name')
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

      // 모든 작성자의 통계를 한 번에 계산 (성능 최적화)
      try {
        // 작성자가 존재하는 게시글만 필터링
        const validPosts = posts.filter(post => post.author && post.author._id);
        const authorIds = [...new Set(validPosts.map(post => post.author._id.toString()))];
        
        if (authorIds.length > 0) {
          // 게시글 수 통계 계산
          const postsStats = await Post.aggregate([
            { $match: { author: { $in: authorIds.map(id => new mongoose.Types.ObjectId(id)) }, isPublished: true } },
            { $group: { _id: '$author', count: { $sum: 1 } } }
          ]);
          
          // 댓글 수 통계 계산
          const commentsStats = await Comment.aggregate([
            { $match: { author: { $in: authorIds.map(id => new mongoose.Types.ObjectId(id)) }, isDeleted: false } },
            { $group: { _id: '$author', count: { $sum: 1 } } }
          ]);
          
          // 좋아요 수 통계 계산
          const likesStats = await Post.aggregate([
            { $match: { author: { $in: authorIds.map(id => new mongoose.Types.ObjectId(id)) }, isPublished: true } },
            { $project: { author: 1, likesCount: { $size: { $ifNull: ["$likes", []] } } } },
            { $group: { _id: '$author', count: { $sum: '$likesCount' } } }
          ]);
          
          // 통계 데이터를 Map으로 변환하여 빠른 조회
          const postsMap = new Map(postsStats.map(stat => [stat._id.toString(), stat.count]));
          const commentsMap = new Map(commentsStats.map(stat => [stat._id.toString(), stat.count]));
          const likesMap = new Map(likesStats.map(stat => [stat._id.toString(), stat.count]));
          
          // 각 게시글의 작성자 통계 업데이트
          posts.forEach(post => {
            if (post.author && post.author._id) {
              const authorId = post.author._id.toString();
              post.author.activityStats = {
                postsCount: postsMap.get(authorId) || 0,
                commentsCount: commentsMap.get(authorId) || 0,
                likesReceived: likesMap.get(authorId) || 0,
                lastActiveAt: post.author.activityStats?.lastActiveAt || new Date()
              };
            } else {
              // 작성자가 삭제된 경우 기본값 설정
              post.author = {
                name: '삭제된 사용자',
                email: 'deleted@user.com',
                role: 'user',
                profilePhoto: null,
                communityLevel: null,
                activityStats: {
                  postsCount: 0,
                  commentsCount: 0,
                  likesReceived: 0,
                  lastActiveAt: new Date()
                }
              };
            }
          });
          
          console.log('📊 통계 계산 최적화 완료:', { 
            authors: authorIds.length, 
            posts: postsStats.length, 
            comments: commentsStats.length, 
            likes: likesStats.length 
          });
        }
      } catch (statsError) {
        console.log('통계 계산 오류 (무시 가능):', statsError.message);
        // 오류 발생 시 기존 방식으로 fallback
        for (let post of posts) {
          if (post.author && post.author._id) {
            post.author.activityStats = {
              postsCount: 0,
              commentsCount: 0,
              likesReceived: 0,
              lastActiveAt: post.author.activityStats?.lastActiveAt || new Date()
            };
          } else {
            // 작성자가 삭제된 경우 기본값 설정
            post.author = {
              name: '삭제된 사용자',
              email: 'deleted@user.com',
              role: 'user',
              profilePhoto: null,
              communityLevel: null,
              activityStats: {
                postsCount: 0,
                commentsCount: 0,
                likesReceived: 0,
                lastActiveAt: new Date()
              }
            };
          }
        }
      }

      // 각 게시글에 사용자의 좋아요 상태 추가
      if (req.user) {
        posts.forEach(post => {
          const isLiked = post.likes.some(like => {
            const likeId = like._id ? like._id.toString() : like.toString();
            return likeId === req.user._id.toString();
          });
          post.isLiked = isLiked;
        });
      }

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
          isLiked: false,
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
          isLiked: false,
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
          isLiked: false,
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
          isLiked: false,
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
      user: req.user,
      req: req
    });

  } catch (error) {
    console.error('게시글 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 게시글 상세 조회
exports.getPost = async (req, res) => {
  const postId = req.params.id;
  
  console.log('📖 게시글 상세 조회:', postId);
  
  let post;
  let comments = [];
  let recentPosts = [];

  try {
    // MongoDB에서 게시글 조회 시도
    post = await Post.findById(postId)
      .populate('author', 'name email role createdAt profilePhoto communityLevel activityStats')
      .populate('likes', 'name');

    if (post) {
      // 작성자가 존재하는지 확인
      if (post.author && post.author._id) {
        // 작성자의 실제 통계 계산 (최적화된 방식)
        try {
          const authorId = post.author._id;
          
          // 한 번의 aggregate 쿼리로 모든 통계 계산
          const stats = await Post.aggregate([
            {
              $facet: {
                postsCount: [
                  { $match: { author: authorId, isPublished: true } },
                  { $count: "count" }
                ],
                commentsCount: [
                  { $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'post',
                    as: 'comments'
                  }},
                  { $match: { author: authorId, 'comments.isDeleted': { $ne: true } } },
                  { $count: "count" }
                ],
                likesReceived: [
                  { $match: { author: authorId, isPublished: true } },
                  { $project: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
                  { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } },
                  { $project: { count: "$totalLikes" } }
                ]
              }
            }
          ]);
          
          const postsCount = stats[0].postsCount[0]?.count || 0;
          const commentsCount = await Comment.countDocuments({ author: authorId, isDeleted: false });
          const likesReceived = stats[0].likesReceived[0]?.count || 0;
          
          // activityStats 업데이트
          post.author.activityStats = {
            postsCount,
            commentsCount,
            likesReceived,
            lastActiveAt: post.author.activityStats?.lastActiveAt || new Date()
          };
          
          console.log(`📊 ${post.author.name}님 실제 통계: 게시글 ${postsCount}, 댓글 ${commentsCount}, 좋아요 ${likesReceived}`);
        } catch (statsError) {
          console.log('통계 계산 오류 (무시 가능):', statsError.message);
          // 오류 발생 시 기본값 설정
          post.author.activityStats = {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: post.author.activityStats?.lastActiveAt || new Date()
          };
        }
      } else {
        // 작성자가 삭제된 경우 기본값 설정
        post.author = {
          name: '삭제된 사용자',
          email: 'deleted@user.com',
          role: 'user',
          profilePhoto: null,
          communityLevel: null,
          activityStats: {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: new Date()
          }
        };
        console.log('⚠️ 작성자가 삭제된 게시글입니다.');
      }
      
      // 비밀글 접근 권한 확인
      if (post.isPrivate) {
        if (!req.user) {
          return res.status(403).render('error', {
            title: '접근 권한 없음',
            message: '비밀글은 로그인이 필요합니다.',
            user: req.user
          });
        }
        
        const isAuthor = post.author._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isAuthor && !isAdmin) {
          return res.status(403).render('error', {
            title: '접근 권한 없음',
            message: '비밀글은 작성자와 관리자만 볼 수 있습니다.',
            user: req.user
          });
        }
      }

      // 조회수 증가
      await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });

      // 댓글 조회
      comments = await Comment.find({ post: postId, parentComment: null, isDeleted: false })
        .populate('author', 'name email role profilePhoto communityLevel activityStats')
        .sort({ createdAt: 1 });
      
      // 댓글 작성자가 삭제된 경우 처리
      comments = comments.map(comment => {
        if (!comment.author || !comment.author._id) {
          comment.author = {
            name: '삭제된 사용자',
            email: 'deleted@user.com',
            role: 'user',
            profilePhoto: null,
            communityLevel: null,
            activityStats: {
              postsCount: 0,
              commentsCount: 0,
              likesReceived: 0,
              lastActiveAt: new Date()
            }
          };
        }
        return comment;
      });

      // 최근 게시글 조회 (현재 게시글 제외)
      let recentQuery = { 
        isPublished: true, 
        _id: { $ne: postId }
      };

      // 비밀글 필터링
      if (req.user) {
        if (req.user.role === 'admin') {
          // 관리자: 모든 게시글 볼 수 있음
        } else {
          recentQuery.$or = [
            { isPrivate: false },
            { isPrivate: { $exists: false } },
            { isPrivate: null },
            { isPrivate: true, author: req.user._id }
          ];
        }
      } else {
        recentQuery.$or = [
          { isPrivate: false },
          { isPrivate: { $exists: false } },
          { isPrivate: null }
        ];
      }

      recentPosts = await Post.find(recentQuery)
        .populate('author', 'name email role profilePhoto communityLevel activityStats')
        .sort({ createdAt: -1 })
        .limit(5);
      
      // 최근 게시글 작성자가 삭제된 경우 처리
      recentPosts = recentPosts.map(post => {
        if (!post.author || !post.author._id) {
          post.author = {
            name: '삭제된 사용자',
            email: 'deleted@user.com',
            role: 'user',
            profilePhoto: null,
            communityLevel: null,
            activityStats: {
              postsCount: 0,
              commentsCount: 0,
              likesReceived: 0,
              lastActiveAt: new Date()
            }
          };
        }
        return post;
      });

      // 사용자의 좋아요 상태 추가
      if (req.user) {
        const isLiked = post.likes.some(like => {
          const likeId = like._id ? like._id.toString() : like.toString();
          return likeId === req.user._id.toString();
        });
        post.isLiked = isLiked;
      }

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
        isLiked: false,
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
        isLiked: false,
        getExcerpt: function(length = 100) {
          return this.content.substring(0, length) + '...';
        }
      }
    ];

    post = testPosts.find(p => p._id === postId);
    
    // 테스트 데이터에서 최근 게시글 조회 (현재 게시글 제외)
    recentPosts = testPosts
      .filter(p => p._id !== postId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
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
    recentPosts,
    user: req.user,
    req: req
  });
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
    const { title, content, category, tags, youtubeUrl, isPrivate } = req.body;
    
    console.log('📝 게시글 작성 시도:', { title, category, content: content?.substring(0, 50) + '...', isPrivate });
    
    const images = req.files ? req.files.map(file => `/uploads/posts/${file.filename}`) : [];

    const post = new Post({
      title,
      content,
      author: req.user._id,
      category: category || 'general',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      youtubeUrl: youtubeUrl || '',
      images,
      isPublished: true, // 명시적으로 설정
      isPrivate: isPrivate === 'true' || isPrivate === true // 비밀글 설정
    });

    const savedPost = await post.save();
    console.log('✅ 게시글 저장 완료:', savedPost._id, savedPost.title);

    // 게시글 작성자에게 경험치 지급
    try {
      const author = await User.findById(req.user._id);
      if (author) {
        const result = await author.addExperience(50, '게시글 작성');
        author.activityStats.postsCount += 1;
        // 좋아요 개수를 0으로 초기화 (aggregate 쿼리로 정확히 계산되므로)
        author.activityStats.likesReceived = 0;
        await author.save();
        
        if (result.levelUp) {
          console.log(`🎉 ${author.name}님이 레벨업! ${result.newLevel}레벨 (${result.newTitle})`);
        }
      }
    } catch (error) {
      console.log('경험치 지급 오류 (무시 가능):', error.message);
    }

    // 검색엔진에 새로운 콘텐츠 알림 (비동기)
    setImmediate(() => {
      try {
        const SearchEngineSubmitter = require('../scripts/submit-to-search-engines');
        const submitter = new SearchEngineSubmitter(`${req.protocol}://${req.get('host')}`);
        submitter.notifyNewContent(`${req.protocol}://${req.get('host')}/posts/${savedPost._id}`);
      } catch (error) {
        console.log('검색엔진 알림 오류 (무시 가능):', error.message);
      }
    });

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
    await comment.populate('author', 'name email role profilePhoto communityLevel activityStats');

    // 댓글 작성자에게 경험치 지급
    try {
      const author = await User.findById(req.user._id);
      if (author) {
        const result = await author.addExperience(10, '댓글 작성');
        author.activityStats.commentsCount += 1;
        // 좋아요 개수를 0으로 초기화 (aggregate 쿼리로 정확히 계산되므로)
        author.activityStats.likesReceived = 0;
        await author.save();
        
        if (result.levelUp) {
          console.log(`🎉 ${author.name}님이 레벨업! ${result.newLevel}레벨 (${result.newTitle})`);
        }
      }
    } catch (error) {
      console.log('댓글 경험치 지급 오류 (무시 가능):', error.message);
    }

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
      
      // 게시글 작성자에게 좋아요 경험치 지급 (자신의 게시글이 아닌 경우만)
      if (post.author.toString() !== userId.toString()) {
        try {
          const postAuthor = await User.findById(post.author);
          if (postAuthor) {
            await postAuthor.addExperience(5, '좋아요 받음');
            // likesReceived는 aggregate 쿼리로 정확히 계산되므로 수동 증가 제거
            await postAuthor.save();
          }
        } catch (error) {
          console.log('좋아요 경험치 지급 오류 (무시 가능):', error.message);
        }
      }
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