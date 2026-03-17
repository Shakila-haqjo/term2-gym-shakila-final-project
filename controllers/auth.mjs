import express from 'express';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import db from '../database.mjs';
import { authenticate } from '../middleware/auth.mjs';
import { AUTH } from '../queries.mjs';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

  try {
    const [[user]] = await db.execute(AUTH.FIND_BY_EMAIL, [email.toLowerCase().trim()]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive. Contact admin.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address
    };

    req.session.user = sessionUser;

    const token = Buffer.from(`${sessionUser.id}:${sessionUser.role}:${Date.now()}`).toString('base64');
    res.json({ user: sessionUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

  const allowedRoles = ['member', 'trainer', 'admin'];
  const userRole = allowedRoles.includes(role) ? role : 'member';

  try {
    const [[existing]] = await db.execute(AUTH.CHECK_EMAIL, [email.toLowerCase().trim()]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.execute(AUTH.INSERT_USER,
      [name.trim(), email.toLowerCase().trim(), hash, phone || null, address || null, userRole, 'active']
    );

    const [[user]] = await db.execute(AUTH.GET_PROFILE, [result.insertId]);

    req.session.user = user;

    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

// POST /api/auth/reset-password — commented out for now
// router.post('/reset-password', (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ error: 'Email is required' });
//   res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
// });

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me - update own profile
router.put('/me', authenticate, async (req, res) => {
  const { name, phone, address, password } = req.body;
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name.trim()); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    updates.push('password_hash = ?');
    params.push(bcrypt.hashSync(password, 10));
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.user.id);
  await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

  const [[updated]] = await db.execute(AUTH.GET_PROFILE, [req.user.id]);

  // Update session with new profile data
  req.session.user = { ...req.session.user, ...updated };

  res.json({ user: updated });
});

export default router;
