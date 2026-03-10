const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { AUTH } = require('../queries');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const [[user]] = await db.execute(AUTH.FIND_BY_EMAIL, [email.toLowerCase().trim()]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive. Contact admin.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const allowedRoles = ['member', 'trainer'];
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
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
});

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
  res.json({ user: updated });
});

module.exports = router;
