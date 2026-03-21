import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.mjs';
import * as Location from '../models/LocationModel.mjs';

const router = express.Router();

// GET /api/locations
router.get('/', authenticate, async (req, res) => {
  const activeOnly = req.user.role === 'member';
  const locations = await Location.listLocations(activeOnly);
  res.json({ locations });
});

// POST /api/locations - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, address, capacity, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const locStatus = ['active','inactive'].includes(status) ? status : 'active';
  try {
    const insertId = await Location.createLocation(name.trim(), address || null, capacity || 20, locStatus);
    const location = await Location.findById(insertId);
    res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/locations/:id - admin only
router.put('/:id', requireRole('admin'), async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const { name, address, capacity, status } = req.body;
  const fields = {};
  if (name)                  fields.name     = name.trim();
  if (address !== undefined) fields.address  = address;
  if (capacity !== undefined) fields.capacity = capacity;
  if (status && ['active','inactive'].includes(status)) fields.status = status;

  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

  await Location.updateLocation(req.params.id, fields);
  const updated = await Location.findById(req.params.id);
  res.json({ location: updated });
});

// DELETE /api/locations/:id - admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const used = await Location.countUsage(req.params.id);
  if (used > 0) {
    await Location.deactivateLocation(req.params.id);
    return res.json({ message: 'Location deactivated (used in sessions)' });
  }

  await Location.deleteLocation(req.params.id);
  res.json({ message: 'Location deleted' });
});

export default router;
