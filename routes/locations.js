const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/locations
router.get('/', authenticate, (req, res) => {
  let sql = 'SELECT * FROM locations';
  if (req.user.role === 'member') {
    sql += " WHERE status = 'active'";
  }
  sql += ' ORDER BY name ASC';
  const locations = db.prepare(sql).all();
  res.json({ locations });
});

// POST /api/locations - admin only
router.post('/', requireRole('admin'), (req, res) => {
  const { name, address, capacity, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const locStatus = ['active','inactive'].includes(status) ? status : 'active';
  try {
    const result = db.prepare('INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)').run(name.trim(), address || null, capacity || 20, locStatus);
    const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/locations/:id - admin only
router.put('/:id', requireRole('admin'), (req, res) => {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const { name, address, capacity, status } = req.body;
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name.trim()); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }
  if (status && ['active','inactive'].includes(status)) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  res.json({ location: updated });
});

// DELETE /api/locations/:id - admin only
router.delete('/:id', requireRole('admin'), (req, res) => {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const used = db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE location_id = ?').get(req.params.id).cnt;
  if (used > 0) {
    db.prepare("UPDATE locations SET status = 'inactive' WHERE id = ?").run(req.params.id);
    return res.json({ message: 'Location deactivated (used in sessions)' });
  }

  db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id);
  res.json({ message: 'Location deleted' });
});

module.exports = router;
