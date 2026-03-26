import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.mjs';
import * as Session from '../models/SessionModel.mjs';
import * as User from '../models/UserModel.mjs';

const router = express.Router();

// GET /api/sessions/public — no auth required (public timetable)
router.get('/public', async (req, res) => {
  const { search, upcoming } = req.query;
  const sessions = await Session.listSessions({
    search,
    upcoming: upcoming === 'true'
  });
  res.json({ sessions });
});

// GET /api/sessions/stats
router.get('/stats', authenticate, async (req, res) => {
  const trainerId = req.user.role === 'trainer' ? req.user.id : null;
  const stats = await Session.getStats(trainerId);
  res.json(stats);
});

// GET /api/sessions
router.get('/', authenticate, async (req, res) => {
  const { search, activity_id, date, upcoming, mine } = req.query;
  const trainerId = (req.user.role === 'trainer' && mine === 'true') ? req.user.id : undefined;
  const sessions = await Session.listSessions({
    trainerId, search, activity_id, date,
    upcoming: upcoming === 'true'
  });
  res.json({ sessions });
});

// GET /api/sessions/:id
router.get('/:id', authenticate, async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ session });
});

// POST /api/sessions
router.post('/', requireRole('trainer', 'admin'), async (req, res) => {
  const { name, activity_id, location_id, date, time, duration_minutes, max_participants, description } = req.body;
  if (!name || !date || !time) return res.status(400).json({ error: 'Name, date, and time are required' });

  const trainer_id = req.user.role === 'admin'
    ? (req.body.trainer_id || req.user.id)
    : req.user.id;

  try {
    // Ensure the assigned trainer is active
    const trainer = await User.findById(trainer_id);
    if (!trainer || trainer.status !== 'active') {
      return res.status(400).json({ error: 'Cannot create a session with an inactive trainer. Please select an active trainer.' });
    }

    const insertId = await Session.createSession(
      name.trim(), activity_id || null, location_id || null, trainer_id,
      date, time, duration_minutes || 60, max_participants || 20, description || null
    );
    const session = await Session.findById(insertId);
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /api/sessions/:id
router.put('/:id', authenticate, async (req, res) => {
  const raw = await Session.findRawById(req.params.id);
  if (!raw) return res.status(404).json({ error: 'Session not found' });
  if (req.user.role === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
  if (req.user.role === 'trainer' && raw.trainer_id !== req.user.id)
    return res.status(403).json({ error: "Cannot edit another trainer's session" });

  const { name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description } = req.body;
  const fields = {};
  if (name)                      fields.name             = name.trim();
  if (activity_id !== undefined) fields.activity_id      = activity_id;
  if (location_id !== undefined) fields.location_id      = location_id;
  if (req.user.role === 'admin' && trainer_id) {
    const trainer = await User.findById(trainer_id);
    if (!trainer || trainer.status !== 'active') {
      return res.status(400).json({ error: 'Cannot assign an inactive trainer to a session.' });
    }
    fields.trainer_id = trainer_id;
  }
  if (date)              fields.date             = date;
  if (time)              fields.time             = time;
  if (duration_minutes)  fields.duration_minutes = duration_minutes;
  if (max_participants)  fields.max_participants = max_participants;
  if (description !== undefined) fields.description = description;

  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

  await Session.updateSession(req.params.id, fields);
  const session = await Session.findById(req.params.id);
  res.json({ session });
});

// DELETE /api/sessions/:id
router.delete('/:id', authenticate, async (req, res) => {
  const raw = await Session.findRawById(req.params.id);
  if (!raw) return res.status(404).json({ error: 'Session not found' });
  if (req.user.role === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
  if (req.user.role === 'trainer' && raw.trainer_id !== req.user.id)
    return res.status(403).json({ error: "Cannot delete another trainer's session" });

  await Session.deleteSession(req.params.id);
  res.json({ message: 'Session deleted' });
});

// GET /api/sessions/:id/bookings
router.get('/:id/bookings', authenticate, async (req, res) => {
  const raw = await Session.findRawById(req.params.id);
  if (!raw) return res.status(404).json({ error: 'Session not found' });
  if (req.user.role === 'member') return res.status(403).json({ error: 'Access denied' });
  if (req.user.role === 'trainer' && raw.trainer_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied' });

  const bookings = await Session.getSessionBookings(req.params.id);
  res.json({ bookings, session: raw });
});

export default router;
