import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthController }  from './AuthController.mjs';
import { SessionModel }    from '../models/SessionModel.mjs';
import { ActivityModel }   from '../models/ActivityModel.mjs';
import { LocationModel }   from '../models/LocationModel.mjs';
import { BlogModel }       from '../models/BlogModel.mjs';
import { BookingModel }    from '../models/BookingModel.mjs';
import { UserModel }       from '../models/UserModel.mjs';

const trainerOnly = AuthController.restrict(['trainer']);

export class TrainerController {
  static routes = express.Router();

  static {
    const r = TrainerController.routes;

    // Dashboard
    r.get('/dashboard', trainerOnly, TrainerController.viewDashboard);

    // Profile
    r.get('/profile',  trainerOnly, TrainerController.viewProfile);
    r.post('/profile', trainerOnly, TrainerController.handleProfile);

    // Sessions
    r.get('/sessions',            trainerOnly, TrainerController.viewSessions);
    r.get('/sessions/create',     trainerOnly, TrainerController.viewCreateSession);
    r.post('/sessions',           trainerOnly, TrainerController.handleCreateSession);
    r.get('/sessions/:id/edit',   trainerOnly, TrainerController.viewEditSession);
    r.post('/sessions/:id',       trainerOnly, TrainerController.handleSession);
    r.get('/sessions/:id/bookings', trainerOnly, TrainerController.viewSessionBookings);

    // Blog
    r.get('/blog',          trainerOnly, TrainerController.viewBlog);
    r.get('/blog/create',   trainerOnly, TrainerController.viewCreateBlog);
    r.post('/blog',         trainerOnly, TrainerController.handleCreateBlog);
    r.get('/blog/:id/edit', trainerOnly, TrainerController.viewEditBlog);
    r.post('/blog/:id',     trainerOnly, TrainerController.handleBlog);
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  static async viewDashboard(req, res) {
    try {
      const sessions = await SessionModel.listSessions({ trainerId: req.authenticatedUser.id, upcoming: true });
      const stats    = await SessionModel.getStats(req.authenticatedUser.id);
      res.render('trainer/dashboard', { sessions, stats });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load dashboard.' });
    }
  }

  // ── Profile ──────────────────────────────────────────────────────────────────

  static async viewProfile(req, res) {
    try {
      const user = await UserModel.getProfile(req.authenticatedUser.id);
      res.render('trainer/profile', { user, error: null, success: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load profile.' });
    }
  }

  static async handleProfile(req, res) {
    const { name, phone, address, password } = req.body;
    const fields = {};
    if (name)              fields.name    = name.trim();
    if (phone !== undefined)   fields.phone   = phone;
    if (address !== undefined) fields.address = address;
    if (password) {
      if (password.length < 6) {
        const user = await UserModel.getProfile(req.authenticatedUser.id);
        return res.status(400).render('trainer/profile', { user, error: 'Password must be at least 6 characters.', success: null });
      }
      fields.passwordHash = bcrypt.hashSync(password, 10);
    }
    try {
      await UserModel.updateUser(req.authenticatedUser.id, fields);
      const updated = await UserModel.getProfile(req.authenticatedUser.id);
      req.session.userId = updated.id;
      res.render('trainer/profile', { user: updated, error: null, success: 'Profile updated successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not update profile.' });
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────

  static async viewSessions(req, res) {
    try {
      const { search, date } = req.query;
      const sessions = await SessionModel.listSessions({ trainerId: req.authenticatedUser.id, search, date });
      res.render('trainer/sessions', { sessions, search: search || '', dateFilter: date || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load sessions.' });
    }
  }

  static async viewCreateSession(req, res) {
    try {
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      res.render('trainer/create_session', { activities, locations, error: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load form.' });
    }
  }

  static async handleCreateSession(req, res) {
    const { name, activity_id, location_id, date, time, duration_minutes, max_participants, description } = req.body;
    if (!name || !date || !time) {
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      return res.status(400).render('trainer/create_session', { activities, locations, error: 'Name, date, and time are required.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      return res.status(400).render('trainer/create_session', { activities, locations, error: 'Session date cannot be in the past.' });
    }

    try {
      await SessionModel.createSession(
        name.trim(), activity_id || null, location_id || null,
        req.authenticatedUser.id, date, time,
        parseInt(duration_minutes) || 60,
        parseInt(max_participants) || 20,
        description || null
      );
      return res.redirect('/trainer/sessions');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Error', message: 'Could not create session.' });
    }
  }

  static async viewEditSession(req, res) {
    try {
      const session    = await SessionModel.findById(req.params.id);
      if (!session || session.trainer_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot edit this session.' });
      }
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      res.render('trainer/edit_session', { session, activities, locations, error: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load session.' });
    }
  }

  static async handleSession(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    const raw = await SessionModel.findRawById(id);
    if (!raw || raw.trainer_id !== req.authenticatedUser.id) {
      return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot modify this session.' });
    }

    if (action === 'update') {
      const { name, activity_id, location_id, date, time, duration_minutes, max_participants, description } = req.body;
      const fields = {};
      if (name)              fields.name             = name.trim();
      if (activity_id)       fields.activity_id      = activity_id;
      if (location_id)       fields.location_id      = location_id;
      if (date)              fields.date             = date;
      if (time)              fields.time             = time;
      if (duration_minutes)  fields.duration_minutes = parseInt(duration_minutes);
      if (max_participants)  fields.max_participants = parseInt(max_participants);
      if (description !== undefined) fields.description = description;
      try {
        await SessionModel.updateSession(id, fields);
        return res.redirect('/trainer/sessions');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not update session.' });
      }
    }

    if (action === 'delete') {
      try {
        await SessionModel.deleteSession(id);
        return res.redirect('/trainer/sessions');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not delete session.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }

  static async viewSessionBookings(req, res) {
    try {
      const session = await SessionModel.findRawById(req.params.id);
      if (!session || session.trainer_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot view these bookings.' });
      }
      const bookings = await SessionModel.getSessionBookings(req.params.id);
      res.render('trainer/session_bookings', { session, bookings });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load bookings.' });
    }
  }

  // ── Blog ─────────────────────────────────────────────────────────────────────

  static async viewBlog(req, res) {
    try {
      const blogs = await BlogModel.listBlogs({ authorId: req.authenticatedUser.id });
      res.render('trainer/blog', { blogs });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog posts.' });
    }
  }

  static viewCreateBlog(req, res) {
    res.render('trainer/create_blog', { error: null });
  }

  static async handleCreateBlog(req, res) {
    const { title, category, content, status } = req.body;
    if (!title) {
      return res.status(400).render('trainer/create_blog', { error: 'Title is required.' });
    }
    try {
      const blogStatus = status === 'published' ? 'published' : 'draft';
      await BlogModel.createBlog(req.authenticatedUser.id, title.trim(), category || null, content || null, null, blogStatus);
      return res.redirect('/trainer/blog');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Error', message: 'Could not create blog post.' });
    }
  }

  static async viewEditBlog(req, res) {
    try {
      const blog = await BlogModel.findRawById(req.params.id);
      if (!blog || blog.author_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot edit this blog post.' });
      }
      res.render('trainer/edit_blog', { blog, error: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog post.' });
    }
  }

  static async handleBlog(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'update') {
      const raw = await BlogModel.findRawById(id);
      if (!raw || raw.author_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot edit this blog post.' });
      }
      const { title, category, content, status } = req.body;
      const fields = {};
      if (title !== undefined)    fields.title    = title.trim();
      if (category !== undefined) fields.category = category;
      if (content !== undefined)  fields.content  = content;
      if (status && ['published', 'draft'].includes(status)) fields.status = status;
      try {
        await BlogModel.updateBlog(id, fields);
        return res.redirect('/trainer/blog');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not update blog post.' });
      }
    }

    if (action === 'delete') {
      const raw = await BlogModel.findRawById(id);
      if (!raw || raw.author_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot delete this blog post.' });
      }
      try {
        await BlogModel.deleteBlog(id);
        return res.redirect('/trainer/blog');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not delete blog post.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }
}
