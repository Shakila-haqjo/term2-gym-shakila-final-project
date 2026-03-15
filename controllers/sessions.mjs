import express from 'express';
import db from '../database.mjs';
import { authenticate, requireRole } from '../middleware/auth.mjs';
import { SESSIONS } from '../queries.mjs';

const router = express.Router();

// GET /api/sessions
router.get('/', authenticate, async (req, res) => {
  const { search, activity_id, date, upcoming } = req.query;
  let sql = SESSIONS.LIST_BASE;
  const params = [];

  if (req.user.role === 'trainer') {
    sql += ' AND s.trainer_id = ?';
    params.push(req.user.id);
  }
  if (search)      { sql += ' AND (s.name LIKE ? OR a.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (activity_id) { sql += ' AND s.activity_id = ?'; params.push(activity_id); }
  if (date)        { sql += ' AND s.date = ?'; params.push(date); }
  if (upcoming === 'true') { sql += ' AND s.date >= CURDATE()'; }
  sql += ' ORDER BY s.date ASC, s.time ASC';

  const [sessions] = await db.execute(sql, params);
  res.json({ sessions });
});

// GET /api/sessions/stats
router.get('/stats', authenticate, async (req, res) => {
  let total, upcoming, totalBookings;

  if (req.user.role === 'trainer') {
    [[{ total }]]         = await db.execute(SESSIONS.STATS_TOTAL_TRAINER,    [req.user.id]);
    [[{ upcoming }]]      = await db.execute(SESSIONS.STATS_UPCOMING_TRAINER, [req.user.id]);
    [[{ totalBookings }]] = await db.execute(SESSIONS.STATS_BOOKINGS_TRAINER, [req.user.id]);
  } else {
    [[{ total }]]         = await db.execute(SESSIONS.STATS_TOTAL);
    [[{ upcoming }]]      = await db.execute(SESSIONS.STATS_UPCOMING);
    [[{ totalBookings }]] = await db.execute(SESSIONS.STATS_BOOKINGS);
  }

  res.json({ total, upcoming, totalBookings });
});

// GET /api/sessions/public — no auth required, for public timetable
router.get('/public', async (req, res) => {
  const { search, upcoming } = req.query;
  let sql = SESSIONS.LIST_BASE;
  const params = [];

  if (search)               { sql += ' AND (s.name LIKE ? OR a.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (upcoming === 'true')  { sql += ' AND s.date >= CURDATE()'; }
  sql += ' ORDER BY s.date ASC, s.time ASC';

  const [sessions] = await db.execute(sql, params);
  res.json({ sessions });
});

// GET /api/sessions/:id
router.get('/:id', authenticate, async (req, res) => {
  const [[session]] = await db.execute(SESSIONS.GET_BY_ID, [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ session });
});

// POST /api/sessions - trainer or admin
router.post('/', requireRole('trainer', 'admin'), async (req, res) => {
  const { name, activity_id, location_id, date, time, duration_minutes, max_participants, description } = req.body;
  if (!name || !date || !time) return res.status(400).json({ error: 'Name, date, and time are required' });

  const trainer_id = req.user.role === 'admin' ? (req.body.trainer_id || req.user.id) : req.user.id;

  try {
    const [result] = await db.execute(SESSIONS.INSERT,
      [name.trim(), activity_id || null, location_id || null, trainer_id, date, time,
       duration_minutes || 60, max_participants || 20, description || null]
    );
    const [[session]] = await db.execute(SESSIONS.GET_BY_ID, [result.insertId]);
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /api/sessions/:id
router.put('/:id', authenticate, async (req, res) => {
  const [[session]] = await db.execute(SESSIONS.GET_RAW, [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (req.user.role === 'trainer' && session.trainer_id !== req.user.id) {
    return res.status(403).json({ error: "Cannot edit another trainer's session" });
  }
  if (req.user.role === 'member') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description } = req.body;
  const updates = [];
  const params = [];

  if (name)                      { updates.push('name = ?');             params.push(name.trim()); }
  if (activity_id !== undefined) { updates.push('activity_id = ?');      params.push(activity_id); }
  if (location_id !== undefined) { updates.push('location_id = ?');      params.push(location_id); }
  if (req.user.role === 'admin' && trainer_id) { updates.push('trainer_id = ?'); params.push(trainer_id); }
  if (date)              { updates.push('date = ?');             params.push(date); }
  if (time)              { updates.push('time = ?');             params.push(time); }
  if (duration_minutes)  { updates.push('duration_minutes = ?'); params.push(duration_minutes); }
  if (max_participants)  { updates.push('max_participants = ?'); params.push(max_participants); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  await db.execute(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`, params);

  const [[updated]] = await db.execute(SESSIONS.GET_BY_ID, [req.params.id]);
  res.json({ session: updated });
});

// DELETE /api/sessions/:id
router.delete('/:id', authenticate, async (req, res) => {
  const [[session]] = await db.execute(SESSIONS.GET_RAW, [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (req.user.role === 'trainer' && session.trainer_id !== req.user.id) {
    return res.status(403).json({ error: "Cannot delete another trainer's session" });
  }
  if (req.user.role === 'member') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  await db.execute(SESSIONS.DELETE_BOOKINGS, [req.params.id]);
  await db.execute(SESSIONS.DELETE,          [req.params.id]);
  res.json({ message: 'Session deleted' });
});

// GET /api/sessions/:id/bookings - trainer (own) or admin
router.get('/:id/bookings', authenticate, async (req, res) => {
  const [[session]] = await db.execute(SESSIONS.GET_RAW, [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (req.user.role === 'trainer' && session.trainer_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'member') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const [bookings] = await db.execute(SESSIONS.BOOKINGS_LIST, [req.params.id]);
  res.json({ bookings, session });
});

export default router;
