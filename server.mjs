import express from 'express';
import session from 'express-session';
import ejsLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';
import './database.mjs'; // triggers schema init + seeding

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Note: HTTPS is not enabled during development. Use a reverse proxy (e.g. nginx) with TLS in production.

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'gym-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/app'); // default layout for authenticated pages

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// ── API routes ────────────────────────────────────────────────────────────────
import authRouter      from './controllers/auth.mjs';
import usersRouter     from './controllers/users.mjs';
import sessionsRouter  from './controllers/sessions.mjs';
import bookingsRouter  from './controllers/bookings.mjs';
import blogsRouter     from './controllers/blogs.mjs';
import activitiesRouter from './controllers/activities.mjs';
import locationsRouter from './controllers/locations.mjs';

app.use('/api/auth',       authRouter);
app.use('/api/users',      usersRouter);
app.use('/api/sessions',   sessionsRouter);
app.use('/api/bookings',   bookingsRouter);
app.use('/api/blogs',      blogsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/locations',  locationsRouter);

// ── Public page routes (no auth required) ────────────────────────────────────
app.get('/', (req, res) => {
  // Redirect logged-in users to their dashboard instead of showing the public landing page
  const user = req.session.user;
  if (user) {
    if (user.role === 'admin')   return res.redirect('/admin/dashboard');
    if (user.role === 'trainer') return res.redirect('/trainer/dashboard');
    return res.redirect('/member/dashboard');
  }
  res.render('home', { layout: 'layouts/landing', title: 'FitGym - Premium Fitness Management' });
});

app.get('/login', (req, res) =>
  res.render('login', { layout: 'layouts/public', title: 'Login - FitGym', error: null }));

app.get('/register', (req, res) =>
  res.render('register', { layout: 'layouts/public', title: 'Register - FitGym', error: null }));

app.get('/timetable', (req, res) =>
  res.render('timetable', { layout: 'layouts/landing', title: 'Timetable - FitGym' }));

app.get('/blog', (req, res) =>
  res.render('blog', { layout: 'layouts/landing', title: 'Blog - FitGym' }));

app.get('/blog-detail', (_req, res) =>
  res.render('blog-detail', { layout: 'layouts/landing', title: 'Blog - FitGym' }));

// ── Admin page routes ─────────────────────────────────────────────────────────
app.get('/admin/dashboard', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.redirect('/login');
  res.render('admin/dashboard', {
    layout: 'layouts/app', title: 'Admin Dashboard - FitGym',
    pageTitle: 'Admin Dashboard', activePage: 'dashboard', user,
    pageScript: '/js/admin-dashboard.js',
    extraHead: '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>'
  });
});

app.get('/admin/users', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.redirect('/login');
  res.render('admin/users', {
    layout: 'layouts/app', title: 'Users - FitGym Admin',
    pageTitle: 'User Management', activePage: 'users', user,
    pageScript: '/js/admin-users.js'
  });
});

app.get('/admin/sessions', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.redirect('/login');
  res.render('admin/sessions', {
    layout: 'layouts/app', title: 'Sessions - FitGym Admin',
    pageTitle: 'Sessions Management', activePage: 'sessions', user,
    pageScript: '/js/admin-sessions.js'
  });
});

app.get('/admin/bookings', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.redirect('/login');
  res.render('admin/bookings', {
    layout: 'layouts/app', title: 'Bookings - FitGym Admin',
    pageTitle: 'Bookings Management', activePage: 'bookings', user,
    pageScript: '/js/admin-bookings.js'
  });
});

app.get('/admin/activities', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.redirect('/login');
  res.render('admin/activities', {
    layout: 'layouts/app', title: 'Activities - FitGym Admin',
    pageTitle: 'Activities Management', activePage: 'activities', user,
    pageScript: '/js/admin-activities.js'
  });
});

app.get('/admin/locations', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.redirect('/login');
  res.render('admin/locations', {
    layout: 'layouts/app', title: 'Locations - FitGym Admin',
    pageTitle: 'Locations Management', activePage: 'locations', user,
    pageScript: '/js/admin-locations.js'
  });
});

app.get('/admin/blogs', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.redirect('/login');
  res.render('admin/blogs', {
    layout: 'layouts/app', title: 'Blog Posts - FitGym Admin',
    pageTitle: 'Blog Posts', activePage: 'blogs', user,
    pageScript: '/js/admin-blogs.js'
  });
});

// ── Member page routes ────────────────────────────────────────────────────────
app.get('/member/dashboard', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'member') return res.redirect('/login');
  res.render('member/dashboard', {
    layout: 'layouts/app', title: 'Member Dashboard - FitGym',
    pageTitle: 'Member Dashboard', activePage: 'dashboard', user,
    pageScript: '/js/member-dashboard.js'
  });
});

app.get('/member/sessions', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'member') return res.redirect('/login');
  res.render('member/sessions', {
    layout: 'layouts/app', title: 'Browse Sessions - FitGym',
    pageTitle: 'Browse Sessions', activePage: 'sessions', user,
    pageScript: '/js/member-sessions.js'
  });
});

app.get('/member/bookings', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'member') return res.redirect('/login');
  res.render('member/bookings', {
    layout: 'layouts/app', title: 'My Bookings - FitGym',
    pageTitle: 'My Bookings', activePage: 'bookings', user,
    pageScript: '/js/member-bookings.js'
  });
});

app.get('/member/create-blog', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'member') return res.redirect('/login');
  res.render('member/create-blog', {
    layout: 'layouts/app', title: 'Write Blog Post - FitGym',
    pageTitle: 'Write Blog Post', activePage: 'create-blog', user,
    pageScript: '/js/member-create-blog.js'
  });
});

// ── Trainer page routes ───────────────────────────────────────────────────────
app.get('/trainer/dashboard', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'trainer') return res.redirect('/login');
  res.render('trainer/dashboard', {
    layout: 'layouts/app', title: 'Trainer Dashboard - FitGym',
    pageTitle: 'Trainer Dashboard', activePage: 'dashboard', user,
    pageScript: '/js/trainer-dashboard.js'
  });
});

app.get('/trainer/sessions', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'trainer') return res.redirect('/login');
  res.render('trainer/sessions', {
    layout: 'layouts/app', title: 'My Sessions - FitGym',
    pageTitle: 'My Sessions', activePage: 'sessions', user,
    pageScript: '/js/trainer-sessions.js'
  });
});

app.get('/trainer/create-session', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'trainer') return res.redirect('/login');
  res.render('trainer/create-session', {
    layout: 'layouts/app', title: 'Create Session - FitGym',
    pageTitle: 'Create Session', activePage: 'sessions', user,
    pageScript: '/js/trainer-create-session.js'
  });
});

app.get('/trainer/session-bookings', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'trainer') return res.redirect('/login');
  res.render('trainer/session-bookings', {
    layout: 'layouts/app', title: 'Session Bookings - FitGym',
    pageTitle: 'Session Bookings', activePage: 'sessions', user,
    pageScript: '/js/trainer-session-bookings.js'
  });
});

app.get('/trainer/blog', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'trainer') return res.redirect('/login');
  res.render('trainer/blog', {
    layout: 'layouts/app', title: 'Blog Management - FitGym',
    pageTitle: 'Blog Management', activePage: 'blog', user,
    pageScript: '/js/trainer-blog.js'
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\nGym Management Server running at http://localhost:${PORT}`);
  console.log(`  Admin:   admin@gym.com / admin123`);
  console.log(`  Trainer: sarah@gym.com / trainer123`);
  console.log(`  Member:  alice@gym.com / member123\n`);
});
