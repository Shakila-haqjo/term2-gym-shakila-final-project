import express from 'express';
import { AuthController } from './AuthController.mjs';
import { SessionModel } from '../models/SessionModel.mjs';
import { UserModel } from '../models/UserModel.mjs';

export class SessionController {
  static routes = express.Router();

  static {
    // Public — no auth required
    this.routes.get('/public', SessionController.listPublic);

    // Authenticated
    this.routes.get('/stats', AuthController.restrict(), SessionController.getStats);
    this.routes.get('/',      AuthController.restrict(), SessionController.listSessions);
    this.routes.get('/:id/bookings', AuthController.restrict(), SessionController.getSessionBookings);
    this.routes.get('/:id',   AuthController.restrict(), SessionController.getSession);
    this.routes.post('/',     AuthController.restrict(['trainer', 'admin']), SessionController.createSession);
    this.routes.put('/:id',   AuthController.restrict(), SessionController.updateSession);
    this.routes.delete('/:id', AuthController.restrict(), SessionController.deleteSession);
  }

  static async listPublic(req, res) {
    const { search, upcoming } = req.query;
    const sessions = await SessionModel.listSessions({ search, upcoming: upcoming === 'true' });
    res.json({ sessions });
  }

  static async getStats(req, res) {
    const trainerId = req.user.role === 'trainer' ? req.user.id : null;
    const stats = await SessionModel.getStats(trainerId);
    res.json(stats);
  }

  static async listSessions(req, res) {
    const { search, activity_id, date, upcoming, mine, trainer_id } = req.query;
    let trainerId;
    if (req.user.role === 'trainer' && mine === 'true') {
      trainerId = req.user.id;
    } else if (req.user.role === 'admin' && trainer_id) {
      trainerId = trainer_id;
    }
    const sessions = await SessionModel.listSessions({ trainerId, search, activity_id, date, upcoming: upcoming === 'true' });
    res.json({ sessions });
  }

  static async getSession(req, res) {
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  }

  static async createSession(req, res) {
    const { name, activity_id, location_id, date, time, duration_minutes, max_participants, description } = req.body;
    if (!name || !date || !time) return res.status(400).json({ error: 'Name, date, and time are required' });

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) return res.status(400).json({ error: 'Session date cannot be in the past.' });

    const trainer_id = req.user.role === 'admin'
      ? (req.body.trainer_id || req.user.id)
      : req.user.id;

    try {
      const trainer = await UserModel.findById(trainer_id);
      if (!trainer || trainer.status !== 'active') {
        return res.status(400).json({ error: 'Cannot create a session with an inactive trainer. Please select an active trainer.' });
      }

      const insertId = await SessionModel.createSession(
        name.trim(), activity_id || null, location_id || null, trainer_id,
        date, time, duration_minutes || 60, max_participants || 20, description || null
      );
      const session = await SessionModel.findById(insertId);
      res.status(201).json({ session });
    } catch {
      res.status(500).json({ error: 'Failed to create session' });
    }
  }

  static async updateSession(req, res) {
    const raw = await SessionModel.findRawById(req.params.id);
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
      const trainer = await UserModel.findById(trainer_id);
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

    await SessionModel.updateSession(req.params.id, fields);
    const session = await SessionModel.findById(req.params.id);
    res.json({ session });
  }

  static async deleteSession(req, res) {
    const raw = await SessionModel.findRawById(req.params.id);
    if (!raw) return res.status(404).json({ error: 'Session not found' });
    if (req.user.role === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
    if (req.user.role === 'trainer' && raw.trainer_id !== req.user.id)
      return res.status(403).json({ error: "Cannot delete another trainer's session" });

    await SessionModel.deleteSession(req.params.id);
    res.json({ message: 'Session deleted' });
  }

  static async getSessionBookings(req, res) {
    const raw = await SessionModel.findRawById(req.params.id);
    if (!raw) return res.status(404).json({ error: 'Session not found' });
    if (req.user.role === 'member') return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'trainer' && raw.trainer_id !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    const bookings = await SessionModel.getSessionBookings(req.params.id);
    res.json({ bookings, session: raw });
  }
}
