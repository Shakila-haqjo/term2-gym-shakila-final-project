import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthController }  from './AuthController.mjs';
import { UserModel }       from '../models/UserModel.mjs';
import { SessionModel }    from '../models/SessionModel.mjs';
import { BookingModel }    from '../models/BookingModel.mjs';
import { ActivityModel }   from '../models/ActivityModel.mjs';
import { LocationModel }   from '../models/LocationModel.mjs';
import { BlogModel }       from '../models/BlogModel.mjs';



const hasIllegalChars = (value) => {
  if (!value) return false;
  return /[<>#;]/.test(value);
};

const phoneRegex = /^[0-9+\s()-]{8,15}$/;

const adminOnly = AuthController.restrict(['admin']);

/**
 * AdminController
 *
 * Handles all administrative operations for the application.
 * Provides routes and business logic for:
 * - Dashboard management
 * - User management
 * - Session management
 * - Booking management
 * - Activity management
 * - Location management
 * - Blog management
 *
 * All routes in this controller are restricted to users with the "admin" role.
 *
 * @class AdminController
 */


export class AdminController {

  /**
 * Express router containing all admin routes.
 * Each route is protected by admin-only middleware.
 *
 * @type {import('express').Router}
 */

  static routes = express.Router();
/**
 * Initializes all admin routes and binds them to controller methods.
 * This runs automatically when the class is loaded.
 */

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
    r.get('/bookings/create',  adminOnly, AdminController.viewCreateBooking);
    r.get('/bookings/:id', adminOnly, AdminController.editBooking);
    r.post('/bookings', adminOnly, AdminController.handleBookings);
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
/**
 * Renders the admin dashboard with system statistics.
 *
 * @async
 * @function viewDashboard
 * @param {import('express').Request} req - HTTP request object
 * @param {import('express').Response} res - HTTP response object
 * @returns {Promise<void>}
 */

  


  static async viewDashboard(req, res) {
  try {
    const userStats     = await UserModel.getStats();
    const sessionStats  = await SessionModel.getStats();
    const bookingStats  = await BookingModel.getStats();

    const activityStats = await ActivityModel.getStats();
    const locationStats = await LocationModel.getStats();
    const blogStats     = await BlogModel.getStats();

    console.log('BLOG:', blogStats);
    console.log('ACTIVITY:', activityStats);
    console.log('LOCATION:', locationStats);

    res.render('admin/dashboard', {
      userStats,
      sessionStats,
      bookingStats,
      activityStats,
      locationStats,
      blogStats
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('status', {
      status: 'Error',
      message: 'Could not load dashboard.',
      backUrl: req.get('Referer')
    
    });
  }
}

  // ── Users ────────────────────────────────────────────────────────────────────
/**
 * Displays list of users and optionally a selected user.
 *
 * Supports filtering by search, role, and status.
 *
 * @async
 * @function viewUsers
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
  static async viewUsers(req, res) {
    try {
      const { search, role, status } = req.query;
      const users = await UserModel.listUsers({ search, role, status });
      const selectedId = req.params.id;
      const selected = users.find(u => u.id == selectedId) || null;
      res.render('admin/users', { users, selected, search: search || '', roleFilter: role || '', statusFilter: status || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load users.',backUrl: req.get('Referer') });
    }
  }

/**
 * Handles user creation, update, and deletion actions.
 *
 * Supported actions:
 * - create: Creates a new user
 * - update: Updates existing user details
 * - delete: Deactivates a user
 *
 * @async
 * @function handleUsers
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */

  static async handleUsers(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
       const { name, email, password, phone, address, role, status } = req.body;
if (!name || !email || !password) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Name, email and password are required.',
    backUrl: req.get('Referer')
  });
}

if (
  hasIllegalChars(name) ||
  hasIllegalChars(email) ||
  hasIllegalChars(address)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Input contains invalid characters.',
    backUrl: req.get('Referer')
  });
}

