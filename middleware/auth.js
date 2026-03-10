const jwt = require('jsonwebtoken');
const db = require('../database');
const { AUTH } = require('../queries');

const JWT_SECRET = process.env.JWT_SECRET || 'gym-management-secret-key-2024';

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [[user]] = await db.execute(AUTH.GET_FULL_PROFILE, [decoded.id]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return [
    authenticate,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    }
  ];
}

module.exports = { authenticate, requireRole, JWT_SECRET };
