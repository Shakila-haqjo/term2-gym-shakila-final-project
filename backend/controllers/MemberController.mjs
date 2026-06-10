import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthController }  from './AuthController.mjs';
import { UserModel }       from '../models/UserModel.mjs';
import { SessionModel }    from '../models/SessionModel.mjs';
import { BookingModel }    from '../models/BookingModel.mjs';
import { BlogModel }       from '../models/BlogModel.mjs';


const hasIllegalChars = (value) => {
  if (!value) return false;
  return /[<>#;]/.test(value);
};
const memberOnly = AuthController.restrict(['member']);

/**
 * MemberController
 *
 * Handles all member-specific operations in the system.
 * - Viewing dashboard and upcoming bookings
 * - Managing user profile
 * - Browsing and booking sessions
 * - Managing bookings (cancel)
 * - Creating and managing blog posts
 *
 * All routes are restricted to authenticated users with the "member" role.
 *
 * @class MemberController
 */
export class MemberController {


  /**
 * Express router containing all member routes.
 *
 * @type {import('express').Router}
 */
  static routes = express.Router();

  static {
    const r = MemberController.routes;

    // Dashboard
    r.get('/dashboard', memberOnly, MemberController.viewDashboard);

    // Profile
    r.get('/profile',  memberOnly, MemberController.viewProfile);
    r.post('/profile', memberOnly, MemberController.handleProfile);

    // Sessions browse
    r.get('/sessions',            memberOnly, MemberController.viewSessions);
    r.post('/sessions/:id/book',  memberOnly, MemberController.handleBook);

    // Bookings
    r.get('/bookings',              memberOnly, MemberController.viewBookings);
    r.post('/bookings/:id/cancel',  memberOnly, MemberController.handleCancelBooking);

    // Blog
    r.get('/blog',            memberOnly, MemberController.viewBlog);
    r.get('/blog/create',     memberOnly, MemberController.viewCreateBlog);
    r.post('/blog',           memberOnly, MemberController.handleCreateBlog);
    r.get('/blog/:id/edit',   memberOnly, MemberController.viewEditBlog);
    r.post('/blog/:id',       memberOnly, MemberController.handleBlog);
  }

  // ── Profile ──────────────────────────────────────────────────────────────────
/**
 * Displays the logged-in member's profile.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewProfile(req, res) {
    try {
      const user = await UserModel.getProfile(req.authenticatedUser.id);
      res.render('member/profile', { user, error: null, success: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load profile.', backUrl: req.get('Referer') });
    }
  }


  /**
 * Updates member profile information including password.
 *
 * Validates input and updates only provided fields.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */

  static async handleProfile(req, res) {
    const { name, phone, address, password } = req.body;
    if (
  hasIllegalChars(name) ||
  hasIllegalChars(address)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Special characters are not allowed.',
    backUrl: req.get('Referer')
  });
}
    const fields = {};
    if (name)    fields.name    = name.trim();
    if (phone !== undefined)   fields.phone   = phone;
    if (address !== undefined) fields.address = address;
    if (password) {
      if (password.length < 6) {
        const user = await UserModel.getProfile(req.authenticatedUser.id);
        return res.status(400).render('member/profile', { user, error: 'Password must be at least 6 characters.', success: null });
      }
      fields.passwordHash = bcrypt.hashSync(password, 10);
    }
    try {
      await UserModel.updateUser(req.authenticatedUser.id, fields);
      const updated = await UserModel.getProfile(req.authenticatedUser.id);
      req.session.userId = updated.id; // keep session alive
      res.render('member/profile', { user: updated, error: null, success: 'Profile updated successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not update profile.', backUrl: req.get('Referer') });
    }
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  /**
 * Displays member dashboard with upcoming bookings.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */

  static async viewDashboard(req, res) {
    try {
      const bookings = await BookingModel.listBookings({ userId: req.authenticatedUser.id, upcoming: true });
      res.render('member/dashboard', { bookings });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load dashboard.' , backUrl: req.get('Referer')});
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────
/**
 * Displays available sessions for members to browse and filter.
 *
 * Supports search and date filtering.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewSessions(req, res) {
    try {
      const { search, date } = req.query;
      const sessions = await SessionModel.listSessions({ search, date, upcoming: true });
      res.render('member/sessions', { sessions, search: search || '', dateFilter: date || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load sessions.' , backUrl: req.get('Referer')});
    }
  }
/**
 * Handles booking a session for the member.
 *
 * Validates:
 * - Session exists
 * - Session is not in the past
 * - Session capacity is not full
 * - Member has not already booked
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async handleBook(req, res) {
  const sessionId = req.params.id;

  try {
    const session = await SessionModel.findRawById(sessionId);

    if (!session) {
      return res.status(404).render('status', {
        status: 'Not Found',
        message: 'Session not found.', backUrl: req.get('Referer')
      });
    }

    // Prevent booking past sessions
    const today = new Date().toISOString().split('T')[0];

    const sessionDateString = new Date(session.date)
      .toISOString()
      .split('T')[0];

    if (sessionDateString < today) {
      return res.status(400).render('status', {
        status: 'Booking Error',
        message: 'Cannot book a past session.', backUrl: req.get('Referer')
      });
    }

    // Check capacity
    const booked = await BookingModel.countConfirmed(sessionId);

    if (booked >= session.max_participants) {
      return res.status(400).render('status', {
        status: 'Session Full',
        message: 'This session is fully booked.', backUrl: req.get('Referer')
      });
    }

    // Check existing booking
    const existing = await BookingModel.findExisting(
      req.authenticatedUser.id,
      sessionId
    );

    if (existing) {

      if (existing.status === 'cancelled') {
        await BookingModel.reactivate(existing.id);
        return res.redirect('/member/bookings');
      }

      return res.status(409).render('status', {
        status: 'Already Booked',
        message: 'You have already booked this session.', backUrl: req.get('Referer')
      });
    }

    // Create booking
    await BookingModel.createBooking(
      req.authenticatedUser.id,
      sessionId,
      'confirmed'
    );

    return res.redirect('/member/bookings');

  } catch (err) {

    console.error(err);

    return res.status(500).render('status', {
      status: 'Booking Error',
      message: 'Could not book session.', backUrl: req.get('Referer')
    });
  }
}

  // ── Bookings ─────────────────────────────────────────────────────────────────
/**
 * Displays all bookings for the logged-in member.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewBookings(req, res) {
    try {
      const bookings = await BookingModel.listBookings({ userId: req.authenticatedUser.id });
      res.render('member/bookings', { bookings });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load bookings.', backUrl: req.get('Referer') });
    }
  }

  /**
 * Cancels a booking belonging to the logged-in member.
 *
 * Ensures the booking belongs to the user before cancellation.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */

  static async handleCancelBooking(req, res) {
    try {
      const booking = await BookingModel.findRawById(req.params.id);
      if (!booking || booking.user_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot cancel this booking.', backUrl: req.get('Referer') });
      }
      await BookingModel.cancelBooking(req.params.id);
      return res.redirect('/member/bookings');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Error', message: 'Could not cancel booking.', backUrl: req.get('Referer') });
    }
  }


  // ── Blog ─────────────────────────────────────────────────────────────────────
/**
 * Displays all published blog posts.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewBlog(req, res) {
    try {
      // const blogs = await BlogModel.listBlogs({ publishedOnly: true });
      const blogs = await BlogModel.listBlogs();
      res.render('member/blog', { blogs });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog.', backUrl: req.get('Referer') });
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
    res.render('member/create_blog', { error: null });
  }

  static async handleCreateBlog(req, res) {
    const { title, category, content, status } = req.body;
    if (
  hasIllegalChars(title) ||
  hasIllegalChars(content)
) {

  console.log('INVALID CHARACTERS DETECTED');

  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Special characters are not allowed.',
    backUrl: req.get('Referer')
  });
}
    if (!title) {
      return res.status(400).render('member/create_blog', { error: 'Title is required.', backUrl: req.get('Referer') });
    }
    try {
      const blogStatus = status === 'published' ? 'published' : 'draft';
      await BlogModel.createBlog(req.authenticatedUser.id, title.trim(), category || null, content || null, null, blogStatus);
      return res.redirect('/member/blog');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Error', message: 'Could not create blog post.', backUrl: req.get('Referer') });
    }
  }
/**
 * Displays the edit page for a specific blog post.
 *
 * Ensures the logged-in user is the author.
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
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot edit this blog post.', backUrl: req.get('Referer') });
      }
      res.render('member/edit_blog', { blog, error: null });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog post.', backUrl: req.get('Referer') });
    }
  }
/**
 * Handles updating or deleting a blog post.
 *
 * Actions supported:
 * - update: Modify blog content
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
      const fields = {};
      if (title !== undefined)   fields.title    = title.trim();
      if (category !== undefined) fields.category = category;
      if (content !== undefined) fields.content  = content;
      if (status && ['published', 'draft'].includes(status)) fields.status = status;
      try {
        await BlogModel.updateBlog(id, fields);
        return res.redirect('/member/blog');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not update blog post.', backUrl: req.get('Referer') });
      }
    }

    if (action === 'delete') {
      const raw = await BlogModel.findRawById(id);
      if (!raw || raw.author_id !== req.authenticatedUser.id) {
        return res.status(403).render('status', { status: 'Forbidden', message: 'Cannot delete this blog post.', backUrl: req.get('Referer') });
      }
      try {
        await BlogModel.deleteBlog(id);
        return res.redirect('/member/blog');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Error', message: 'Could not delete blog post.', backUrl: req.get('Referer') });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' , backUrl: req.get('Referer')});
  }
}