if (phone && !phoneRegex.test(phone)) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Invalid phone number.',
    backUrl: req.get('Referer')
  });
}
      const userRole   = ['member', 'trainer', 'admin'].includes(role)   ? role   : 'member';
      const userStatus = ['active', 'inactive'].includes(status)          ? status : 'active';
      try {
        const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
        if (existing) return res.status(409).render('status', { status: 'Error', message: 'Email already registered.',backUrl: req.get('Referer') });
        const hash = bcrypt.hashSync(password, 10);
        await UserModel.createUser(name.trim(), email.toLowerCase().trim(), hash, phone || null, address || null, userRole, userStatus);
        return res.redirect('/admin/users');
      }catch (err) {
  console.error('BOOKING ERROR:', err);

  return res.status(500).render('status', {
    status: 'Database Error',
    message: err.message,
    backUrl: req.get('Referer')
  });
}
    }

    if (action === 'update') {
      const { name, email, phone, address, role, status, password } = req.body;
 
if (
  hasIllegalChars(name) ||
  hasIllegalChars(email) ||
  hasIllegalChars(address)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Input contains invalid characters.',
    backUrl: req.get('Referer')
  });
}

if (phone && !phoneRegex.test(phone)) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Invalid phone number.',
    backUrl: req.get('Referer')
  });
}

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
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update user.' , backUrl: req.get('Referer')});
      }
    }

    if (action === 'delete') {
      try {
        await UserModel.deactivateUser(id);
        return res.redirect('/admin/users');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not deactivate user.' , backUrl: req.get('Referer')});
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.', backUrl: req.get('Referer') });
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────

/**
 * Renders the admin session with system statistics.
 *
 * @async
 * @function viewSessions
 * @param {import('express').Request} req - HTTP request object
 * @param {import('express').Response} res - HTTP response object
 * @returns {Promise<void>}
 */



  static async viewSessions(req, res) {
    try {
      const { search, date } = req.query;
      const sessions    = await SessionModel.listSessions({ search, date });
      const activities  = await ActivityModel.listActivities();
      const locations   = await LocationModel.listLocations();
      const trainers    = await UserModel.listUsers({ role: 'trainer', status: 'active' });

      const selectedId  = req.params.id;
      const selected    = sessions.find(s => s.id == selectedId) || null;
      // const selectedId  = req.params.id;
      // const selected    = sessions.find(s => s.id == selectedId) || null;
      res.render('admin/sessions', { sessions, activities, locations, trainers, selected, search: search || '', dateFilter: date || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load sessions.' , backUrl: req.get('Referer')});
    }
  }

  /**
 * Handles sessions creation, update, and deletion actions.
 *
 * Supported actions:
 * - create: Creates a new sessions
 * - update: Updates existing sessions details
 * - delete: Deactivates a sessions 
 *
 * @async
 * @function handleSessions
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */


 static async handleSessions(req, res) {
  const id     = req.params.id;
  const action = req.body.action;

  // helper to reload page with error
  const reloadPageWithError = async (errorMsg) => {
    const { search, date: dateFilter } = req.query;

    const sessions   = await SessionModel.listSessions({ search, date: dateFilter });
    const activities = await ActivityModel.listActivities();
    const locations  = await LocationModel.listLocations();
    const trainers   = await UserModel.listUsers({ role: 'trainer' , status: 'active' });

    return res.status(400).render('admin/sessions', {
      sessions,
      activities,
      locations,
      trainers,
      selected: null,
      error: errorMsg,
      search: search || '',
      dateFilter: dateFilter || ''
    });
  };

  // ───── CREATE ─────
  if (action === 'create') {
    const { name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description } = req.body;
 if (
  hasIllegalChars(name) ||
  hasIllegalChars(description)
) {
  console.log('INVALID CHARACTERS DETECTED');
  return reloadPageWithError(
    'Special characters (< > # ;) are not allowed.'
  );
}

    // const today = new Date().toISOString().split('T')[0];
    const now = new Date();
now.setHours(0, 0, 0, 0);

const today = now.toLocaleDateString('en-CA');

  if (!name || !date || !time) {
      return reloadPageWithError('Name, date, and time are required.');
    }

 
    

if (date < today) {
  return reloadPageWithError('Cannot create session in the past.');
}

    // if (!name || !date || !time) {
    //   return reloadPageWithError('Name, date, and time are required.');
    // }

    // if (date < today) {
    //   return reloadPageWithError('Cannot create session in the past.');
    // }

    try {
      await SessionModel.createSession(
        name.trim(),
        activity_id || null,
        location_id || null,
        trainer_id || null,
        date,
        time,
        parseInt(duration_minutes) || 60,
        parseInt(max_participants) || 20,
        description || null
      );
      return res.redirect('/admin/sessions');
    } catch (err) {
      console.error(err);
      return reloadPageWithError('Could not create session.');
    }
  }

  // ───── UPDATE ─────
  if (action === 'update') {
    const { name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description } = req.body;
 if (
  hasIllegalChars(name) ||
  hasIllegalChars(description)
) {
  return reloadPageWithError(
    'Special characters (< > # ;) are not allowed.'
  );
}

    const today = new Date();
today.setHours(0,0,0,0);



if (date){
const inputDate = new Date(date);
inputDate.setHours(0,0,0,0);

if (inputDate < today) {
  return reloadPageWithError('Cannot create session in the past.');
}
}
    // if (date && date < today) {
    //   return reloadPageWithError('Session date must be today or future.');
    // }

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
      return reloadPageWithError('Could not update session.');
    }
  }

  // ───── DELETE ─────
  if (action === 'delete') {
    try {
      await SessionModel.deleteSession(id);
      return res.redirect('/admin/sessions');
    } catch (err) {
      console.error(err);
      return reloadPageWithError('Could not delete session.');
    }
  }

  return res.status(400).render('status', {
    status: 'Invalid Action',
    message: 'Unknown form action.',
    backUrl: req.get('Referer')
  });
}

  // ── Bookings ─────────────────────────────────────────────────────────────────


  static async viewCreateBooking(req, res) {
  try {
    const users = await UserModel.listUsers({
  role: 'member',
  status: 'active'
});

    const sessions = await SessionModel.listSessions();

    res.render('admin/create_booking', {
      users,
      sessions,
      error: null
    });

  } catch (err) {
    console.error(err);

    res.status(500).render('status', {
      status: 'Error',
      message: 'Could not load booking form.', backUrl: req.get('Referer')
    });
  }
}

/**
 * Renders the admin booking with system statistics.
 *
 * @async
 * @function viewBookings
 * @param {import('express').Request} req - HTTP request object
 * @param {import('express').Response} res - HTTP response object
 * @returns {Promise<void>}
 */





  static async viewBookings(req, res) {
  try {
    const { status } = req.query;

    const bookings = await BookingModel.listBookings({ status });

    const users = await UserModel.listUsers({ role: 'member' });
    const sessions = await SessionModel.listSessions({ upcoming: true});

    res.render('admin/bookings', {
      bookings,
      users,
      sessions,
      statusFilter: status || ''
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('status', {
      status: 'Error',
      message: 'Could not load bookings.', backUrl: req.get('Referer')
    });
  }
}


//edit booking 

static async editBooking(req, res) {
  try {

    console.log('BOOKING ID:', req.params.id);

    const booking =
      await BookingModel.findRawById(req.params.id);

    console.log('BOOKING FOUND:', booking);

    const users =
      await UserModel.listUsers({
        role: 'member',
        status: 'active'
      });

    const sessions =
      await SessionModel.listSessions();

    res.render(
      'admin/edit-booking',
      {
        booking,
        users,
        sessions
      }
    );

  } catch (err) {
    console.error(err);

    res.status(500).render('status', {
      status: 'Error',
      message: 'Could not load booking.',
      backUrl: '/admin/bookings'
    });
  }
}



  /**
 * Handles booking creation, update, and deletion actions.
 *
 * Supported actions:
 * - create: Creates a new booking
 * - update: Updates existing booking details
 * - delete: Deactivates a booking
 *
 * @async
 * @function handleUsersBooking
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */


  static async handleBookings(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

if (action === 'create') {
  const { user_id, session_id, status } = req.body;

  if (!user_id || !session_id) {
    return res.status(400).render('status', {
      status: 'Validation Error',
      message: 'User and Session are required.', backUrl: req.get('Referer')
    });
  }

  try {

    // Check session exists
    const session = await SessionModel.findRawById(session_id);

    if (!session) {
      return res.status(404).render('status', {
        status: 'Not Found',
        message: 'Session not found.', backUrl: req.get('Referer')
      });
    }


    const sameTimeBooking =
  await BookingModel.findUserBookingAtSameTime(
    user_id,
    session.date,
    session.time
  );

if (sameTimeBooking) {
  return res.status(409).render('status', {
    status: 'Booking Conflict',
    message:
      'User already has another booking at the same time.',
    backUrl: req.get('Referer')
  });
}

    // Prevent booking past sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      return res.status(400).render('status', {
        status: 'Booking Error',
        message: 'Cannot create a booking for a past session.', backUrl: req.get('Referer')
      });
    }

    // Check duplicate booking
    const existing = await BookingModel.findExisting(
      user_id,
      session_id
    );

    if (existing) {
      return res.status(409).render('status', {
        status: 'Error',
        message: 'Booking already exists for this user and session.', backUrl: req.get('Referer')
      });
    }

    await BookingModel.createBooking(
      user_id,
      session_id,
      status || 'confirmed'
    );

    return res.redirect('/admin/bookings');

  } catch (err) {
    console.error(err);

    return res.status(500).render('status', {
      status: 'Database Error',
      message: 'Could not create booking.', backUrl: req.get('Referer')
    });
  }
}


    if (action === 'update') {
      const { status } = req.body;
      const allowed = ['confirmed', 'cancelled', 'completed'];
      if (!allowed.includes(status)) {
        return res.status(400).render('status', { status: 'Validation Error', message: 'Invalid booking status.', backUrl: req.get('Referer') });
      }
      try {
        await BookingModel.updateBookingStatus(id, status);
        return res.redirect('/admin/bookings');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update booking.', backUrl: req.get('Referer') });
      }
    }

    if (action === 'delete') {
      try {
        await BookingModel.deleteBooking(id);
        return res.redirect('/admin/bookings');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete booking.', backUrl: req.get('Referer') });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' , backUrl: req.get('Referer')});
  }

  // ── Activities ───────────────────────────────────────────────────────────────

/**
 * Renders the admin Activity with system statistics.
 *
 * @async
 * @function viewActivities
 * @param {import('express').Request} req - HTTP request object
 * @param {import('express').Response} res - HTTP response object
 * @returns {Promise<void>}
 */



  static async viewActivities(req, res) {
  try {
    const { status } = req.query;

    let activities;
    if (status === 'active') {
      activities = await ActivityModel.listActivities(true);
    } else if (status === 'inactive') {
      activities = await this.query("SELECT * FROM activities WHERE status='inactive'");
    } else {
      activities = await ActivityModel.listActivities();
    }

    const selectedId = req.params.id;
    const selected   = activities.find(a => a.id == selectedId) || null;

    res.render('admin/activities', {
      activities,
      selected,
      statusFilter: status || ''
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('status', { status: 'Error', message: 'Could not load activities.' , backUrl: req.get('Referer')});
  }
}

  /**
 * Creates, updates, or deletes activities based on form action.
 *
 * Actions supported:
 * - create: Add new activity
 * - update: Modify existing activity
 * - delete: Remove activity
 *
 * @async
 * @function handleActivities
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
  static async handleActivities(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
      const { name, description, status } = req.body;
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

      if (!name) return res.status(400).render('status', { status: 'Validation Error', message: 'Name is required.', backUrl: req.get('Referer') });
   if(   
    hasIllegalChars(name) ||
    hasIllegalChars(description)
     )  {
    return res.status(400).render('status', {
      status: 'Validation Error',
      message: 'Invalid characters detected.',
      backUrl: req.get('Referer')
    });
  }

      try {
        await ActivityModel.createActivity(name.trim(), description || null, status === 'inactive' ? 'inactive' : 'active');
        return res.redirect('/admin/activities');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not create activity.' , backUrl: req.get('Referer')});
      }
    }

    if (action === 'update') {
      const { name, description, status } = req.body;
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
      if (!name) return res.status(400).render('status', { status: 'Validation Error', message: 'Name is required.' , backUrl: req.get('Referer')});
       if (
    hasIllegalChars(name) ||
    hasIllegalChars(description)
  ) {
    return res.status(400).render('status', {
      status: 'Validation Error',
      message: 'Invalid characters detected.',
      backUrl: req.get('Referer')
    });
  }
      try {
        await ActivityModel.updateActivity(id, name.trim(), description || null, status === 'inactive' ? 'inactive' : 'active');
        return res.redirect('/admin/activities');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update activity.', backUrl: req.get('Referer') });
      }
    }

    if (action === 'delete') {
      try {
        await ActivityModel.deleteActivity(id);
        return res.redirect('/admin/activities');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete activity.' , backUrl: req.get('Referer')});
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' , backUrl: req.get('Referer')});
  }

  // ── Locations ────────────────────────────────────────────────────────────────

/**
 * Renders the admin location with system statistics.
 *
 * @async
 * @function viewLocations
 * @param {import('express').Request} req - HTTP request object
 * @param {import('express').Response} res - HTTP response object
 * @returns {Promise<void>}
 */


  

static async viewLocations(req, res) {
  try {
    const { status } = req.query;

    let locations;
    if (status === 'active') {
      locations = await LocationModel.listLocations(true);
    } else if (status === 'inactive') {
      locations = await this.query("SELECT * FROM locations WHERE status='inactive'");
    } else {
      locations = await LocationModel.listLocations();
    }

    const selectedId = req.params.id;
    const selected   = locations.find(l => l.id == selectedId) || null;

    res.render('admin/locations', {
      locations,
      selected,
      statusFilter: status || ''
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('status', { status: 'Error', message: 'Could not load locations.', backUrl: req.get('Referer') });
  }
}


/**
 * Handles location creation, update, and deletion actions.
 *
 * Supported actions:
 * - create: Creates a newlocation
 * - update: Updates existing location details
 * - delete: Deactivates a location
 *
 * @async
 * @function handleLocations
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */

  static async handleLocations(req, res) {
    const id     = req.params.id;
    const action = req.body.action;

    if (action === 'create') {
      const { name, address, capacity, status } = req.body;
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
      if (!name) return res.status(400).render('status', { status: 'Validation Error', message: 'Name is required.' , backUrl: req.get('Referer')});
      
      if (
  hasIllegalChars(name) ||
  hasIllegalChars(address)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Invalid characters detected.',
    backUrl: req.get('Referer')
  });
}

      try {
        await LocationModel.createLocation(name.trim(), address || null, parseInt(capacity) || null, status === 'inactive' ? 'inactive' : 'active');
        return res.redirect('/admin/locations');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not create location.', backUrl: req.get('Referer') });
      }
    }

    if (action === 'update') {
      const { name, address, capacity, status } = req.body;
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
      if (
  hasIllegalChars(name) ||
  hasIllegalChars(address)
) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Invalid characters detected.',
    backUrl: req.get('Referer')
  });
}
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
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not update location.' , backUrl: req.get('Referer')});
      }
    }

    if (action === 'delete') {
      try {
        await LocationModel.deleteLocation(id);
        return res.redirect('/admin/locations');
      } catch (err) {
        console.error(err);
        return res.status(500).render('status', { status: 'Database Error', message: 'Could not delete location.', backUrl: req.get('Referer') });
      }
    }

    res.status(400).render('status', { status: 'Invalid Action', message: 'Unknown form action.' , backUrl: req.get('Referer')});
  }

  // ── Blogs ────────────────────────────────────────────────────────────────────


  /**
 * Renders the admin blogs with system statistics.
 *
 * @async
 * @function viewBlogs
 * @param {import('express').Request} req - HTTP request object
 * @param {import('express').Response} res - HTTP response object
 * @returns {Promise<void>}
 */

  static async viewBlogs(req, res) {
    try {
      const { status, search } = req.query;
      const blogs    = await BlogModel.listBlogs({ status, search });
      const selected = req.params.id ? await BlogModel.findById(req.params.id) : null;
      res.render('admin/blogs', { blogs, selected, statusFilter: status || '', search: search || '' });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blogs.', backUrl: req.get('Referer') });
    }
  }
