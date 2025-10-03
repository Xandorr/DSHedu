const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const XLSX = require('xlsx');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Program = require('./models/Program');
const Post = require('./models/Post');
const Enrollment = require('./models/Enrollment');

// Import controllers
const authController = require('./controllers/authController');
const enrollmentController = require('./controllers/enrollmentController');

// Import routes
const authRoutes = require('./routes/auth');
const programRoutes = require('./routes/programs');
const enrollmentRoutes = require('./routes/enrollments');
const postRoutes = require('./routes/posts');
const debugController = require('./controllers/debugController');

// Import middlewares
const { requireAuth, requireAuthJson } = require('./middlewares/auth');
const programController = require('./controllers/programController');

// Import programs configuration (fallback용)
const { programs, getFeaturedPrograms, getProgramsByCategory, getProgramById } = require('./config/programs');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CSP 헤더 완전 제거 미들웨어 (최강 버전)
app.use((req, res, next) => {
  // 모든 CSP 관련 헤더 완전 제거
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('X-XSS-Protection');
  res.removeHeader('Referrer-Policy');
  res.removeHeader('Permissions-Policy');
  
  // CSP 완전 비활성화 - 모든 소스 허용 (더 강력한 설정)
  const cspPolicy = "default-src * 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' data: blob:; connect-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src *; object-src *; media-src *; frame-src *; worker-src *; child-src *; form-action *; frame-ancestors *;";
  
  res.setHeader('Content-Security-Policy', cspPolicy);
  res.setHeader('X-Content-Security-Policy', cspPolicy);
  res.setHeader('X-WebKit-CSP', cspPolicy);
  
  // 추가 헤더 설정으로 CSP 완전 우회
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// 세션 설정 (라우트보다 먼저!)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dsh_edu_secret_key_2024',
  resave: true, // Vercel 서버리스 환경을 위해 true로 변경
  saveUninitialized: true, // Vercel 서버리스 환경을 위해 true로 변경
  store: process.env.MONGODB_URI ? MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // 24시간마다 터치
    ttl: 7 * 24 * 60 * 60 // 7일 TTL로 연장
  }) : undefined, // MongoDB가 없으면 메모리 저장소 사용
  cookie: { 
    secure: false, // Vercel에서도 false로 설정 (프록시 때문)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일로 연장
    httpOnly: false, // JavaScript에서 접근 가능하도록
    sameSite: 'none' // CORS 문제 해결
  },
  name: 'dshedu.session' // 세션 쿠키명 명시
}));

// Passport 초기화 (라우트보다 먼저!)
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// 세션 디버깅 미들웨어
app.use((req, res, next) => {
  if (req.path.includes('/login') || req.path.includes('/auth')) {
    console.log('🔍 세션 디버깅:', {
      path: req.path,
      sessionID: req.sessionID,
      user: req.user ? req.user.email : '없음',
      isAuthenticated: req.isAuthenticated(),
      session: req.session ? '존재' : '없음'
    });
  }
  next();
});

// Passport 직렬화/역직렬화
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('🔍 deserializeUser 호출됨, ID:', id);
    const user = await User.findById(id);
    if (user) {
      console.log('✅ 사용자 발견:', user.name, user.email);
      done(null, user);
    } else {
      console.log('❌ 사용자를 찾을 수 없음, ID:', id);
      done(null, false);
    }
  } catch (err) {
    console.log('❌ deserializeUser 오류:', err.message);
    done(err, null);
  }
});

// 로컬 전략 설정
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      console.log('🔍 로그인 시도:', { email, passwordLength: password.length });
      
      const user = await User.findOne({ email });
      if (!user) {
        console.log('❌ 사용자 없음:', email);
        return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      
      console.log('👤 사용자 발견:', {
        이름: user.name,
        이메일: user.email,
        역할: user.role,
        저장된비밀번호해시: user.password.substring(0, 20) + '...'
      });
      
      // 비밀번호 비교 전에 해시 테스트
      const testHash = await bcrypt.hash(password, 10);
      console.log('🧪 테스트 해시 생성:', testHash.substring(0, 20) + '...');
      
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('🔐 비밀번호 비교 결과:', isMatch);
      
      // 추가 디버깅: 원본 비밀번호로 직접 해시 생성해서 비교
      const directHash = await bcrypt.hash(password, 10);
      const directMatch = await bcrypt.compare(password, directHash);
      console.log('🔬 직접 해시 비교 테스트:', directMatch);
      
      if (!isMatch) {
        console.log('❌ 비밀번호 불일치');
        return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      
      console.log('✅ 로그인 성공:', user.name);
      return done(null, user);
    } catch (err) {
      console.log('❌ 로그인 오류:', err);
      return done(err);
    }
  }
));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/posts', postRoutes);

