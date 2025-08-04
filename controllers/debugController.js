// 디버깅용 컨트롤러 - 사용자 인증 상태 확인
exports.debugAuth = (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'passport method not available',
    user: req.user ? {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    } : 'No user in req.user',
    session: {
      exists: !!req.session,
      sessionId: req.session ? req.session.id : 'No session',
      sessionUser: req.session && req.session.user ? req.session.user : 'No session.user',
      passport: req.session && req.session.passport ? req.session.passport : 'No session.passport'
    },
    cookies: req.cookies || 'No cookies',
    headers: {
      cookie: req.headers.cookie || 'No cookie header',
      authorization: req.headers.authorization || 'No authorization header'
    }
  };

  res.json(debugInfo);
}; 