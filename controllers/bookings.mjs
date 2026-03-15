import express from 'express';
import db from '../database.mjs';
import { authenticate, requireRole } from '../middleware/auth.mjs';
import { BOOKINGS, SESSIONS } from '../queries.mjs';

const router = express.Router();

// GET /api/bookings/stats - admin only
router.get('/stats', requireRole('admin'), async (_req, res) => {
  const [[{ total }]]     = await db.execute(BOOKINGS.STATS_TOTAL);
  const [[{ confirmed }]] = await db.execute(BOOKINGS.STATS_CONFIRMED);
  const [[{ cancelled }]] = await db.execute(BOOKINGS.STATS_CANCELLED);
  const [[{ completed }]] = await db.execute(BOOKINGS.STATS_COMPLETED);
  const [trend]           = await db.execute(BOOKINGS.STATS_TREND);
  res.json({ total, confirmed, cancelled, completed, trend });
});

// GET /api/bookings
router.get('/', authenticate, async (req, res) => {
  const { status, upcoming, past } = req.query;
  let sql = BOOKINGS.LIST_BASE;
  const params = [];

  if (req.user.role === 'member')  { sql += ' AND b.user_id = ?';    params.push(req.user.id); }
  if (req.user.role === 'trainer') { sql += ' AND s.trainer_id = ?'; params.push(req.user.id); }

  if (status)           { sql += ' AND b.status = ?';       params.push(status); }
  if (upcoming === 'true') { sql += ' AND s.date >= CURDATE()'; }
  if (past === 'true')     { sql += ' AND s.date < CURDATE()'; }
  sql += ' ORDER BY s.date DESC, s.time DESC';

  const [bookings] = await db.execute(sql, params);
  res.json({ bookings });
});

// POST /api/bookings - member creates booking
router.post('/', requireRole('member'), async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  try {
    const [[session]] = await db.execute(SESSIONS.GET_RAW, [session_id]);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const sessionDate = new Date(session.date).toISOString().slice(0, 10);
    if (sessionDate < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: 'Cannot book a past session' });
    }

    const [[{ booked }]] = await db.execute(BOOKINGS.CHECK_CAPACITY, [session_id]);
    if (booked >= session.max_participants) {
      return res.status(400).json({ error: 'Session is full' });
    }

    const [[existing]] = await db.execute(BOOKINGS.CHECK_EXISTING, [req.user.id, session_id]);
    if (existing) {
      if (existing.status === 'cancelled') {
        await db.execute(BOOKINGS.REACTIVATE, [existing.id]);
        const [[booking]] = await db.execute(BOOKINGS.GET_BY_ID, [existing.id]);
        return res.json({ booking });
      }
      return res.status(409).json({ error: 'Already booked this session' });
    }

    const [result] = await db.execute(BOOKINGS.INSERT, [req.user.id, session_id, 'confirmed']);
    const [[booking]] = await db.execute(BOOKINGS.GET_BY_ID, [result.insertId]);
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res) => {
  const [[booking]] = await db.execute(BOOKINGS.GET_RAW, [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (req.user.role === 'member' && booking.user_id !== req.user.id) {
    return res.status(403).json({ error: "Cannot cancel another member's booking" });
  }
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking is already cancelled' });

  await db.execute(BOOKINGS.CANCEL, [req.params.id]);
  res.json({ message: 'Booking cancelled' });
});

// DELETE /api/bookings/:id - admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[booking]] = await db.execute(BOOKINGS.CHECK_ID, [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  await db.execute(BOOKINGS.DELETE, [req.params.id]);
  res.json({ message: 'Booking deleted' });
});

export default router;
