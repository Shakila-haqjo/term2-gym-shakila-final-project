import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthController }  from './AuthController.mjs';
import { UserModel }       from '../models/UserModel.mjs';
import { SessionModel }    from '../models/SessionModel.mjs';
import { BookingModel }    from '../models/BookingModel.mjs';
import { ActivityModel }   from '../models/ActivityModel.mjs';
import { LocationModel }   from '../models/LocationModel.mjs';
import { BlogModel }       from '../models/BlogModel.mjs';

const adminOnly = AuthController.restrict(['admin']);

export class AdminController {
  static routes = express.Router();

  static {
    const r = AdminController.routes;

    // Dashboard
    r.get('/dashboard', adminOnly, AdminController.viewDashboard);

    // Users
    r.get('/users',          adminOnly, AdminController.viewUsers);
    r.get('/users/:id',      adminOnly, AdminController.viewUsers);
    r.post('/users',         adminOnly, AdminController.handleUsers);
    r.post('/users/:id',     adminOnly, AdminController.handleUsers);

    // Sessions
    r.get('/sessions',       adminOnly, AdminController.viewSessions);
    r.get('/sessions/:id',   adminOnly, AdminController.viewSessions);
    r.post('/sessions',      adminOnly, AdminController.handleSessions);
    r.post('/sessions/:id',  adminOnly, AdminController.handleSessions);

    // Bookings
    r.get('/bookings',       adminOnly, AdminController.viewBookings);
    r.post('/bookings/:id',  adminOnly, AdminController.handleBookings);

    // Activities
    r.get('/activities',       adminOnly, AdminController.viewActivities);
    r.get('/activities/:id',   adminOnly, AdminController.viewActivities);
    r.post('/activities',      adminOnly, AdminController.handleActivities);
    r.post('/activities/:id',  adminOnly, AdminController.handleActivities);

    // Locations
    r.get('/locations',       adminOnly, AdminController.viewLocations);
    r.get('/locations/:id',   adminOnly, AdminController.viewLocations);
    r.post('/locations',      adminOnly, AdminController.handleLocations);
    r.post('/locations/:id',  adminOnly, AdminController.handleLocations);

    // Blogs
    r.get('/blogs',        adminOnly, AdminController.viewBlogs);
    r.get('/blogs/:id',    adminOnly, AdminController.viewBlogs);
    r.post('/blogs',       adminOnly, AdminController.handleBlogs);
    r.post('/blogs/:id',   adminOnly, AdminController.handleBlogs);
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  static async viewDashboard(req, res) {
    try {
      const userStats    = await UserModel.getStats();
      const sessionStats = await SessionModel.getStats();
      const bookingStats = await BookingModel.getStats();
      res.render('admin/dashboard', { userStats, sessionStats, bookingStats });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load dashboard.' });
    }
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  static async viewUsers(req, res) {
    try {
      const { search, role, status } = req.query;
      const users = await UserModel.listUsers({ search, role, status });
      const selectedId = req.params.id;
      const selected = users.find(u => u.id == selectedId) || null;
      res.render('admin/users', { users, selected, search: search || '', roleFilter: role || '', statusFilter: status || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load users.' });
    }
  }

  static async handleUsers(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
      const { name, email, password, phone, address, role, status } = req.body;
      if (!name || !email || !password) {
        return res.status(400).render('status', { status: 'Validation Error', message: 'Name, email, and password are required.' });
      }
      const userRole   = ['member', 'trainer', 'admin'].includes(role)   ? role   : 'member';
      const userStatus = ['active', 'inactive'].includes(status)          ? status : 'active';
      try {
        const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
        if (existing) return res.status(409).render('status', { status: 'Error', message: 'Email already registered.' });
        const hash = bcrypt.hashSync(password, 10);
        await UserModel.createUser(name.trim(), email.toLowerCase().trim(), hash, phone || null, address || null, userRole, userStatus);
        return res.redirect('/admin/users');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not create user.' });
      }
    }

    if (action === 'update') {
      const { name, email, phone, address, role, status, password } = req.body;
      const fields = {};
      if (name)    fields.name = name.trim();
      if (email)   fields.email = email.toLowerCase().trim();
      if (phone !== undefined)   fields.phone = phone;
      if (address !== undefined) fields.address = address;
      if (role   && ['member', 'trainer', 'admin'].includes(role))   fields.role   = role;
      if (status && ['active', 'inactive'].includes(status))         fields.status = status;
      if (password) fields.passwordHash = bcrypt.hashSync(password, 10);
      try {
        await UserModel.updateUser(id, fields);
        return res.redirect('/admin/users');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update user.' });
      }
    }

    if (action === 'delete') {
      try {
        await UserModel.deactivateUser(id);
        return res.redirect('/admin/users');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not deactivate user.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────

  static async viewSessions(req, res) {
    try {
      const { search, date } = req.query;
      const sessions    = await SessionModel.listSessions({ search, date });
      const activities  = await ActivityModel.listActivities();
      const locations   = await LocationModel.listLocations();
      const trainers    = await UserModel.listUsers({ role: 'trainer' });
      const selectedId  = req.params.id;
      const selected    = sessions.find(s => s.id == selectedId) || null;
      res.render('admin/sessions', { sessions, activities, locations, trainers, selected, search: search || '', dateFilter: date || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load sessions.' });
    }
  }

  static async handleSessions(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
      const { name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description } = req.body;
      if (!name || !date || !time) {
        return res.status(400).render('status', { status: 'Validation Error', message: 'Name, date, and time are required.' });
      }
      try {
        await SessionModel.createSession(
          name.trim(), activity_id || null, location_id || null,
          trainer_id || null, date, time,
          parseInt(duration_minutes) || 60,
          parseInt(max_participants) || 20,
          description || null
        );
        return res.redirect('/admin/sessions');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not create session.' });
      }
    }

    if (action === 'update') {
      const { name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description } = req.body;
      const fields = {};
      if (name)              fields.name             = name.trim();
      if (activity_id)       fields.activity_id      = activity_id;
      if (location_id)       fields.location_id      = location_id;
      if (trainer_id)        fields.trainer_id       = trainer_id;
      if (date)              fields.date             = date;
      if (time)              fields.time             = time;
      if (duration_minutes)  fields.duration_minutes = parseInt(duration_minutes);
      if (max_participants)  fields.max_participants = parseInt(max_participants);
      if (description !== undefined) fields.description = description;
      try {
        await SessionModel.updateSession(id, fields);
        return res.redirect('/admin/sessions');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update session.' });
      }
    }

    if (action === 'delete') {
      try {
        await SessionModel.deleteSession(id);
        return res.redirect('/admin/sessions');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete session.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }

  // ── Bookings ─────────────────────────────────────────────────────────────────

  static async viewBookings(req, res) {
    try {
      const { status } = req.query;
      const bookings = await BookingModel.listBookings({ status });
      res.render('admin/bookings', { bookings, statusFilter: status || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load bookings.' });
    }
  }

  static async handleBookings(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'update') {
      const { status } = req.body;
      const allowed = ['confirmed', 'cancelled', 'completed'];
      if (!allowed.includes(status)) {
        return res.status(400).render('status', { status: 'Validation Error', message: 'Invalid booking status.' });
      }
      try {
        await BookingModel.updateBookingStatus(id, status);
        return res.redirect('/admin/bookings');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update booking.' });
      }
    }

    if (action === 'delete') {
      try {
        await BookingModel.deleteBooking(id);
        return res.redirect('/admin/bookings');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete booking.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }

  // ── Activities ───────────────────────────────────────────────────────────────

  static async viewActivities(req, res) {
    try {
      const activities = await ActivityModel.listActivities();
      const selectedId = req.params.id;
      const selected   = activities.find(a => a.id == selectedId) || null;
      res.render('admin/activities', { activities, selected });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load activities.' });
    }
  }

  static async handleActivities(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
      const { name, description, status } = req.body;
      if (!name) return res.status(400).render('status', { status: 'Validation Error', message: 'Name is required.' });
      try {
        await ActivityModel.createActivity(name.trim(), description || null, status === 'inactive' ? 'inactive' : 'active');
        return res.redirect('/admin/activities');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not create activity.' });
      }
    }

    if (action === 'update') {
      const { name, description, status } = req.body;
      if (!name) return res.status(400).render('status', { status: 'Validation Error', message: 'Name is required.' });
      try {
        await ActivityModel.updateActivity(id, name.trim(), description || null, status === 'inactive' ? 'inactive' : 'active');
        return res.redirect('/admin/activities');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update activity.' });
      }
    }

    if (action === 'delete') {
      try {
        await ActivityModel.deleteActivity(id);
        return res.redirect('/admin/activities');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete activity.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }

  // ── Locations ────────────────────────────────────────────────────────────────

  static async viewLocations(req, res) {
    try {
      const locations  = await LocationModel.listLocations();
      const selectedId = req.params.id;
      const selected   = locations.find(l => l.id == selectedId) || null;
      res.render('admin/locations', { locations, selected });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load locations.' });
    }
  }

  static async handleLocations(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
      const { name, address, capacity, status } = req.body;
      if (!name) return res.status(400).render('status', { status: 'Validation Error', message: 'Name is required.' });
      try {
        await LocationModel.createLocation(name.trim(), address || null, parseInt(capacity) || null, status === 'inactive' ? 'inactive' : 'active');
        return res.redirect('/admin/locations');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not create location.' });
      }
    }

    if (action === 'update') {
      const { name, address, capacity, status } = req.body;
      const fields = {};
      if (name)     fields.name     = name.trim();
      if (address !== undefined)  fields.address  = address;
      if (capacity) fields.capacity = parseInt(capacity);
      if (status)   fields.status   = ['active', 'inactive'].includes(status) ? status : 'active';
      try {
        await LocationModel.updateLocation(id, fields);
        return res.redirect('/admin/locations');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update location.' });
      }
    }

    if (action === 'delete') {
      try {
        await LocationModel.deleteLocation(id);
        return res.redirect('/admin/locations');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete location.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }

  // ── Blogs ────────────────────────────────────────────────────────────────────

  static async viewBlogs(req, res) {
    try {
      const { status, search } = req.query;
      const blogs    = await BlogModel.listBlogs({ status, search });
      const selected = req.params.id ? await BlogModel.findById(req.params.id) : null;
      res.render('admin/blogs', { blogs, selected, statusFilter: status || '', search: search || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blogs.' });
    }
  }

  static async handleBlogs(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
      const { title, category, content, status } = req.body;
      try {
        await BlogModel.createBlog(req.authenticatedUser.id, title, category, content, '', status || 'published');
        return res.redirect('/admin/blogs');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not create blog post.' });
      }
    }

    if (action === 'delete') {
      try {
        await BlogModel.deleteBlog(id);
        return res.redirect('/admin/blogs');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete blog.' });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' });
  }
}
