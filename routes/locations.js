// DEPRECATED — replaced by routes/locations.mjs
/*
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { LOCATIONS } = require('../queries');

// GET /api/locations
router.get('/', authenticate, async (req, res) => {
  const sql = req.user.role === 'member' ? LOCATIONS.LIST_ACTIVE : LOCATIONS.LIST_ALL;
  const [locations] = await db.execute(sql);
  res.json({ locations });
});

// POST /api/locations - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, address, capacity, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const locStatus = ['active','inactive'].includes(status) ? status : 'active';
  try {
    const [result] = await db.execute(LOCATIONS.INSERT, [name.trim(), address || null, capacity || 20, locStatus]);
    const [[location]] = await db.execute(LOCATIONS.GET_BY_ID, [result.insertId]);
    res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/locations/:id - admin only
router.put('/:id', requireRole('admin'), async (req, res) => {
  const [[location]] = await db.execute(LOCATIONS.GET_BY_ID, [req.params.id]);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const { name, address, capacity, status } = req.body;
  const updates = [];
  const params = [];

  if (name)                { updates.push('name = ?');     params.push(name.trim()); }
  if (address !== undefined)  { updates.push('address = ?');  params.push(address); }
  if (capacity !== undefined) { updates.push('capacity = ?'); params.push(capacity); }
  if (status && ['active','inactive'].includes(status)) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  await db.execute(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, params);

  const [[updated]] = await db.execute(LOCATIONS.GET_BY_ID, [req.params.id]);
  res.json({ location: updated });
});

// DELETE /api/locations/:id - admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[location]] = await db.execute(LOCATIONS.GET_BY_ID, [req.params.id]);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const [[{ used }]] = await db.execute(LOCATIONS.CHECK_IN_USE, [req.params.id]);
  if (used > 0) {
    await db.execute(LOCATIONS.DEACTIVATE, [req.params.id]);
    return res.json({ message: 'Location deactivated (used in sessions)' });
  }

  await db.execute(LOCATIONS.DELETE, [req.params.id]);
  res.json({ message: 'Location deleted' });
});

module.exports = router;
*/
