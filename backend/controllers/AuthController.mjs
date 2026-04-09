import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { UserModel } from '../models/UserModel.mjs';

export class AuthController {
  static middleware = express.Router();
  static routes = express.Router();

  static {
    // Session middleware
    this.middleware.use(session({
      secret: process.env.SESSION_SECRET || 'gym-secret-key-2024',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
    }));

    // Load req.authenticatedUser from session on every request
    this.middleware.use(AuthController.#sessionAuth);

    // Routes
    this.routes.get('/',        AuthController.viewLogin);
    this.routes.post('/',       AuthController.handleLogin);
    this.routes.get('/logout',  AuthController.handleLogout);
    this.routes.delete('/',     AuthController.handleLogout);

    this.routes.get('/register',  AuthController.viewRegister);
    this.routes.post('/register', AuthController.handleRegister);
  }

  // Middleware: load full user from DB using session userId
  static async #sessionAuth(req, res, next) {
    if (req.session.userId && !req.authenticatedUser) {
      try {
        req.authenticatedUser = await UserModel.findById(req.session.userId);
      } catch (err) {
        console.error(err);
      }
    }
    next();
  }

  /**
   * Restricts a route to authenticated users with the given roles.
   * If no roles given, any authenticated user is allowed.
   */
  static restrict(allowedRoles = []) {
    return (req, res, next) => {
      if (!req.authenticatedUser) {
        return res.status(401).render('status', {
          status: 'Login required',
          message: 'Please log in to access this page.',
        });
      }
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.authenticatedUser.role)) {
        return res.status(403).render('status', {
          status: 'Access forbidden',
          message: 'You do not have permission to access this page.',
        });
      }
      next();
    };
  }

  // GET /authenticate — show login form
  static viewLogin(req, res) {
    if (req.authenticatedUser) return res.redirect('/');
    res.render('login', { error: null });
  }

  // POST /authenticate — handle login
  static async handleLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', { error: 'Email and password are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).render('login', { error: 'Invalid email format.' });
    }

    try {
      const user = await UserModel.findByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).render('login', { error: 'Invalid email or password.' });
      }
      if (user.status !== 'active') {
        return res.status(403).render('login', { error: 'Account is inactive. Contact an admin.' });
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).render('login', { error: 'Invalid email or password.' });
      }

      req.session.userId = user.id;

      if (user.role === 'admin')   return res.redirect('/admin/dashboard');
      if (user.role === 'trainer') return res.redirect('/trainer/dashboard');
      return res.redirect('/member/dashboard');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Login Error', message: 'Login failed. Please try again.' });
    }
  }

  // GET /authenticate/logout — log out and redirect
  static handleLogout(req, res) {
    if (req.authenticatedUser) {
      req.session.destroy(() => {
        res.redirect('/authenticate');
      });
    } else {
      res.redirect('/authenticate');
    }
  }

  // GET /authenticate/register — show register form
  static viewRegister(req, res) {
    if (req.authenticatedUser) return res.redirect('/');
    res.render('register', { error: null });
  }

  // POST /authenticate/register — handle registration
  static async handleRegister(req, res) {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).render('register', { error: 'Name, email, and password are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).render('register', { error: 'Invalid email format.' });
    }
    if (password.length < 6) {
      return res.status(400).render('register', { error: 'Password must be at least 6 characters.' });
    }

    try {
      const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).render('register', { error: 'Email is already registered.' });
      }

      const hash = bcrypt.hashSync(password, 10);
      const insertId = await UserModel.createUser(
        name.trim(), email.toLowerCase().trim(), hash,
        phone || null, address || null, 'member', 'active'
      );

      req.session.userId = insertId;
      return res.redirect('/member/dashboard');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Registration Error', message: 'Registration failed. Please try again.' });
    }
  }
}
