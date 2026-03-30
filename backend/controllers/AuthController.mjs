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

    // Load req.user from session on every request
    this.middleware.use(AuthController.#sessionAuth);

    // Routes
    this.routes.post('/login',    AuthController.handleLogin);
    this.routes.post('/register', AuthController.handleRegister);
    this.routes.post('/logout',   AuthController.handleLogout);
    this.routes.get('/me',        AuthController.restrict(), AuthController.viewMe);
    this.routes.put('/me',        AuthController.restrict(), AuthController.updateMe);
  }

  // Middleware: populate req.user from session
  static async #sessionAuth(req, res, next) {
    if (req.session.user) {
      req.user = req.session.user;
    }
    next();
  }

  /**
   * Middleware factory — restricts access to authenticated users.
   * Pass specific roles to also enforce role-based access.
   * @param {string[]} roles - Allowed roles. Empty = any authenticated user.
   */
  static restrict(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        const isApi = req.xhr
          || req.headers.accept?.includes('application/json')
          || req.headers['content-type']?.includes('application/json')
          || req.path.startsWith('/api/');
        if (isApi) return res.status(401).json({ error: 'Not authenticated' });
        return res.redirect('/login');
      }
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        return res.redirect('/');
      }
      next();
    };
  }

  static async handleLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

    try {
      const user = await UserModel.findByEmail(email.toLowerCase().trim());
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });
      if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive. Contact admin.' });

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

      const sessionUser = {
        id: user.id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, phone: user.phone, address: user.address,
      };
      req.session.user = sessionUser;

      const token = Buffer.from(`${sessionUser.id}:${sessionUser.role}:${Date.now()}`).toString('base64');
      res.json({ user: sessionUser, token });
    } catch {
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async handleRegister(req, res) {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    try {
      const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const hash = bcrypt.hashSync(password, 10);
      const insertId = await UserModel.createUser(
        name.trim(), email.toLowerCase().trim(), hash,
        phone || null, address || null, 'member', 'active'
      );

      const profile = await UserModel.getProfile(insertId);
      req.session.user = profile;
      const token = Buffer.from(`${profile.id}:${profile.role}:${Date.now()}`).toString('base64');
      res.status(201).json({ user: profile, token });
    } catch {
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static handleLogout(req, res) {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      res.json({ message: 'Logged out' });
    });
  }

  static viewMe(req, res) {
    res.json({ user: req.user });
  }

  static async updateMe(req, res) {
    const { name, phone, address, password } = req.body;
    if (password && password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const fields = {};
    if (name)                fields.name         = name.trim();
    if (phone !== undefined) fields.phone         = phone;
    if (address !== undefined) fields.address     = address;
    if (password)            fields.passwordHash  = bcrypt.hashSync(password, 10);

    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

    await UserModel.updateUser(req.user.id, fields);
    const updated = await UserModel.getProfile(req.user.id);
    req.session.user = { ...req.session.user, ...updated };
    res.json({ user: updated });
  }
}