// RSS 피드 생성
app.get('/rss.xml', async (req, res) => {
  try {
    const posts = await Post.find({ isPublished: true })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DSH에듀 커뮤니티</title>
    <description>DSH에듀 회원 커뮤니티의 최신 게시글</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

    posts.forEach(post => {
      const postUrl = `${baseUrl}/posts/${post._id}`;
      const pubDate = new Date(post.createdAt).toUTCString();
      const description = post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content;
      
      rss += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${post.author.name}]]></author>
      <category><![CDATA[${post.category}]]></category>
    </item>`;
    });

    rss += `
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    console.error('RSS 피드 생성 오류:', error);
    res.status(500).send('RSS 피드 생성 중 오류가 발생했습니다.');
  }
});

// SEO Routes
app.get('/sitemap.xml', async (req, res) => {
  try {
    const posts = await Post.find({ isPublished: true })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(1000); // 최대 1000개 게시글
    
    const programs = await Program.find({ isActive: true })
      .sort({ sortOrder: 1 });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 메인 페이지들
    const mainPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/programs', priority: '0.9', changefreq: 'weekly' },
      { url: '/posts', priority: '0.9', changefreq: 'daily' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' }
    ];

    mainPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // 프로그램 페이지들
    programs.forEach(program => {
      sitemap += `
  <url>
    <loc>${baseUrl}/programs/${program._id}</loc>
    <lastmod>${new Date(program.updatedAt || program.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // 게시글 페이지들
    posts.forEach(post => {
      sitemap += `
  <url>
    <loc>${baseUrl}/posts/${post._id}</loc>
    <lastmod>${new Date(post.updatedAt || post.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    res.set('Content-Type', 'text/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('사이트맵 생성 오류:', error);
    res.status(500).send('사이트맵 생성 중 오류가 발생했습니다.');
  }
});

// Debug route
app.get('/debug/auth', debugController.debugAuth);

// Main routes
app.get('/', async (req, res) => {
  try {
    console.log('🏠 메인 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
    
    // MongoDB에서 활성화된 프로그램들 가져오기 (sortOrder로 정렬)
    const activePrograms = await Program.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
    
    // featured 프로그램들 필터링
    const featuredPrograms = activePrograms; // 모든 프로그램을 슬라이더에 표시
    
    // 추천 게시글 가져오기 (관리자가 선택한 게시글들, 최대 6개)
    const featuredPosts = await Post.find({ 
      isFeatured: true,
      isPublished: true 
    })
    .populate('author', 'name')
    .sort({ createdAt: -1 })
    .limit(6);
    
    console.log('📊 메인 페이지 데이터 로드:', {
      프로그램: activePrograms.length,
      추천글: featuredPosts.length
    });
    
    res.render('index', { 
      title: 'US Summer & Winter Camps for Korean Students',
      description: 'Discover enriching camp programs for Korean students in the United States',
      featuredPrograms: featuredPrograms,
      programs: activePrograms,
      featuredPosts: featuredPosts,
      user: req.user,
      req: req
    });
  } catch (error) {
    console.error('❌ 메인 페이지 로드 오류:', error);
    
    // MongoDB 연결 실패 시 기본 데이터로 렌더링
    try {
      const featuredPrograms = getFeaturedPrograms();
      res.render('index', { 
        title: 'US Summer & Winter Camps for Korean Students',
        description: 'Discover enriching camp programs for Korean students in the United States',
        featuredPrograms: featuredPrograms,
        programs: featuredPrograms,
        featuredPosts: [],
        user: req.user,
        req: req
      });
    } catch (renderError) {
      console.error('❌ 렌더링 실패:', renderError);
      res.status(500).send('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }
});

app.get('/programs', async (req, res) => {
  try {
    console.log('📚 프로그램 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
    
    const { category } = req.query;
    let query = { isActive: true };
    
    // 카테고리 필터링
    if (category) {
      query.category = category;
    }
    
    // MongoDB에서 프로그램 가져오기 (sortOrder로 정렬)
    const programsFromDB = await Program.find(query).sort({ sortOrder: 1, createdAt: -1 });
    
    console.log('📊 프로그램 페이지 로드:', {
      카테고리: category || '전체',
      프로그램수: programsFromDB.length
    });
    
    res.render('programs', { 
      title: 'Our Programs',
      description: 'Explore our summer and winter camp programs',
      programs: programsFromDB,
      selectedCategory: category,
      user: req.user
    });
  } catch (error) {
    console.error('❌ 프로그램 페이지 로드 오류:', error);
    
    // 에러 시 정적 데이터 사용 (fallback)
    const { category } = req.query;
    let filteredPrograms = programs;
    
    if (category) {
      filteredPrograms = getProgramsByCategory(category);
    }
    
    res.render('programs', { 
      title: 'Our Programs',
      description: 'Explore our summer and winter camp programs',
      programs: filteredPrograms,
      selectedCategory: category,
      user: req.user
    });
  }
});

app.get('/about', (req, res) => {
  console.log('ℹ️ 소개 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('about', { 
    title: 'About Us',
    description: 'Learn about our mission and vision',
    user: req.user
  });
});

app.get('/contact', (req, res) => {
  console.log('📞 문의 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('contact', { 
    title: 'Contact Us',
    description: 'Get in touch with our team',
    user: req.user
  });
});

// 로그인 라우트는 아래에 있음 (중복 제거)

app.get('/register', (req, res) => {
  console.log('📝 회원가입 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('register', { 
    title: 'Register',
    description: 'Create a new account',
    user: req.user
  });
});

app.get('/dashboard', requireAuth, (req, res) => {
  console.log('📊 대시보드 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('dashboard', { 
    title: 'Dashboard',
    description: 'Manage your enrollments',
    user: req.user
  });
});

app.get('/dashboard/profile', requireAuth, (req, res) => {
  console.log('👤 프로필 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('profile', { 
    title: 'My Profile',
    description: 'Manage your profile information',
    user: req.user
  });
});

app.get('/dashboard/enrollments', requireAuth, async (req, res) => {
  try {
    console.log('📋 등록 현황 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
    
    // 사용자의 등록 현황 가져오기 (찜한 프로그램 포함)
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('program', 'title startDate endDate originalPrice price category location photos description')
      .sort({ createdAt: -1 });
    
    console.log('📊 등록 현황 조회 결과:', {
      총개수: enrollments.length,
      찜한프로그램: enrollments.filter(e => e.status === 'wishlist').length,
      정식등록: enrollments.filter(e => e.status !== 'wishlist').length
    });
    
    res.render('my-enrollments', { 
      title: 'My Enrollments',
      description: 'View your program enrollments',
      user: req.user,
      enrollments: enrollments
    });
  } catch (error) {
    console.error('❌ 등록 현황 조회 오류:', error);
    res.render('my-enrollments', { 
      title: 'My Enrollments',
      description: 'View your program enrollments',
      user: req.user,
      enrollments: []
    });
  }
});

app.get('/admin', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).redirect('/');
  }
  console.log('⚙️ 관리자 패널 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('admin-panel', { 
    title: 'Admin Panel',
    description: 'Administrative control panel',
    user: req.user
  });
});

// 등급 관리 API
app.get('/api/admin/levels', requireAuthJson, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    const users = await User.find({ role: { $ne: 'admin' } })
      .select('name email communityLevel activityStats createdAt')
      .sort({ 'communityLevel.level': -1, 'communityLevel.experience': -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('등급 관리 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '등급 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 추가 API
app.post('/api/admin/users/add', requireAuthJson, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    const { name, email, password, role, phone } = req.body;
    
    // 필수 필드 검증
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '이름, 이메일, 비밀번호는 필수 입력 항목입니다.'
      });
    }

    // 이메일 중복 검사
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다.'
      });
    }

    // 새 사용자 생성
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role || 'parent',
      phone: phone ? phone.trim() : undefined,
      communityLevel: {
        level: 1,
        experience: 0,
        title: '브론즈',
        badges: []
      },
      activityStats: {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        lastActiveAt: new Date()
      }
    });

    await newUser.save();

    console.log(`✅ 관리자가 새 사용자 추가: ${newUser.name} (${newUser.email})`);

    res.json({
      success: true,
      message: '사용자가 성공적으로 추가되었습니다.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('사용자 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 추가 중 오류가 발생했습니다.'
    });
  }
});

