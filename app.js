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
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Program = require('./models/Program');

// Import routes
const authRoutes = require('./routes/auth');
const programRoutes = require('./routes/programs');
const enrollmentRoutes = require('./routes/enrollments');
const postRoutes = require('./routes/posts');
const debugController = require('./controllers/debugController');

// Import middlewares
const { requireAuth } = require('./middlewares/auth');
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

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// 세션 설정 (라우트보다 먼저!)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dsh_edu_secret',
  resave: false,
  saveUninitialized: true, // passport 권장 설정
  cookie: { 
    secure: false, // development에서는 false
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    httpOnly: true
  },
  name: 'dshedu.session' // 세션 쿠키명 명시
}));

// Passport 초기화 (라우트보다 먼저!)
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport 직렬화/역직렬화
passport.serializeUser((user, done) => {
  done(null, user.id);
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
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/posts', postRoutes);

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
    
    console.log('📊 메인 페이지 프로그램 로드:', {
      전체: activePrograms.length,
      추천: featuredPrograms.length
    });
    
    res.render('index', { 
      title: 'US Summer & Winter Camps for Korean Students',
      description: 'Discover enriching camp programs for Korean students in the United States',
      featuredPrograms: featuredPrograms,
      programs: activePrograms,
      user: req.user
    });
  } catch (error) {
    console.error('❌ 메인 페이지 로드 오류:', error);
    
    // 에러 시 정적 데이터 사용 (fallback)
    const featuredPrograms = getFeaturedPrograms();
    res.render('index', { 
      title: 'US Summer & Winter Camps for Korean Students',
      description: 'Discover enriching camp programs for Korean students in the United States',
      featuredPrograms: featuredPrograms,
      programs: programs,
      user: req.user
    });
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

app.get('/dashboard/enrollments', requireAuth, (req, res) => {
  console.log('📋 등록 현황 페이지 접속, 사용자:', req.user ? req.user.name : '비회원');
  res.render('my-enrollments', { 
    title: 'My Enrollments',
    description: 'View your program enrollments',
    user: req.user
  });
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

// ===== 관리자용 프로그램 관리 라우트 =====
app.get('/admin/programs', requireAuth, programController.getAdminPrograms);
app.get('/admin/programs/:id', requireAuth, programController.getProgramAdmin);
app.post('/admin/programs', requireAuth, programController.upload.array('photos', 5), programController.createProgramAdmin);
app.post('/admin/programs/:id', requireAuth, programController.upload.array('photos', 5), programController.updateProgramAdmin);
app.put('/admin/programs/:id', requireAuth, programController.upload.array('photos', 5), programController.updateProgramAdmin);
app.delete('/admin/programs/:id', requireAuth, programController.deleteProgramAdmin);

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

// 이메일 전송 API 엔드포인트
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // 이메일 전송을 위한 transporter 설정
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // 환경 변수에서 이메일 주소 가져오기
      pass: process.env.EMAIL_PASS  // 환경 변수에서 이메일 비밀번호 가져오기
    }
  });

  // 이메일 옵션 설정
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'info@dshedu.net', // 관리자 이메일로 전송
    subject: `[웹사이트 문의] ${subject}`,
    html: `
      <h3>새로운 문의가 접수되었습니다</h3>
      <p><strong>이름:</strong> ${name}</p>
      <p><strong>이메일:</strong> ${email}</p>
      <p><strong>제목:</strong> ${subject}</p>
      <p><strong>메시지:</strong></p>
      <p>${message}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: '이메일이 성공적으로 전송되었습니다.' });
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    res.status(500).json({ message: '이메일 전송에 실패했습니다.' });
  }
});



// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dsh_edu', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB 연결 성공'))
.catch(err => console.error('MongoDB 연결 실패:', err));

// User 모델은 models/User.js에서 import됨

// 카카오 전략 설정
passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  callbackURL: process.env.KAKAO_CALLBACK_URL || 'http://localhost:3000/auth/kakao/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ kakaoId: profile.id });
    
    if (!user) {
      // 이메일로 사용자 검색
      const email = profile._json.kakao_account.email;
      user = await User.findOne({ email });
      
      if (user) {
        // 기존 사용자에 카카오 ID 추가
        user.kakaoId = profile.id;
        await user.save();
      } else {
        // 새 사용자 생성
        user = await User.create({
          name: profile._json.properties.nickname,
          email: email,
          kakaoId: profile.id
        });
      }
    }
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// 네이버 전략 설정
passport.use(new NaverStrategy({
  clientID: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  callbackURL: process.env.NAVER_CALLBACK_URL || 'http://localhost:3000/auth/naver/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ naverId: profile.id });
    
    if (!user) {
      // 이메일로 사용자 검색
      const email = profile._json.email;
      user = await User.findOne({ email });
      
      if (user) {
        // 기존 사용자에 네이버 ID 추가
        user.naverId = profile.id;
        await user.save();
      } else {
        // 새 사용자 생성
        user = await User.create({
          name: profile._json.name,
          email: email,
          naverId: profile.id
        });
      }
    }
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// 구글 전략 설정
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // 이메일로 사용자 검색
      const email = profile.emails[0].value;
      user = await User.findOne({ email });
      
      if (user) {
        // 기존 사용자에 구글 ID 추가
        user.googleId = profile.id;
        await user.save();
      } else {
        // 새 사용자 생성
        user = await User.create({
          name: profile.displayName,
          email: email,
          googleId: profile.id
        });
      }
    }
    
    return done(null, user);
  } catch (err) {
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
      
      return res.redirect('/');
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

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    
    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 새 사용자 생성
    const user = await User.create({
      name,
      email,
      password: hashedPassword
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
        <a href="${process.env.BASE_URL || 'http://localhost:3000'}/reset-password/${token}">비밀번호 재설정</a>
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

// Start server without MongoDB
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (MongoDB connection disabled)`);
});

module.exports = app; 