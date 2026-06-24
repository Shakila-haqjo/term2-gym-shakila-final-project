/**
 * server.mjs - Term 2 Gym App Entry Point
 *
 * YOUR EXISTING server.mjs + the Term 2 additions:
 *  1. import cors
 *  2. import APIController
 *  3. app.use(cors(...))         ← allows React on port 5173 to talk to port 3000
 *  4. app.use("/api", ...)       ← REST API for React frontend
 *
 * Admin/EJS routes are UNCHANGED from Term 1.
 * Port stays at 3000 (your existing setting).
 */

import express from 'express';
import path from 'path';
import cors from 'cors';                          // ← NEW (Term 2)
import { fileURLToPath } from 'url';
import { AuthController }   from './controllers/AuthController.mjs';
import { AdminController }  from './controllers/AdminController.mjs';
import { MemberController } from './controllers/MemberController.mjs';
import { TrainerController } from './controllers/TrainerController.mjs';
import { PublicController } from './controllers/PublicController.mjs';
import { APIController }    from './controllers/api/APIController.mjs'; // ← NEW (Term 2)

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS - allows React dev server (port 5173) to call this server ──────────
// Mirrors coffee project's cors setup exactly

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-auth-key", "x-test-header"],
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests for all routes
app.options(/.*/, cors(corsOptions));




// ── View engine (EJS for admin pages - unchanged from Term 1) ─────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// ── Session middleware (unchanged from Term 1) ───────────────────────────
// ── REST API routes FIRST — before any EJS middleware ────────────────────

app.use("/api", APIController.routes);

// ── Session middleware (EJS only - runs after API routes) ────────────────
app.use(AuthController.middleware);

// ── Redirect root to timetable/products ──────────────────────────────────
app.get("/", (req, res) => {
  res.status(301).redirect("/timetable");
});

// ── EJS template globals (unchanged from Term 1) ─────────────────────────
app.use((req, res, next) => {
  res.locals.authenticatedUser = req.authenticatedUser || null;
  res.locals.currentPath = req.path;
  res.locals.formatDate = (val) => {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    return d.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  next();
});

// ── EJS / Admin routes (Term 1 - unchanged) ──────────────────────────────
app.use('/authenticate', AuthController.routes);
app.use('/admin',        AdminController.routes);
app.use('/member',       MemberController.routes);
app.use('/trainer',      TrainerController.routes);
app.use('/',             PublicController.routes);

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).render('status', { status: 'Server Error', message: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Gym Management running at http://localhost:${PORT}`);
  console.log(`  Admin:   admin@gym.com / admin123`);
  console.log(`  API docs: http://localhost:${PORT}/api/docs`);
});
