import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthController } from './controllers/AuthController.mjs';
import { AdminController } from './controllers/AdminController.mjs';
import { MemberController } from './controllers/MemberController.mjs';
import { TrainerController } from './controllers/TrainerController.mjs';
import { PublicController } from './controllers/PublicController.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware + load req.authenticatedUser on every request
app.use(AuthController.middleware);

// Make shared locals available in every EJS template
app.use((req, res, next) => {
  res.locals.authenticatedUser = req.authenticatedUser || null;
  res.locals.currentPath = req.path;
  res.locals.formatDate = (val) => {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    return d.toLocaleDateString('en-CA');
  };
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/authenticate', AuthController.routes);
app.use('/admin', AdminController.routes);
app.use('/member', MemberController.routes);
app.use('/trainer', TrainerController.routes);
app.use('/', PublicController.routes);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).render('status', { status: 'Server Error', message: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Gym Management running at http://localhost:${PORT}`);
  console.log(`  Admin:   admin@gym.com / admin123`);
  console.log(`  Trainer: sarah@gym.com / trainer123`);
  console.log(`  Member:  alice@gym.com / member123`);
});
