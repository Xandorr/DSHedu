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

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const programRoutes = require('./routes/programs');
const enrollmentRoutes = require('./routes/enrollments');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'ejs');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Main routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'US Summer & Winter Camps for Korean Students',
    description: 'Discover enriching camp programs for Korean students in the United States'
  });
});

app.get('/programs', (req, res) => {
  res.render('programs', { 
    title: 'Our Programs',
    description: 'Explore our summer and winter camp programs'
  });
});

app.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us',
    description: 'Learn about our mission and vision'
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    description: 'Get in touch with our team'
  });
});

app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    description: 'Access your account'
  });
});

app.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Register',
    description: 'Create a new account'
  });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard',
    description: 'Manage your enrollments'
  });
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

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'dsh_edu_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dsh_edu', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB 연결 성공'))
.catch(err => console.error('MongoDB 연결 실패:', err));

// 사용자 스키마 정의
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  kakaoId: String,
  naverId: String,
  googleId: String,
  createdAt: { type: Date, default: Date.now }
});

// 모델이 이미 존재하는지 확인 후 생성
let User;
try {
  User = mongoose.model('User');
} catch (err) {
  User = mongoose.model('User', UserSchema);
}

// Passport 직렬화/역직렬화
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
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
    user: req.user
  });
});

app.post('/auth/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('/');
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