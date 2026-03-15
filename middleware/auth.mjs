// middleware/auth.mjs
// Session-based authentication middleware (replaces JWT-based auth.js)

export function authenticate(req, res, next) {
  if (!req.session.user) {
    // For API requests return 401, for page requests redirect to login
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login');
  }
  req.user = req.session.user;
  next();
}

export function requireRole(...roles) {
  return [
    authenticate,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        return res.redirect('/');
      }
      next();
    }
  ];
}