// 등급 수동 조정 API
app.post('/api/admin/levels/adjust', requireAuthJson, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    const { userId, experience, reason } = req.body;
    
    if (!userId || experience === undefined) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID와 경험치 값이 필요합니다.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const oldLevel = user.communityLevel.level;
    const oldExp = user.communityLevel.experience;
    
    user.communityLevel.experience = Math.max(0, experience);
    
    // 등급 재계산
    const newLevel = user.calculateLevel();
    if (newLevel !== user.communityLevel.level) {
      user.communityLevel.level = newLevel;
      user.communityLevel.title = user.getLevelTitle(newLevel);
    }
    
    await user.save();

    console.log(`🔧 관리자가 ${user.name}님의 등급 조정: ${oldLevel}레벨(${oldExp}XP) → ${newLevel}레벨(${experience}XP) - ${reason || '수동 조정'}`);

    res.json({
      success: true,
      message: '등급이 성공적으로 조정되었습니다.',
      user: {
        name: user.name,
        oldLevel,
        newLevel: user.communityLevel.level,
        oldExp,
        newExp: user.communityLevel.experience,
        title: user.communityLevel.title
      }
    });
  } catch (error) {
    console.error('등급 조정 오류:', error);
    res.status(500).json({
      success: false,
      message: '등급 조정 중 오류가 발생했습니다.'
    });
  }
});

