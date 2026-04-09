import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthController }  from './controllers/AuthController.mjs';
import { AdminController } from './controllers/AdminController.mjs';
import { MemberController } from './controllers/MemberController.mjs';
import { TrainerController } from './controllers/TrainerController.mjs';
import { SessionModel } from './models/SessionModel.mjs';
import { BlogModel } from './models/BlogModel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// View engine — plain EJS, no layout library
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware + load req.authenticatedUser on every request
app.use(AuthController.middleware);

// Make authenticatedUser, helpers, and current path available in every EJS template
app.use((req, res, next) => {
  res.locals.authenticatedUser = req.authenticatedUser || null;
  res.locals.currentPath = req.path;
  res.locals.formatDate = (val) => {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  };
  next();
});

// ── Auth routes ───────────────────────────────────────────────────────────────
app.use('/authenticate', AuthController.routes);

// ── Admin routes ──────────────────────────────────────────────────────────────
app.use('/admin', AdminController.routes);

// ── Member routes ─────────────────────────────────────────────────────────────
app.use('/member', MemberController.routes);

// ── Trainer routes ────────────────────────────────────────────────────────────
app.use('/trainer', TrainerController.routes);

// ── Public pages ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.authenticatedUser) {
    const role = req.authenticatedUser.role;
    if (role === 'admin')   return res.redirect('/admin/dashboard');
    if (role === 'trainer') return res.redirect('/trainer/dashboard');
    return res.redirect('/member/dashboard');
  }
  res.render('home');
});

app.get('/timetable', async (req, res) => {
  try {
    const sessions = await SessionModel.listSessions({ upcoming: true });
    res.render('timetable', { sessions });
  } catch (err) {
    console.error(err);
    res.render('timetable', { sessions: [] });
  }
});

app.get('/blog', async (req, res) => {
  try {
    const blogs = await BlogModel.listBlogs({ publishedOnly: true });
    res.render('blog', { blogs });
  } catch (err) {
    console.error(err);
    res.render('blog', { blogs: [] });
  }
});

app.get('/blog/:id', async (req, res) => {
  try {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) return res.status(404).render('status', { status: 'Not Found', message: 'Blog post not found.' });
    await BlogModel.incrementViews(req.params.id);
    res.render('blog_detail', { blog });
  } catch (err) {
    console.error(err);
    res.status(500).render('status', { status: 'Error', message: 'Could not load blog post.' });
  }
});

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
