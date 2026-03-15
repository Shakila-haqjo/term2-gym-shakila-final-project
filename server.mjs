import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import './database.mjs'; // triggers init

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Import and mount controllers
import authRouter from './controllers/auth.mjs';
import usersRouter from './controllers/users.mjs';
import sessionsRouter from './controllers/sessions.mjs';
import bookingsRouter from './controllers/bookings.mjs';
import blogsRouter from './controllers/blogs.mjs';
import activitiesRouter from './controllers/activities.mjs';
import locationsRouter from './controllers/locations.mjs';

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/blogs', blogsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/locations', locationsRouter);

// Page routes - serve EJS views
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// SPA fallback - serve index.html for all other routes
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
