import express from 'express';
import { AuthController } from './AuthController.mjs';
import { BookingModel } from '../models/BookingModel.mjs';
import { SessionModel } from '../models/SessionModel.mjs';

export class BookingController {
  static routes = express.Router();

  static {
    this.routes.get('/stats',         AuthController.restrict(['admin']), BookingController.getStats);
    this.routes.get('/',              AuthController.restrict(),          BookingController.listBookings);
    this.routes.post('/',             AuthController.restrict(['member']), BookingController.createBooking);
    this.routes.post('/admin-create', AuthController.restrict(['admin']), BookingController.adminCreateBooking);
    this.routes.put('/:id/cancel',    AuthController.restrict(),          BookingController.cancelBooking);
    this.routes.put('/:id',           AuthController.restrict(['admin']), BookingController.updateBooking);
    this.routes.delete('/:id',        AuthController.restrict(['admin']), BookingController.deleteBooking);
  }

  static async getStats(_req, res) {
    const stats = await BookingModel.getStats();
    res.json(stats);
  }

  static async listBookings(req, res) {
    const { status, upcoming, past } = req.query;
    const userId    = req.user.role === 'member'  ? req.user.id : undefined;
    const trainerId = req.user.role === 'trainer' ? req.user.id : undefined;
    const bookings = await BookingModel.listBookings({
      userId, trainerId, status,
      upcoming: upcoming === 'true',
      past:     past     === 'true',
    });
    res.json({ bookings });
  }

  static async createBooking(req, res) {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    try {
      const session = await SessionModel.findRawById(session_id);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const sessionDate = new Date(session.date).toISOString().slice(0, 10);
      if (sessionDate < new Date().toISOString().slice(0, 10))
        return res.status(400).json({ error: 'Cannot book a past session' });

      const booked = await BookingModel.countConfirmed(session_id);
      if (booked >= session.max_participants)
        return res.status(400).json({ error: 'Session is full' });

      const existing = await BookingModel.findExisting(req.user.id, session_id);
      if (existing) {
        if (existing.status === 'cancelled') {
          await BookingModel.reactivate(existing.id);
          const booking = await BookingModel.findById(existing.id);
          return res.json({ booking });
        }
        return res.status(409).json({ error: 'Already booked this session' });
      }

      const insertId = await BookingModel.createBooking(req.user.id, session_id, 'confirmed');
      const booking = await BookingModel.findById(insertId);
      res.status(201).json({ booking });
    } catch {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  static async adminCreateBooking(req, res) {
    const { user_id, session_id } = req.body;
    if (!user_id || !session_id) return res.status(400).json({ error: 'user_id and session_id are required' });

    try {
      const session = await SessionModel.findRawById(session_id);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const booked = await BookingModel.countConfirmed(session_id);
      if (booked >= session.max_participants)
        return res.status(400).json({ error: 'Session is full' });

      const existing = await BookingModel.findExisting(user_id, session_id);
      if (existing) {
        if (existing.status === 'cancelled') {
          await BookingModel.reactivate(existing.id);
          const booking = await BookingModel.findById(existing.id);
          return res.json({ booking });
        }
        return res.status(409).json({ error: 'Member already booked this session' });
      }

      const insertId = await BookingModel.createBooking(user_id, session_id, 'confirmed');
      const booking = await BookingModel.findById(insertId);
      res.status(201).json({ booking });
    } catch {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  static async updateBooking(req, res) {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    try {
      const booking = await BookingModel.findRawById(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      const session = await SessionModel.findRawById(session_id);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const booked = await BookingModel.countConfirmed(session_id);
      if (booked >= session.max_participants)
        return res.status(400).json({ error: 'The selected session is full' });

      await BookingModel.updateBookingSession(req.params.id, session_id);
      const updated = await BookingModel.findById(req.params.id);
      res.json({ booking: updated });
    } catch {
      res.status(500).json({ error: 'Failed to update booking' });
    }
  }

  static async cancelBooking(req, res) {
    const booking = await BookingModel.findRawById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role === 'member' && booking.user_id !== req.user.id)
      return res.status(403).json({ error: "Cannot cancel another member's booking" });
    if (booking.status === 'cancelled')
      return res.status(400).json({ error: 'Booking is already cancelled' });

    await BookingModel.cancelBooking(req.params.id);
    res.json({ message: 'Booking cancelled' });
  }

  static async deleteBooking(req, res) {
    const booking = await BookingModel.findRawById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    await BookingModel.deleteBooking(req.params.id);
    res.json({ message: 'Booking deleted' });
  }
}
