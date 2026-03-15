import express from 'express';
import db from '../database.mjs';
import { authenticate, requireRole } from '../middleware/auth.mjs';
import { ACTIVITIES } from '../queries.mjs';

const router = express.Router();

// GET /api/activities
router.get('/', authenticate, async (req, res) => {
  const sql = req.user.role === 'member' ? ACTIVITIES.LIST_ACTIVE : ACTIVITIES.LIST_ALL;
  const [activities] = await db.execute(sql);
  res.json({ activities });
});

// POST /api/activities - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const actStatus = ['active','inactive'].includes(status) ? status : 'active';
  try {
    const [result] = await db.execute(ACTIVITIES.INSERT, [name.trim(), description || null, actStatus]);
    const [[activity]] = await db.execute(ACTIVITIES.GET_BY_ID, [result.insertId]);
    res.status(201).json({ activity });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// PUT /api/activities/:id - admin only
router.put('/:id', requireRole('admin'), async (req, res) => {
  const [[activity]] = await db.execute(ACTIVITIES.GET_BY_ID, [req.params.id]);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const { name, description, status } = req.body;
  const updates = [];
  const params = [];

  if (name)                      { updates.push('name = ?');        params.push(name.trim()); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status && ['active','inactive'].includes(status)) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  await db.execute(`UPDATE activities SET ${updates.join(', ')} WHERE id = ?`, params);

  const [[updated]] = await db.execute(ACTIVITIES.GET_BY_ID, [req.params.id]);
  res.json({ activity: updated });
});

// DELETE /api/activities/:id - admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[activity]] = await db.execute(ACTIVITIES.GET_BY_ID, [req.params.id]);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const [[{ used }]] = await db.execute(ACTIVITIES.CHECK_IN_USE, [req.params.id]);
  if (used > 0) {
    await db.execute(ACTIVITIES.DEACTIVATE, [req.params.id]);
    return res.json({ message: 'Activity deactivated (used in sessions)' });
  }

  await db.execute(ACTIVITIES.DELETE, [req.params.id]);
  res.json({ message: 'Activity deleted' });
});

export default router;
