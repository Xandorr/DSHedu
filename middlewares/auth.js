const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Or check if token exists in cookies
    token = req.cookies.token;
  }

  // If no token, return unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to req object
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
};

// Require authentication for web pages
exports.requireAuth = async (req, res, next) => {
  let token;

  console.log('🔍 requireAuth 미들웨어 디버깅:');
  console.log('  req.user:', req.user ? `${req.user.name} (${req.user.email})` : 'undefined');
  console.log('  req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'method not available');
  console.log('  req.session exists:', !!req.session);
  console.log('  req.session.passport:', req.session && req.session.passport ? req.session.passport : 'undefined');

  // Check if user is already authenticated via passport
  if (req.user) {
    console.log('✅ 사용자 인증됨 (passport):', req.user.name);
    return next();
  }

  // Check passport session directly
  if (req.session && req.session.passport && req.session.passport.user) {
    try {
      console.log('🔍 passport 세션에서 사용자 ID 발견:', req.session.passport.user);
      const user = await User.findById(req.session.passport.user);
      if (user) {
        console.log('✅ 사용자 인증됨 (passport session):', user.name);
        req.user = user;
        return next();
      }
    } catch (error) {
      console.log('❌ passport 세션 사용자 조회 실패:', error.message);
    }
  }

  // Check session
  if (req.session && req.session.user) {
    console.log('✅ 사용자 인증됨 (session):', req.session.user.name);
    req.user = req.session.user;
    return next();
  }

  // Check if token exists in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Or check if token exists in cookies
    token = req.cookies.token;
  }

  // If no token, redirect to login
  if (!token) {
    return res.redirect('/login?redirectTo=' + encodeURIComponent(req.originalUrl));
  }

  try {
    // Verify token (if JWT is being used)
    if (process.env.JWT_SECRET) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user to req object
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } else {
      return res.redirect('/login?redirectTo=' + encodeURIComponent(req.originalUrl));
    }
  } catch (error) {
    return res.redirect('/login?redirectTo=' + encodeURIComponent(req.originalUrl));
  }
};

// Require authentication for JSON responses
exports.requireAuthJson = async (req, res, next) => {
  let token;

  // Check if user is already authenticated via passport
  if (req.user) {
    return next();
  }

  // Check session
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Check if token exists in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Or check if token exists in cookies
    token = req.cookies.token;
  }

  // If no token, return unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    // Verify token (if JWT is being used)
    if (process.env.JWT_SECRET) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user to req object
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'JWT not configured'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
}; 