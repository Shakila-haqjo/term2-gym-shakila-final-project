const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');

const BOOKING_SELECT = `
  SELECT b.*,
    u.name as member_name, u.email as member_email,
    s.name as session_name, s.date as session_date, s.time as session_time,
    s.duration_minutes, s.trainer_id,
    a.name as activity_name,
    l.name as location_name,
    t.name as trainer_name
  FROM bookings b
  JOIN users u ON u.id = b.user_id
  JOIN sessions s ON s.id = b.session_id
  LEFT JOIN activities a ON a.id = s.activity_id
  LEFT JOIN locations l ON l.id = s.location_id
  LEFT JOIN users t ON t.id = s.trainer_id
`;

// GET /api/bookings/stats - admin
router.get('/stats', requireRole('admin'), (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM bookings').get().cnt;
  const confirmed = db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE status='confirmed'").get().cnt;
  const cancelled = db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE status='cancelled'").get().cnt;
  const completed = db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE status='completed'").get().cnt;

  // Bookings per day (last 7 days)
  const trend = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as cnt
    FROM bookings
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY day
    ORDER BY day
  `).all();

  res.json({ total, confirmed, cancelled, completed, trend });
});

// GET /api/bookings
router.get('/', authenticate, (req, res) => {
  const { status, upcoming, past } = req.query;
  let sql = BOOKING_SELECT + ' WHERE 1=1';
  const params = [];

  if (req.user.role === 'member') {
    sql += ' AND b.user_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'trainer') {
    sql += ' AND s.trainer_id = ?';
    params.push(req.user.id);
  }
  // admin sees all

  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }
  if (upcoming === 'true') {
    sql += " AND s.date >= date('now')";
  }
  if (past === 'true') {
    sql += " AND s.date < date('now')";
  }

  sql += ' ORDER BY s.date DESC, s.time DESC';

  const bookings = db.prepare(sql).all(...params);
  res.json({ bookings });
});

// POST /api/bookings - member creates booking
router.post('/', requireRole('member'), (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session_id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Check for past session
  if (session.date < new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ error: 'Cannot book a past session' });
  }

  // Check capacity
  const booked = db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE session_id = ? AND status = 'confirmed'").get(session_id).cnt;
  if (booked >= session.max_participants) {
    return res.status(400).json({ error: 'Session is full' });
  }

  // Check duplicate
  const existing = db.prepare('SELECT * FROM bookings WHERE user_id = ? AND session_id = ?').get(req.user.id, session_id);
  if (existing) {
    if (existing.status === 'cancelled') {
      db.prepare("UPDATE bookings SET status = 'confirmed', created_at = datetime('now') WHERE id = ?").run(existing.id);
      const booking = db.prepare(BOOKING_SELECT + ' WHERE b.id = ?').get(existing.id);
      return res.json({ booking });
    }
    return res.status(409).json({ error: 'Already booked this session' });
  }

  try {
    const result = db.prepare('INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?)').run(req.user.id, session_id, 'confirmed');
    const booking = db.prepare(BOOKING_SELECT + ' WHERE b.id = ?').get(result.lastInsertRowid);
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.user.role === 'member' && booking.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Cannot cancel another member\'s booking' });
  }

  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking is already cancelled' });

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Booking cancelled' });
});

// DELETE /api/bookings/:id - admin only
router.delete('/:id', requireRole('admin'), (req, res) => {
  const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Booking deleted' });
});

module.exports = router;
