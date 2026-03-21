import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.mjs';
import * as Booking from '../models/BookingModel.mjs';
import * as Session from '../models/SessionModel.mjs';

const router = express.Router();

// GET /api/bookings/stats - admin only
router.get('/stats', requireRole('admin'), async (_req, res) => {
  const stats = await Booking.getStats();
  res.json(stats);
});

// GET /api/bookings
router.get('/', authenticate, async (req, res) => {
  const { status, upcoming, past } = req.query;
  const userId    = req.user.role === 'member'  ? req.user.id : undefined;
  const trainerId = req.user.role === 'trainer' ? req.user.id : undefined;
  const bookings = await Booking.listBookings({
    userId, trainerId, status,
    upcoming: upcoming === 'true',
    past:     past     === 'true'
  });
  res.json({ bookings });
});

// POST /api/bookings - member only
router.post('/', requireRole('member'), async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  try {
    const session = await Session.findRawById(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const sessionDate = new Date(session.date).toISOString().slice(0, 10);
    if (sessionDate < new Date().toISOString().slice(0, 10))
      return res.status(400).json({ error: 'Cannot book a past session' });

    const booked = await Booking.countConfirmed(session_id);
    if (booked >= session.max_participants)
      return res.status(400).json({ error: 'Session is full' });

    const existing = await Booking.findExisting(req.user.id, session_id);
    if (existing) {
      if (existing.status === 'cancelled') {
        await Booking.reactivate(existing.id);
        const booking = await Booking.findById(existing.id);
        return res.json({ booking });
      }
      return res.status(409).json({ error: 'Already booked this session' });
    }

    const insertId = await Booking.createBooking(req.user.id, session_id, 'confirmed');
    const booking = await Booking.findById(insertId);
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// POST /api/bookings/admin-create - admin creates a booking for any member
router.post('/admin-create', requireRole('admin'), async (req, res) => {
  const { user_id, session_id } = req.body;
  if (!user_id || !session_id) return res.status(400).json({ error: 'user_id and session_id are required' });

  try {
    const session = await Session.findRawById(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const booked = await Booking.countConfirmed(session_id);
    if (booked >= session.max_participants)
      return res.status(400).json({ error: 'Session is full' });

    const existing = await Booking.findExisting(user_id, session_id);
    if (existing) {
      if (existing.status === 'cancelled') {
        await Booking.reactivate(existing.id);
        const booking = await Booking.findById(existing.id);
        return res.json({ booking });
      }
      return res.status(409).json({ error: 'Member already booked this session' });
    }

    const insertId = await Booking.createBooking(user_id, session_id, 'confirmed');
    const booking = await Booking.findById(insertId);
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res) => {
  const booking = await Booking.findRawById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (req.user.role === 'member' && booking.user_id !== req.user.id)
    return res.status(403).json({ error: "Cannot cancel another member's booking" });
  if (booking.status === 'cancelled')
    return res.status(400).json({ error: 'Booking is already cancelled' });

  await Booking.cancelBooking(req.params.id);
  res.json({ message: 'Booking cancelled' });
});

// DELETE /api/bookings/:id - admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const booking = await Booking.findRawById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  await Booking.deleteBooking(req.params.id);
  res.json({ message: 'Booking deleted' });
});

export default router;
