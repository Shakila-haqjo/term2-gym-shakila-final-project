const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const { USERS } = require('../queries');

// GET /api/users - admin only
router.get('/', requireRole('admin'), async (req, res) => {
  const { search, role, status } = req.query;
  let sql = USERS.LIST_BASE;
  const params = [];

  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (role)   { sql += ' AND role = ?';   params.push(role); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';

  const [users] = await db.execute(sql, params);
  res.json({ users });
});

// GET /api/users/stats - admin only
router.get('/stats', requireRole('admin'), async (_req, res) => {
  const [[{ total }]]    = await db.execute(USERS.STATS_TOTAL);
  const [[{ members }]]  = await db.execute(USERS.STATS_MEMBERS);
  const [[{ trainers }]] = await db.execute(USERS.STATS_TRAINERS);
  const [[{ active }]]   = await db.execute(USERS.STATS_ACTIVE);
  res.json({ total, members, trainers, active });
});

// GET /api/users/:id - admin only
router.get('/:id', requireRole('admin'), async (req, res) => {
  const [[user]] = await db.execute(USERS.GET_BY_ID, [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// POST /api/users - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, email, password, phone, address, role, status } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const validRoles = ['member', 'trainer', 'admin'];
  const userRole   = validRoles.includes(role) ? role : 'member';
  const userStatus = ['active', 'inactive'].includes(status) ? status : 'active';

  try {
    const [[existing]] = await db.execute(USERS.CHECK_EMAIL, [email.toLowerCase().trim()]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.execute(USERS.INSERT,
      [name.trim(), email.toLowerCase().trim(), hash, phone || null, address || null, userRole, userStatus]
    );

    const [[user]] = await db.execute(USERS.GET_BY_ID, [result.insertId]);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - admin only
router.put('/:id', requireRole('admin'), async (req, res) => {
  const [[user]] = await db.execute(USERS.GET_ALL_BY_ID, [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, phone, address, role, status, password } = req.body;
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name.trim()); }
  if (email) {
    const [[conflict]] = await db.execute(USERS.CHECK_EMAIL_CONFLICT,
      [email.toLowerCase().trim(), req.params.id]
    );
    if (conflict) return res.status(409).json({ error: 'Email already in use' });
    updates.push('email = ?');
    params.push(email.toLowerCase().trim());
  }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (role && ['member','trainer','admin'].includes(role)) { updates.push('role = ?'); params.push(role); }
  if (status && ['active','inactive'].includes(status)) { updates.push('status = ?'); params.push(status); }
  if (password) { updates.push('password_hash = ?'); params.push(bcrypt.hashSync(password, 10)); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

  const [[updated]] = await db.execute(USERS.GET_BY_ID, [req.params.id]);
  res.json({ user: updated });
});

// DELETE /api/users/:id - admin only (soft delete)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[user]] = await db.execute(USERS.CHECK_ID, [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  await db.execute(USERS.SOFT_DELETE, [req.params.id]);
  res.json({ message: 'User deactivated' });
});

module.exports = router;