/**
 * Handles blog creation, update, and deletion actions.
 *
 * Supported actions:
 * - create: Creates a new blog
 * - update: Updates existing blog details
 * - delete: Deactivates a blog
 *
 * @async
 * @function handleBlogs
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
  static async handleBlogs(req, res) {
  const id = req.params.id;
  const action = req.body.action;

  if (action === 'create') {
    const { title, category, content, status } = req.body;
    if (hasIllegalChars(title)) {
  return res.status(400).render('status', {
    status: 'Validation Error',
    message: 'Special characters are not allowed in the title.',
    backUrl: req.get('Referer')
  });
}

    if (
      hasIllegalChars(title) ||
      hasIllegalChars(content)
    ) {
      return res.status(400).render('status', {
        status: 'Validation Error',
        message: 'Blog contains invalid characters.',
        backUrl: req.get('Referer')
      });
    }

    try {
      await BlogModel.createBlog(
        req.authenticatedUser.id,
        title,
        category,
        content,
        '',
        status || 'published'
      );

      return res.redirect('/admin/blogs');

    } catch (err) {
      console.error(err);

      return res.status(500).render('status', {
        status: 'Database Error',
        message: 'Could not create blog post.',
        backUrl: req.get('Referer')
      });
    }
  }

  if (action === 'delete') {
    try {
      await BlogModel.deleteBlog(id);
      return res.redirect('/admin/blogs');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', {
        status: 'Database Error',
        message: 'Could not delete blog.',
        backUrl: req.get('Referer')
      });
    }
  }

  return res.status(400).render('status', {
    status: 'Invalid Action',
    message: 'Unknown form action.',
    backUrl: req.get('Referer')
  });
}}