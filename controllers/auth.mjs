import express from 'express';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { authenticate } from '../middleware/auth.mjs';
import * as User from '../models/UserModel.mjs';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

  try {
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive. Contact admin.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const sessionUser = {
      id: user.id, name: user.name, email: user.email,
      role: user.role, avatar: user.avatar, phone: user.phone, address: user.address
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
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const allowedRoles = ['member', 'trainer', 'admin'];
  const userRole = allowedRoles.includes(role) ? role : 'member';

  try {
    const existing = await User.checkEmailExists(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const insertId = await User.createUser(
      name.trim(), email.toLowerCase().trim(), hash,
      phone || null, address || null, userRole, 'active'
    );

    const profile = await User.getProfile(insertId);
    req.session.user = profile;
    const token = Buffer.from(`${profile.id}:${profile.role}:${Date.now()}`).toString('base64');
    res.status(201).json({ user: profile, token });
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

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me
router.put('/me', authenticate, async (req, res) => {
  const { name, phone, address, password } = req.body;
  if (password && password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const fields = {};
  if (name)              fields.name         = name.trim();
  if (phone !== undefined) fields.phone      = phone;
  if (address !== undefined) fields.address  = address;
  if (password)          fields.passwordHash = bcrypt.hashSync(password, 10);

  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

  await User.updateUser(req.user.id, fields);
  const updated = await User.getProfile(req.user.id);
  req.session.user = { ...req.session.user, ...updated };
  res.json({ user: updated });
});

export default router;
