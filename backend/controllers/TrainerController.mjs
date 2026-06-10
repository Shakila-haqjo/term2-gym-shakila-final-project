import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthController }  from './AuthController.mjs';
import { SessionModel }    from '../models/SessionModel.mjs';
import { ActivityModel }   from '../models/ActivityModel.mjs';
import { LocationModel }   from '../models/LocationModel.mjs';
import { BlogModel }       from '../models/BlogModel.mjs';
import { BookingModel }    from '../models/BookingModel.mjs';
import { UserModel }       from '../models/UserModel.mjs';

const hasIllegalChars = (value) => {
  if (!value) return false;
  return /[<>#;]/.test(value);
};

const trainerOnly = AuthController.restrict(['trainer']);

/**
 * TrainerController
 *
 * Handles all trainer-specific operations in the system.
 * Responsible for:
 * - Viewing trainer dashboard and session statistics
 * - Managing trainer profile
 * - Creating, updating, and deleting sessions
 * - Viewing session bookings
 * - Creating and managing blog posts
 *
 * All routes are restricted to authenticated users with the "trainer" role.
 *
 * @class TrainerController
 */

export class TrainerController {
  /**
 * Express router containing all trainer routes.
 *
 * @type {import('express').Router}
 */
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

    
    r.post('/bookings/:id', trainerOnly, TrainerController.handleBookingUpdate);
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

/**
 * Displays trainer dashboard with sessions and statistics.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewDashboard(req, res) {
    try {
      const sessions = await SessionModel.listSessions({ trainerId: req.authenticatedUser.id, upcoming: true });
      // const stats    = await SessionModel.getStats(req.authenticatedUser.id);
      // const stats = await SessionModel.getStats(req.authenticatedUser.id);
      // const bookingStats = await BookingModel.getStats();

const stats = await SessionModel.getStats(req.authenticatedUser.id);

// get bookings for THIS trainer only
const confirmedBookings = await BookingModel.listBookings({
  trainerId: req.authenticatedUser.id,
  status: 'confirmed'
});

const cancelledBookings = await BookingModel.listBookings({
  trainerId: req.authenticatedUser.id,
  status: 'cancelled'
});

const completedBookings = await BookingModel.listBookings({
  trainerId: req.authenticatedUser.id,
  status: 'completed'
});

      // res.render('trainer/dashboard', { sessions, stats });
//       res.render('trainer/dashboard', { 
//   sessions, 
//   stats,
//   bookingStats
// });


res.render('trainer/dashboard', {
  sessions,
  stats,
  confirmedCount: confirmedBookings.length,
  cancelledCount: cancelledBookings.length,
  completedCount: completedBookings.length
});
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load dashboard.' , backUrl: req.get('Referer')});
    }
  }

  // ── Profile ──────────────────────────────────────────────────────────────────

/**
 * Displays the trainer's profile.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */

static async viewProfile(req, res) {
    try {
      const user = await UserModel.getProfile(req.authenticatedUser.id);
      res.render('trainer/profile', { user, error: null, success: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load profile.', backUrl: req.get('Referer') });
    }
  }

  /**
 * Updates trainer profile details including password.
 *
 * Validates input before updating fields.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
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
      res.status(500).render('status', { status: 'Error', message: 'Could not update profile.', backUrl: req.get('Referer') });
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────
/**
 * Displays sessions created by the trainer.
 *
 * Supports filtering by search and date.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */

  static async viewSessions(req, res) {
    try {
      const { search, date } = req.query;
      const sessions = await SessionModel.listSessions({ trainerId: req.authenticatedUser.id, search, date });
      res.render('trainer/sessions', { sessions, search: search || '', dateFilter: date || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load sessions.', backUrl: req.get('Referer') });
    }
  }
/**
 * Renders the create session form with activities and locations.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewCreateSession(req, res) {
    try {
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      res.render('trainer/create_session', { activities, locations, error: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load form.', backUrl: req.get('Referer') });
    }
  }
/**
 * Handles creation of a new training session.
 *
 * Validates required fields and ensures the session date is not in the past.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async handleCreateSession(req, res) {
     console.log(req.body);

    const { name, activity_id, location_id, date, time, duration_minutes, max_participants, description } = req.body;
    if (
  hasIllegalChars(name) ||
  hasIllegalChars(description)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Special characters are not allowed.',
    backUrl: req.get('Referer')
  });
}
    if (!name || !date || !time) {
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      return res.status(400).render('trainer/create_session', { activities, locations, error: 'Name, date, and time are required.', backUrl: req.get('Referer') });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      return res.status(400).render('trainer/create_session', { activities, locations, error: 'Session date cannot be in the past.', backUrl: req.get('Referer') });
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
      return res.status(500).render('status', { status: 'Error', message: 'Could not create session.', backUrl: req.get('Referer') });
    }
  }
/**
 * Displays the edit form for a session.
 *
 * Ensures the trainer owns the session before allowing edit.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewEditSession(req, res) {
    try {
      const session    = await SessionModel.findById(req.params.id);
      if (!session || session.trainer_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot edit this session.', backUrl: req.get('Referer') });
      }
      const activities = await ActivityModel.listActivities(true);
      const locations  = await LocationModel.listLocations(true);
      res.render('trainer/edit_session', { session, activities, locations, error: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load session.' , backUrl: req.get('Referer')});
    }
  }
/**
 * Handles updating or deleting a session.
 *
 * Actions supported:
 * - update: Modify session details
 * - delete: Remove session
 *
 * Ensures the trainer owns the session before modification.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async handleSession(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    const raw = await SessionModel.findRawById(id);
    if (!raw || raw.trainer_id !== req.authenticatedUser.id) {
      return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot modify this session.', backUrl: req.get('Referer') });
    }

    if (action === 'update') {
      const { name, activity_id, location_id, date, time, duration_minutes, max_participants, description } = req.body;
      if (
  hasIllegalChars(name) ||
  hasIllegalChars(description)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Special characters are not allowed.',
    backUrl: req.get('Referer')
  });
}
      if (date) {
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).render('status', {
        status: 'Error',
        message: 'Session date cannot be in the past.', backUrl: req.get('Referer')
      });
    }
  }
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
        return res.status(500).render('status', { status: 'Error', message: 'Could not update session.', backUrl: req.get('Referer') });
      }
    }

    if (action === 'delete') {
      try {
        await SessionModel.deleteSession(id);
        return res.redirect('/trainer/sessions');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not delete session.', backUrl: req.get('Referer') });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.', backUrl: req.get('Referer') });
  }
/**
 * Displays bookings for a specific session.
 *
 * Ensures the trainer owns the session before viewing bookings.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewSessionBookings(req, res) {
    try {
      const session = await SessionModel.findRawById(req.params.id);
      if (!session || session.trainer_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot view these bookings.', backUrl: req.get('Referer') });
      }
      const bookings = await SessionModel.getSessionBookings(req.params.id);
      res.render('trainer/session_bookings', { session, bookings });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load bookings.' , backUrl: req.get('Referer')});
    }
  }

  // ── Blog ─────────────────────────────────────────────────────────────────────
/**
 * Displays blog posts created by the trainer.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewBlog(req, res) {
    try {
      // const blogs = await BlogModel.listBlogs({ authorId: req.authenticatedUser.id });
      const blogs = await BlogModel.listBlogs(); // show ALL blogs
      res.render('trainer/blog', { blogs });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog posts.' , backUrl: req.get('Referer')});
    }
  }
/**
 * Renders the create blog page.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
static viewCreateBlog(req, res) {
    res.render('trainer/create_blog', { error: null });
  }

  /**
 * Handles creation of a new blog post by the trainer.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
static async handleCreateBlog(req, res) {
    const { title, category, content, status } = req.body;
    if (
  hasIllegalChars(title) ||
  hasIllegalChars(content)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Special characters are not allowed.',
    backUrl: req.get('Referer')
  });
}
   
    if (!title) {
      return res.status(400).render('trainer/create_blog', { error: 'Title is required.', backUrl: req.get('Referer') });
    }
    try {
      const blogStatus = status === 'published' ? 'published' : 'draft';
      await BlogModel.createBlog(req.authenticatedUser.id, title.trim(), category || null, content || null, null, blogStatus);
      return res.redirect('/trainer/blog');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Error', message: 'Could not create blog post.', backUrl: req.get('Referer') });
    }
  }

 /**
 * Displays the edit page for a blog post.
 *
 * Ensures the trainer is the author of the post.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
static async viewEditBlog(req, res) {
    try {
      const blog = await BlogModel.findRawById(req.params.id);
      if (!blog || blog.author_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot edit this blog post.' , backUrl: req.get('Referer')});
      }
      res.render('trainer/edit_blog', { blog, error: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog post.' , backUrl: req.get('Referer')});
    }
  }

  /**
 * Handles updating or deleting a blog post.
 *
 * Actions supported:
 * - update: Modify blog post
 * - delete: Remove blog post
 *
 * Ensures only the author can perform these actions.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
static async handleBlog(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'update') {
      const raw = await BlogModel.findRawById(id);
      if (!raw || raw.author_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot edit this blog post.', backUrl: req.get('Referer') });
      }
      const { title, category, content, status } = req.body;
      if (
  hasIllegalChars(title) ||
  hasIllegalChars(content)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Special characters are not allowed.',
    backUrl: req.get('Referer')
  });
}
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
        return res.status(500).render('status', { status: 'Error', message: 'Could not update blog post.', backUrl: req.get('Referer') });
      }
    }

    if (action === 'delete') {
      const raw = await BlogModel.findRawById(id);
      if (!raw || raw.author_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot delete this blog post.' , backUrl: req.get('Referer')});
      }
      try {
        await BlogModel.deleteBlog(id);
        return res.redirect('/trainer/blog');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not delete blog post.', backUrl: req.get('Referer') });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.', backUrl: req.get('Referer') });
  }


static async handleBookingUpdate(req, res) {
  const id = req.params.id;
  const { status } = req.body;

  try {
    // 1. Get booking
    const booking = await BookingModel.findRawById(id);

    if (!booking) {
      return res.status(404).render('status', {
        status: 'Not Found',
        message: 'Booking not found.', backUrl: req.get('Referer')
      });
    }

    // 2. Check session belongs to this trainer
    const session = await SessionModel.findRawById(booking.session_id);

    if (!session || session.trainer_id !== req.authenticatedUser.id) {
      return res.status(403).render('status', {
        status: 'Forbidden',
        message: 'You cannot update this booking.', backUrl: req.get('Referer')
      });
    }

    // 3. Validate status
    const validStatuses = ['confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).render('status', {
        status: 'Invalid',
        message: 'Invalid booking status.', backUrl: req.get('Referer')
      });
    }

    // 4. Update booking
    await BookingModel.updateBookingStatus(id, status);

    // 5. Redirect back to SAME session bookings page
    return res.redirect(`/trainer/sessions/${booking.session_id}/bookings`);

  } catch (err) {
    console.error(err);
    return res.status(500).render('status', {
      status: 'Error',
      message: 'Could not update booking.', backUrl: req.get('Referer')
    });
  }
}
}