// 관리자 패널 통계 API
app.get('/api/admin/dashboard/stats', requireAuthJson, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    console.log('📊 관리자 통계 요청');

    // 총 사용자 수
    const totalUsers = await User.countDocuments();

    // 활성 프로그램 수 (isActive가 true인 프로그램)
    const activePrograms = await Program.countDocuments({ isActive: true });

    // 총 진행 중 등록 수 (in-progress 상태만)
    const totalEnrollments = await Enrollment.countDocuments({
      status: 'in-progress'
    });

    // 총 매출 계산 (완료된 등록의 가격 합계)
    const completedEnrollments = await Enrollment.find({
      status: 'completed'
    }).populate('program', 'price');

    const totalRevenue = completedEnrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.program?.price || 0);
    }, 0);

    const stats = {
      totalUsers,
      activePrograms,
      totalEnrollments,
      totalRevenue
    };

    console.log('📊 통계 데이터:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ 관리자 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 데이터를 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 관리자 리포트 다운로드 API
app.get('/api/admin/reports/:type', requireAuthJson, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    const { type } = req.params;
    console.log('📊 관리자 리포트 다운로드 요청:', type);

    let data = [];
    let filename = '';
    let sheetName = '';

    switch (type) {
      case 'users':
        data = await User.find({}).select('-password').lean();
        filename = '사용자_관리_리스트';
        sheetName = '사용자 목록';
        
        // 데이터 포맷팅
        data = data.map(user => ({
          '이름': user.name,
          '이메일': user.email,
          '전화번호': user.phone || '',
          '역할': user.role,
          '가입일': user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '',
          '상태': user.isActive !== false ? '활성' : '비활성'
        }));
        break;

      case 'programs':
        data = await Program.find({}).lean();
        filename = '프로그램_관리_리스트';
        sheetName = '프로그램 목록';
        
        // 데이터 포맷팅
        data = data.map(program => ({
          '제목': program.title,
          '카테고리': program.category,
          '설명': program.description,
          '가격': program.price,
          '정원': program.capacity,
          '등록인원': program.enrolled,
          '시작일': program.startDate ? new Date(program.startDate).toLocaleDateString('ko-KR') : '',
          '종료일': program.endDate ? new Date(program.endDate).toLocaleDateString('ko-KR') : '',
          '상태': program.isActive ? '활성' : '비활성',
          '생성일': program.createdAt ? new Date(program.createdAt).toLocaleDateString('ko-KR') : '',
          // 위치 정보 추가
          '장소명': program.location?.name || '',
          '도시': program.location?.city || '',
          '주소': program.location?.address || '',
          '국가': program.location?.country || '',
          // 연령 및 활동 정보 추가
          '최소연령': program.ageRange?.min || '',
          '최대연령': program.ageRange?.max || '',
          '활동목록': program.activities ? program.activities.join(', ') : '',
          '특징': program.features ? program.features.join(', ') : ''
        }));
        break;

      case 'enrollments':
        data = await Enrollment.find({})
          .populate('user', 'name email')
          .populate('program', 'title price')
          .lean();
        filename = '등록_관리_리스트';
        sheetName = '등록 목록';
        
        // 데이터 포맷팅
        data = data.map(enrollment => ({
          '학생명': enrollment.student?.name || '',
          '학생나이': enrollment.student?.age || '',
          '사용자명': enrollment.user?.name || '',
          '이메일': enrollment.user?.email || '',
          '프로그램명': enrollment.program?.title || '',
          '프로그램가격': enrollment.program?.price || 0,
          '등록상태': enrollment.status,
          '결제상태': enrollment.paymentStatus,
          '비상연락처': enrollment.emergencyContact?.name || '',
          '비상연락처전화': enrollment.emergencyContact?.phone || '',
          '등록일': enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString('ko-KR') : ''
        }));
        break;


      default:
        return res.status(400).json({
          success: false,
          message: '지원하지 않는 리포트 타입입니다.'
        });
    }

    // 엑셀 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // 컬럼 너비 자동 조정
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // 엑셀 파일 생성
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // 파일명에 현재 날짜 추가
    const currentDate = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${currentDate}.xlsx`;
    
    console.log('✅ 엑셀 파일 생성 완료:', finalFilename);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalFilename)}"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ 리포트 다운로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '리포트 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// ===== 프로필 관리 API =====
// 프로필 업데이트
app.put('/api/profile/update', requireAuthJson, authController.upload.single('profilePhoto'), authController.updateProfile);

// 비밀번호 변경
app.put('/api/profile/change-password', requireAuthJson, authController.changePassword);

// 회원 탈퇴
app.delete('/api/profile/delete-account', requireAuthJson, authController.deleteAccount);

// 로그인 상태 확인
app.get('/api/auth/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    } : null
  });
});

// 사용자의 찜 목록 확인
app.get('/api/wishlist/check/:programId', requireAuthJson, async (req, res) => {
  try {
    const { programId } = req.params;
    
    const wishlistItem = await Enrollment.findOne({
      user: req.user._id,
      program: programId,
      status: 'wishlist'
    });

    res.json({
      success: true,
      isWishlisted: !!wishlistItem
    });
  } catch (error) {
    console.error('❌ 찜 목록 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===== 등록 관리 API =====
// 찜하기/등록하기
app.post('/api/enrollments/wishlist/:programId', requireAuthJson, enrollmentController.addToWishlist);

// 사용자의 모든 찜 목록 가져오기
app.get('/api/wishlist/all', requireAuthJson, async (req, res) => {
  try {
    console.log('💖 사용자 찜 목록 조회:', req.user.name);
    
    const wishlistItems = await Enrollment.find({
      user: req.user._id,
      status: 'wishlist'
    }).populate('program', '_id');

    const wishlistedProgramIds = wishlistItems.map(item => item.program._id.toString());
    
    console.log('💖 찜한 프로그램 목록:', wishlistedProgramIds);

    res.json({
      success: true,
      wishlistedPrograms: wishlistedProgramIds
    });
  } catch (error) {
    console.error('❌ 찜 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 찜하기 취소
app.delete('/api/enrollments/wishlist/:programId', requireAuthJson, enrollmentController.removeFromWishlist);

// 찜하기에서 정식 등록으로 전환
app.put('/api/enrollments/:id/enroll', requireAuthJson, enrollmentController.enrollFromWishlist);

// 등록 취소 라우트는 routes/enrollments.js에서 관리됨

// 수료증 다운로드
app.get('/api/enrollments/:id/certificate', requireAuthJson, enrollmentController.downloadCertificate);

// ===== 관리자용 프로그램 관리 라우트 =====
app.get('/admin/programs', requireAuth, programController.getAdminPrograms);
app.get('/admin/programs/:id', requireAuth, programController.getProgramAdmin);
app.post('/admin/programs', requireAuth, programController.upload.array('photos', 5), programController.createProgramAdmin);
app.post('/admin/programs/:id', requireAuth, programController.upload.array('photos', 5), programController.updateProgramAdmin);
app.put('/admin/programs/:id', requireAuth, programController.upload.array('photos', 5), programController.updateProgramAdmin);
app.delete('/admin/programs/:id', requireAuth, programController.deleteProgramAdmin);
app.delete('/admin/programs/:id/images', requireAuth, programController.deleteProgramImage);

// ===== 관리자용 사용자 관리 라우트 =====
app.get('/admin/users', requireAuth, authController.getAdminUsers);
app.get('/admin/users/:id', requireAuth, authController.getAdminUser);
app.put('/admin/users/:id', requireAuth, authController.updateAdminUser);
app.delete('/admin/users/:id', requireAuth, authController.deleteAdminUser);

// ===== 관리자용 등록 관리 라우트 =====
app.get('/admin/enrollments', requireAuth, enrollmentController.getAdminEnrollments);
app.put('/admin/enrollments/:id/status', requireAuth, enrollmentController.updateAdminEnrollmentStatus);
app.delete('/admin/enrollments/:id', requireAuth, enrollmentController.deleteAdminEnrollment);

app.get('/programs/:id', async (req, res) => {
  try {
    const programId = req.params.id;
    console.log('📖 프로그램 상세 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
    
    // MongoDB에서 프로그램 찾기
    const program = await Program.findById(programId);
    
    if (!program) {
      console.log('❌ 프로그램을 찾을 수 없음:', programId);
      return res.status(404).render('error', { 
        title: '프로그램을 찾을 수 없습니다',
        description: '요청하신 프로그램을 찾을 수 없습니다.',
        user: req.user
      });
    }
    
    console.log('📊 프로그램 상세 로드:', {
      id: program._id,
      title: program.title,
      price: program.price
    });
    
    res.render('program-detail', { 
      title: program.title,
      description: program.description,
      program: program,
      user: req.user
    });
  } catch (error) {
    console.error('❌ 프로그램 상세 페이지 로드 오류:', error);
    
    // 에러 시 정적 데이터 사용 (fallback)
    const programId = req.params.id;
    const program = getProgramById(programId);
    
    if (!program) {
      return res.status(404).render('error', { 
        title: '프로그램을 찾을 수 없습니다',
        description: '요청하신 프로그램을 찾을 수 없습니다.',
        user: req.user
      });
    }
    
    res.render('program-detail', { 
      title: program.title,
      description: program.description,
      program: program,
      user: req.user
    });
  }
});

// Slack 웹훅 문의 전송 API 엔드포인트
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Slack Webhook URL 확인
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
    return res.status(500).json({ message: '시스템 설정 오류입니다. 관리자에게 문의하세요.' });
  }

  // 현재 시간 포맷팅
  const currentTime = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Slack 메시지 포맷
  const slackPayload = {
    text: "🔔 새로운 문의가 접수되었습니다!",
    attachments: [
      {
        color: "#36a64f",
        title: `📝 ${subject}`,
        fields: [
          {
            title: "👤 문의자",
            value: name,
            short: true
          },
          {
            title: "📧 연락처 또는 이메일",
            value: email,
            short: true
          },
          {
            title: "⏰ 접수 시간",
            value: currentTime,
            short: true
          },
          {
            title: "🔗 바로가기",
            value: email.includes('@') ? `<mailto:${email}|이메일 답장하기>` : `연락처: ${email}`,
            short: true
          },
          {
            title: "💬 문의 내용",
            value: message,
            short: false
          }
        ],
        footer: "DSH에듀 문의 시스템",
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  try {
    console.log('🔄 Slack Webhook 전송 시도중...', {
      url: process.env.SLACK_WEBHOOK_URL ? process.env.SLACK_WEBHOOK_URL.substring(0, 50) + '...' : 'NOT SET',
      payload: JSON.stringify(slackPayload).substring(0, 200) + '...'
    });

    // Slack Webhook으로 메시지 전송
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload)
    });

    console.log('📡 Slack API 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (response.ok) {
      console.log('✅ Slack 메시지 전송 성공:', { name, email, subject });
      res.status(200).json({ 
        message: '문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.' 
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Slack API 오류 상세:', errorText);
      throw new Error(`Slack API 응답 오류: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Slack 메시지 전송 실패:', error);
    res.status(500).json({ 
      message: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    });
  }
});



