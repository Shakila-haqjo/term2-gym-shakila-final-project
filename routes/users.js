const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { requireRole } = require('../middleware/auth');

// GET /api/users - admin only
router.get('/', requireRole('admin'), async (req, res) => {
  const { search, role, status } = req.query;
  let sql = 'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';

  const [users] = await db.execute(sql, params);
  res.json({ users });
});

// GET /api/users/stats - admin only
router.get('/stats', requireRole('admin'), async (req, res) => {
  const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM users');
  const [[{ members }]] = await db.execute("SELECT COUNT(*) as members FROM users WHERE role='member'");
  const [[{ trainers }]] = await db.execute("SELECT COUNT(*) as trainers FROM users WHERE role='trainer'");
  const [[{ active }]] = await db.execute("SELECT COUNT(*) as active FROM users WHERE status='active'");
  res.json({ total, members, trainers, active });
});

// GET /api/users/:id - admin only
router.get('/:id', requireRole('admin'), async (req, res) => {
  const [[user]] = await db.execute(
    'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?',
    [req.params.id]
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// POST /api/users - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, email, password, phone, address, role, status } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const validRoles = ['member', 'trainer', 'admin'];
  const userRole = validRoles.includes(role) ? role : 'member';
  const userStatus = ['active', 'inactive'].includes(status) ? status : 'active';

  try {
    const [[existing]] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hash, phone || null, address || null, userRole, userStatus]
    );

    const [[user]] = await db.execute(
      'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - admin only
router.put('/:id', requireRole('admin'), async (req, res) => {
  const [[user]] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, phone, address, role, status, password } = req.body;
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name.trim()); }
  if (email) {
    const [[conflict]] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
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

  const [[updated]] = await db.execute(
    'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?',
    [req.params.id]
  );
  res.json({ user: updated });
});

// DELETE /api/users/:id - admin only (soft delete)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[user]] = await db.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  await db.execute("UPDATE users SET status = 'inactive' WHERE id = ?", [req.params.id]);
  res.json({ message: 'User deactivated' });
});

module.exports = router;
