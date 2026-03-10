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
router.get('/stats', requireRole('admin'), async (req, res) => {
  const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM bookings');
  const [[{ confirmed }]] = await db.execute("SELECT COUNT(*) as confirmed FROM bookings WHERE status='confirmed'");
  const [[{ cancelled }]] = await db.execute("SELECT COUNT(*) as cancelled FROM bookings WHERE status='cancelled'");
  const [[{ completed }]] = await db.execute("SELECT COUNT(*) as completed FROM bookings WHERE status='completed'");

  const [trend] = await db.execute(`
    SELECT DATE(created_at) as day, COUNT(*) as cnt
    FROM bookings
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY day
    ORDER BY day
  `);

  res.json({ total, confirmed, cancelled, completed, trend });
});

// GET /api/bookings
router.get('/', authenticate, async (req, res) => {
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

  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  if (upcoming === 'true') { sql += ' AND s.date >= CURDATE()'; }
  if (past === 'true') { sql += ' AND s.date < CURDATE()'; }

  sql += ' ORDER BY s.date DESC, s.time DESC';

  const [bookings] = await db.execute(sql, params);
  res.json({ bookings });
});

// POST /api/bookings - member creates booking
router.post('/', requireRole('member'), async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  try {
    const [[session]] = await db.execute('SELECT * FROM sessions WHERE id = ?', [session_id]);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const sessionDate = new Date(session.date).toISOString().slice(0, 10);
    if (sessionDate < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: 'Cannot book a past session' });
    }

    const [[{ booked }]] = await db.execute(
      "SELECT COUNT(*) as booked FROM bookings WHERE session_id = ? AND status = 'confirmed'",
      [session_id]
    );
    if (booked >= session.max_participants) {
      return res.status(400).json({ error: 'Session is full' });
    }

    const [[existing]] = await db.execute(
      'SELECT * FROM bookings WHERE user_id = ? AND session_id = ?',
      [req.user.id, session_id]
    );
    if (existing) {
      if (existing.status === 'cancelled') {
        await db.execute("UPDATE bookings SET status = 'confirmed', created_at = NOW() WHERE id = ?", [existing.id]);
        const [[booking]] = await db.execute(BOOKING_SELECT + ' WHERE b.id = ?', [existing.id]);
        return res.json({ booking });
      }
      return res.status(409).json({ error: 'Already booked this session' });
    }

    const [result] = await db.execute(
      'INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?)',
      [req.user.id, session_id, 'confirmed']
    );
    const [[booking]] = await db.execute(BOOKING_SELECT + ' WHERE b.id = ?', [result.insertId]);
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res) => {
  const [[booking]] = await db.execute('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.user.role === 'member' && booking.user_id !== req.user.id) {
    return res.status(403).json({ error: "Cannot cancel another member's booking" });
  }
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking is already cancelled' });

  await db.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ message: 'Booking cancelled' });
});

// DELETE /api/bookings/:id - admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[booking]] = await db.execute('SELECT id FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  await db.execute('DELETE FROM bookings WHERE id = ?', [req.params.id]);
  res.json({ message: 'Booking deleted' });
});

module.exports = router;