// MongoDB 연결
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 30000
  })
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
    console.log('⚠️ MongoDB 없이 서버 시작');
  });
} else {
  console.log('⚠️ MONGODB_URI 환경변수가 설정되지 않음 - MongoDB 없이 서버 시작');
}

// User 모델은 models/User.js에서 import됨

// 카카오 전략 설정
console.log('🔑 카카오 OAuth 설정:', {
  clientID: process.env.KAKAO_CLIENT_ID ? 'SET' : 'NOT SET',
  callbackURL: process.env.KAKAO_CALLBACK_URL || 'http://localhost:3001/auth/kakao/callback'
});

passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID,
  callbackURL: process.env.KAKAO_CALLBACK_URL || 'http://localhost:3001/auth/kakao/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 카카오 프로필 정보:', JSON.stringify(profile._json, null, 2));
    
    let user = await User.findOne({ kakaoId: profile.id });
    
    if (!user) {
      // 이메일로 사용자 검색
      const email = profile._json.kakao_account?.email;
      user = await User.findOne({ email });
      
      if (user) {
        // 기존 사용자에 카카오 ID 추가
        user.kakaoId = profile.id;
        await user.save();
        console.log('✅ 기존 사용자에 카카오 ID 연결:', user.name);
      } else {
        // 새 사용자 생성 - 안전한 nickname 추출
        const nickname = profile._json.properties?.nickname || 
                        profile._json.kakao_account?.profile?.nickname || 
                        profile.displayName || 
                        email ? email.split('@')[0] : '카카오사용자';
        
        user = await User.create({
          name: nickname,
          email: email,
          kakaoId: profile.id,
          role: 'parent', // 기본 역할 설정
          communityLevel: {
            level: 1,
            experience: 0,
            title: '브론즈',
            badges: []
          },
          activityStats: {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: new Date()
          }
        });
        console.log('✅ 새 카카오 사용자 생성:', user.name);
      }
    } else {
      // 카카오 ID로 찾은 사용자가 있지만, 이메일이 다르면 새 사용자로 생성
      const email = profile._json.kakao_account?.email;
      if (email && user.email !== email) {
        console.log('🔄 카카오 ID는 같지만 이메일이 다른 경우 - 새 사용자 생성');
        
        // 기존 사용자 삭제 (관리자가 삭제한 경우)
        await User.findByIdAndDelete(user._id);
        console.log('🗑️ 기존 사용자 삭제됨:', user.name);
        
        // 새 사용자 생성
        const nickname = profile._json.properties?.nickname || 
                        profile._json.kakao_account?.profile?.nickname || 
                        profile.displayName || 
                        email ? email.split('@')[0] : '카카오사용자';
        
        user = await User.create({
          name: nickname,
          email: email,
          kakaoId: profile.id,
          role: 'parent',
          communityLevel: {
            level: 1,
            experience: 0,
            title: '브론즈',
            badges: []
          },
          activityStats: {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: new Date()
          }
        });
        console.log('✅ 새 카카오 사용자 생성 (기존 삭제 후):', user.name);
      }
    }
    
    return done(null, user);
  } catch (err) {
    console.error('❌ 카카오 OAuth 에러:', err);
    return done(err);
  }
}));

