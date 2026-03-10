const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { requireRole } = require('../middleware/auth');

// GET /api/users - admin only
router.get('/', requireRole('admin'), (req, res) => {
  const { search, role, status } = req.query;
  let sql = 'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';

  const users = db.prepare(sql).all(...params);
  res.json({ users });
});

// GET /api/users/stats - admin only
router.get('/stats', requireRole('admin'), (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as cnt FROM users").get().cnt;
  const members = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='member'").get().cnt;
  const trainers = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='trainer'").get().cnt;
  const active = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE status='active'").get().cnt;
  res.json({ total, members, trainers, active });
});

// GET /api/users/:id - admin only
router.get('/:id', requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// POST /api/users - admin only
router.post('/', requireRole('admin'), (req, res) => {
  const { name, email, password, phone, address, role, status } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const validRoles = ['member', 'trainer', 'admin'];
  const userRole = validRoles.includes(role) ? role : 'member';
  const userStatus = ['active', 'inactive'].includes(status) ? status : 'active';

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, address, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.toLowerCase().trim(), hash, phone || null, address || null, userRole, userStatus);

    const user = db.prepare('SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - admin only
router.put('/:id', requireRole('admin'), (req, res) => {
  const { name, email, phone, address, role, status, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name.trim()); }
  if (email) {
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), req.params.id);
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
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json({ user: updated });
});

// DELETE /api/users/:id - admin only
router.delete('/:id', requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Soft delete: set inactive
  db.prepare("UPDATE users SET status = 'inactive' WHERE id = ?").run(req.params.id);
  res.json({ message: 'User deactivated' });
});

module.exports = router;
