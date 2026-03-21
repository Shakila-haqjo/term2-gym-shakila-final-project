import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.mjs';
import * as Activity from '../models/ActivityModel.mjs';

const router = express.Router();

// GET /api/activities
router.get('/', authenticate, async (req, res) => {
  const activeOnly = req.user.role === 'member';
  const activities = await Activity.listActivities(activeOnly);
  res.json({ activities });
});

// POST /api/activities - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const actStatus = ['active','inactive'].includes(status) ? status : 'active';
  try {
    const insertId = await Activity.createActivity(name.trim(), description || null, actStatus);
    const activity = await Activity.findById(insertId);
    res.status(201).json({ activity });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// PUT /api/activities/:id - admin only
router.put('/:id', requireRole('admin'), async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const { name, description, status } = req.body;
  const newName   = name        !== undefined ? name.trim()   : activity.name;
  const newDesc   = description !== undefined ? description   : activity.description;
  const newStatus = status && ['active','inactive'].includes(status) ? status : activity.status;

  await Activity.updateActivity(req.params.id, newName, newDesc, newStatus);
  const updated = await Activity.findById(req.params.id);
  res.json({ activity: updated });
});

// DELETE /api/activities/:id - admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const used = await Activity.countUsage(req.params.id);
  if (used > 0) {
    await Activity.deactivateActivity(req.params.id);
    return res.json({ message: 'Activity deactivated (used in sessions)' });
  }
  await Activity.deleteActivity(req.params.id);
  res.json({ message: 'Activity deleted' });
});

export default router;