// 네이버 전략 설정
passport.use(new NaverStrategy({
  clientID: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  callbackURL: process.env.NAVER_CALLBACK_URL || 'http://localhost:3001/auth/naver/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 네이버 프로필 정보:', JSON.stringify(profile._json, null, 2));
    
    let user = await User.findOne({ naverId: profile.id });
    
    if (!user) {
      // 이메일로 사용자 검색
      const email = profile._json.email;
      user = await User.findOne({ email });
      
      if (user) {
        // 기존 사용자에 네이버 ID 추가
        user.naverId = profile.id;
        await user.save();
        console.log('✅ 기존 사용자에 네이버 ID 연결:', user.name);
      } else {
        // 새 사용자 생성 - 안전한 name 추출
        const name = profile._json.name || 
                    profile._json.nickname || 
                    email ? email.split('@')[0] : '네이버사용자';
        
        user = await User.create({
          name: name,
          email: email,
          naverId: profile.id,
          role: 'parent', // 기본 역할 설정
          communityLevel: {
            level: 1,
            experience: 0,
            title: '브론즈',
            badges: []
          },
          activityStats: {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: new Date()
          }
        });
        console.log('✅ 새 네이버 사용자 생성:', user.name);
      }
    } else {
      // 네이버 ID로 찾은 사용자가 있지만, 이메일이 다르면 새 사용자로 생성
      const email = profile._json.email;
      if (email && user.email !== email) {
        console.log('🔄 네이버 ID는 같지만 이메일이 다른 경우 - 새 사용자 생성');
        
        // 기존 사용자 삭제 (관리자가 삭제한 경우)
        await User.findByIdAndDelete(user._id);
        console.log('🗑️ 기존 사용자 삭제됨:', user.name);
        
        // 새 사용자 생성
        const name = profile._json.name || 
                    profile._json.nickname || 
                    email ? email.split('@')[0] : '네이버사용자';
        
        user = await User.create({
          name: name,
          email: email,
          naverId: profile.id,
          role: 'parent',
          communityLevel: {
            level: 1,
            experience: 0,
            title: '브론즈',
            badges: []
          },
          activityStats: {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: new Date()
          }
        });
        console.log('✅ 새 네이버 사용자 생성 (기존 삭제 후):', user.name);
      }
    }
    
    return done(null, user);
  } catch (err) {
    console.error('❌ 네이버 OAuth 에러:', err);
    return done(err);
  }
}));

