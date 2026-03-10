const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/activities
router.get('/', authenticate, (req, res) => {
  let sql = 'SELECT * FROM activities';
  if (req.user.role === 'member') {
    sql += " WHERE status = 'active'";
  }
  sql += ' ORDER BY name ASC';
  const activities = db.prepare(sql).all();
  res.json({ activities });
});

// POST /api/activities - admin only
router.post('/', requireRole('admin'), (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const actStatus = ['active','inactive'].includes(status) ? status : 'active';
  try {
    const result = db.prepare('INSERT INTO activities (name, description, status) VALUES (?, ?, ?)').run(name.trim(), description || null, actStatus);
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ activity });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// PUT /api/activities/:id - admin only
router.put('/:id', requireRole('admin'), (req, res) => {
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const { name, description, status } = req.body;
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name.trim()); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status && ['active','inactive'].includes(status)) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE activities SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  res.json({ activity: updated });
});

// DELETE /api/activities/:id - admin only
router.delete('/:id', requireRole('admin'), (req, res) => {
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  // Check if used in sessions
  const used = db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE activity_id = ?').get(req.params.id).cnt;
  if (used > 0) {
    // Soft delete
    db.prepare("UPDATE activities SET status = 'inactive' WHERE id = ?").run(req.params.id);
    return res.json({ message: 'Activity deactivated (used in sessions)' });
  }

  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.json({ message: 'Activity deleted' });
});

module.exports = router;