// 구글 전략 설정
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 구글 프로필 정보:', JSON.stringify(profile._json, null, 2));
    
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // 이메일로 사용자 검색
      const email = profile.emails[0].value;
      user = await User.findOne({ email });
      
      if (user) {
        // 기존 사용자에 구글 ID 추가
        user.googleId = profile.id;
        await user.save();
        console.log('✅ 기존 사용자에 구글 ID 연결:', user.name);
      } else {
        // 새 사용자 생성 - 안전한 name 추출
        const name = profile.displayName || 
                    profile.name?.givenName || 
                    email ? email.split('@')[0] : '구글사용자';
        
        user = await User.create({
          name: name,
          email: email,
          googleId: profile.id,
          role: 'parent', // 기본 역할 설정
          communityLevel: {
            level: 1,
            experience: 0,
            title: '브론즈',
            badges: []
          },
          activityStats: {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: new Date()
          }
        });
        console.log('✅ 새 구글 사용자 생성:', user.name);
      }
    } else {
      // 구글 ID로 찾은 사용자가 있지만, 이메일이 다르면 새 사용자로 생성
      const email = profile.emails[0].value;
      if (email && user.email !== email) {
        console.log('🔄 구글 ID는 같지만 이메일이 다른 경우 - 새 사용자 생성');
        
        // 기존 사용자 삭제 (관리자가 삭제한 경우)
        await User.findByIdAndDelete(user._id);
        console.log('🗑️ 기존 사용자 삭제됨:', user.name);
        
        // 새 사용자 생성
        const name = profile.displayName || 
                    profile.name?.givenName || 
                    email ? email.split('@')[0] : '구글사용자';
        
        user = await User.create({
          name: name,
          email: email,
          googleId: profile.id,
          role: 'parent',
          communityLevel: {
            level: 1,
            experience: 0,
            title: '브론즈',
            badges: []
          },
          activityStats: {
            postsCount: 0,
            commentsCount: 0,
            likesReceived: 0,
            lastActiveAt: new Date()
          }
        });
        console.log('✅ 새 구글 사용자 생성 (기존 삭제 후):', user.name);
      }
    }
    
    return done(null, user);
  } catch (err) {
    console.error('❌ 구글 OAuth 에러:', err);
    return done(err);
  }
}));

// 인증 미들웨어
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// 인증 라우트
app.get('/login', (req, res) => {
  res.render('login', { 
    title: '로그인', 
    description: 'DSH에듀에 로그인하여 회원 전용 서비스를 이용하세요',
    user: req.user,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

app.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.log('❌ 로그인 오류:', err);
      return next(err);
    }
    
    if (!user) {
      console.log('❌ 로그인 실패:', info.message);
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.log('❌ 세션 생성 오류:', err);
        return next(err);
      }
      
      console.log('✅ 로그인 성공:', user.name, user.email);
      console.log('✅ 세션 생성됨, ID:', req.session.id);
      console.log('✅ req.user 설정됨:', !!req.user);
      console.log('✅ 세션 저장 확인:', req.session.save ? '가능' : '불가능');
      
      // 세션을 명시적으로 저장
      req.session.save((err) => {
        if (err) {
          console.log('❌ 세션 저장 오류:', err);
          return next(err);
        }
        console.log('✅ 세션 저장 완료');
        return res.redirect('/?loginSuccess=true');
      });
    });
  })(req, res, next);
});

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log('❌ 로그아웃 오류:', err);
      return res.redirect('/');
    }
    console.log('✅ 로그아웃 성공');
    res.redirect('/');
  });
});

// 비밀번호 찾기 페이지
app.get('/forgot-password', (req, res) => {
  console.log('🔑 비밀번호 찾기 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('forgot-password', { 
    title: '비밀번호 찾기',
    description: '비밀번호를 재설정하여 계정에 다시 접근하세요',
    user: req.user,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    console.log('📝 회원가입 요청 데이터:', { name, email, phone, role });
    
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    
    console.log('🔐 원본 비밀번호:', password);
    
    // 새 사용자 생성 (User 모델의 pre-save 미들웨어가 비밀번호를 해시화함)
    const user = await User.create({
      name,
      email,
      password: password, // 원본 비밀번호 전달
      phone: phone || undefined,
      role: role || 'parent',
      communityLevel: {
        level: 1,
        experience: 0,
        title: '브론즈',
        badges: []
      },
      activityStats: {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        lastActiveAt: new Date()
      }
    });
    
    console.log('✅ 사용자 생성 완료:', {
      이름: user.name,
      이메일: user.email,
      역할: user.role,
      ID: user._id,
      생성일: user.createdAt
    });
    
    // 자동 로그인
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
      }
      return res.redirect('/');
    });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 사용자 확인
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: '해당 이메일로 등록된 계정이 없습니다.' });
    }
    
    // 토큰 생성
    const token = require('crypto').randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1시간
    await user.save();
    
    // 이메일 전송
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'DSH에듀 비밀번호 재설정',
      html: `
        <p>비밀번호 재설정을 요청하셨습니다.</p>
        <p>아래 링크를 클릭하여 비밀번호를 재설정하세요:</p>
        <a href="${process.env.BASE_URL || 'http://localhost:3001'}/reset-password/${token}">비밀번호 재설정</a>
        <p>이 링크는 1시간 동안 유효합니다.</p>
        <p>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' });
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err);
    res.status(500).json({ message: '비밀번호 재설정 중 오류가 발생했습니다.' });
  }
});

app.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: '비밀번호 재설정 토큰이 유효하지 않거나 만료되었습니다.' });
    }
    
    res.render('reset-password', { token: req.params.token });
  } catch (err) {
    console.error('비밀번호 재설정 페이지 오류:', err);
    res.status(500).json({ message: '비밀번호 재설정 페이지 로드 중 오류가 발생했습니다.' });
  }
});

app.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: '비밀번호 재설정 토큰이 유효하지 않거나 만료되었습니다.' });
    }
    
    // 새 비밀번호 설정
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err);
    res.status(500).json({ message: '비밀번호 재설정 중 오류가 발생했습니다.' });
  }
});

// 추천 게시글 관리 API
app.get('/api/admin/featured-posts', requireAuth, async (req, res) => {
  try {
    console.log('🌟 추천 게시글 조회 요청, 사용자:', req.user.name);
    
    const featuredPosts = await Post.find({ isFeatured: true, isPublished: true })
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    
    console.log('✅ 추천 게시글 조회 성공:', featuredPosts.length + '개');
    res.json({ posts: featuredPosts });
  } catch (error) {
    console.error('❌ 추천 게시글 조회 오류:', error);
    res.status(500).json({ message: '추천 게시글을 불러오는데 실패했습니다.' });
  }
});

app.get('/api/admin/posts/search', requireAuth, async (req, res) => {
  try {
    const { search, category, status } = req.query;
    console.log('🔍 게시글 검색 요청:', { search, category, status });
    
    let query = {};
    
    // 검색어 필터
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 카테고리 필터
    if (category) {
      query.category = category;
    }
    
    // 상태 필터
    if (status === 'published') {
      query.isPublished = true;
    }
    
    const posts = await Post.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log('✅ 게시글 검색 성공:', posts.length + '개');
    res.json({ posts });
  } catch (error) {
    console.error('❌ 게시글 검색 오류:', error);
    res.status(500).json({ message: '게시글 검색에 실패했습니다.' });
  }
});

app.post('/api/admin/posts/:id/feature', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    console.log('⭐ 게시글 추천 설정 요청:', postId, '사용자:', req.user.name);
    
    // 현재 추천 게시글 수 확인 (최대 6개 제한)
    const currentFeaturedCount = await Post.countDocuments({ isFeatured: true });
    if (currentFeaturedCount >= 6) {
      return res.status(400).json({ message: '추천 게시글은 최대 6개까지만 설정할 수 있습니다.' });
    }
    
    const post = await Post.findByIdAndUpdate(
      postId,
      { isFeatured: true },
      { new: true }
    ).populate('author', 'name');
    
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    
    console.log('✅ 게시글 추천 설정 성공:', post.title);
    res.json({ message: '추천 게시글로 설정되었습니다.', post });
  } catch (error) {
    console.error('❌ 게시글 추천 설정 오류:', error);
    res.status(500).json({ message: '추천 게시글 설정에 실패했습니다.' });
  }
});

app.delete('/api/admin/posts/:id/feature', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    console.log('🚫 게시글 추천 해제 요청:', postId, '사용자:', req.user.name);
    
    const post = await Post.findByIdAndUpdate(
      postId,
      { isFeatured: false },
      { new: true }
    ).populate('author', 'name');
    
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    
    console.log('✅ 게시글 추천 해제 성공:', post.title);
    res.json({ message: '추천 게시글에서 제거되었습니다.', post });
  } catch (error) {
    console.error('❌ 게시글 추천 해제 오류:', error);
    res.status(500).json({ message: '추천 게시글 제거에 실패했습니다.' });
  }
});

// 소셜 로그인 라우트
app.get('/auth/kakao', passport.authenticate('kakao'));

app.get('/auth/kakao/callback', passport.authenticate('kakao', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.get('/auth/naver', passport.authenticate('naver'));

app.get('/auth/naver/callback', passport.authenticate('naver', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 