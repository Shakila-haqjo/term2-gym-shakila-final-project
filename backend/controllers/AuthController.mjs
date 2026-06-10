import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { UserModel } from '../models/UserModel.mjs';



function containsDangerousChars(value) {
  return /[<>#;]/.test(value);
}

const phoneRegex = /^[0-9+\s()-]{8,15}$/;


/**
 * AuthController
 *
 * Handles authentication and session management for the application.
 * - User login and logout
 * - User registration
 * - Session handling using express-session
 * - Role-based access control middleware
 *
 * Provides middleware and routes for authentication-related operations.
 *
 * @class AuthController
 */

export class AuthController {
  /**
 * Middleware router for session handling and authentication state.
 *
 * @type {import('express').Router}
 */
  static middleware = express.Router();

  /**
 * Router containing authentication-related routes.
 *
 * @type {import('express').Router}
 */
  static routes = express.Router();


  /**
 * Initializes session middleware and authentication routes.
 * Automatically runs when the class is loaded.
 */

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

  /**
 * Middleware to attach authenticated user to the request object.
 * Retrieves user from database using session userId.
 *
 * @async
 * @private
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
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


  /**
 * Middleware factory to restrict access based on user roles.
 *
 * If no roles are provided, any authenticated user is allowed.
 *
 * @param {string[]} [allowedRoles=[]] - List of roles allowed to access the route
 * @returns {import('express').RequestHandler}
 */
  static restrict(allowedRoles = []) {
    return (req, res, next) => {
      if (!req.authenticatedUser) {
        return res.status(401).render('status', {
          status: 'Login required',
          message: 'Please log in to access this page.',backUrl: req.get('Referer')
        });
      }
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.authenticatedUser.role)) {
        return res.status(403).render('status', {
          status: 'Access forbidden',
          message: 'You do not have permission to access this page.',backUrl: req.get('Referer')
        });
      }
      next();
    };
  }

  // GET /authenticate — show login form

  /**
 * Renders the login page.
 *
 * Redirects authenticated users to home.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
  static viewLogin(req, res) {
    if (req.authenticatedUser) return res.redirect('/');
    res.render('login', { error: null });
  }

  // POST /authenticate — handle login

  /**
 * Handles user login authentication.
 *
 * Validates credentials and creates a session on success.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async handleLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', { error: 'Email and password are required.', backUrl: req.get('Referer') });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).render('login', { error: 'Invalid email format.', backUrl: req.get('Referer') });
    }

    try {
      const user = await UserModel.findByEmail(email.toLowerCase().trim());
      console.log("EMAIL ENTERED:", email);
      console.log("USER FOUND:", user);
      if (!user) {
        return res.status(401).render('login', { error: 'Invalid email or password.', backUrl: req.get('Referer') });
      }
      if (user.status !== 'active') {
        return res.status(403).render('login', { error: 'Account is inactive. Contact an admin.', backUrl: req.get('Referer') });
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      console.log("PASSWORD MATCH:", valid);
      if (!valid) {
        return res.status(401).render('login', { error: 'Invalid email or password.' , backUrl: req.get('Referer')});
      }

      req.session.userId = user.id;

      if (user.role === 'admin')   return res.redirect('/admin/dashboard');
      if (user.role === 'trainer') return res.redirect('/trainer/dashboard');
      return res.redirect('/member/dashboard');
    } catch (err) {
      console.error(err);
      return res.status(500).render('status', { status: 'Login Error', message: 'Login failed. Please try again.', backUrl: req.get('Referer') });
    }
  }

  // GET /authenticate/logout — log out and redirect

  /**
 * Logs out the current user by destroying the session.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
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
  /**
 * Renders the registration page.
 *
 * Redirects authenticated users to home.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
  static viewRegister(req, res) {
    if (req.authenticatedUser) return res.redirect('/');
    res.render('register', { error: null });
  }

  // POST /authenticate/register — handle registration

  /**
 * Handles new user registration.
 *
 * Validates input, creates user, and starts session.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async handleRegister(req, res) {
    const { name, email, password, phone, address } = req.body;
    if (
  hasIllegalChars(name) ||
  hasIllegalChars(address)
) {
  return res.status(400).render('register', {
    error: 'Special characters are not allowed.'
  });
}

    if (!name || !email || !password) {
      return res.status(400).render('register', { error: 'Name, email, and password are required.', backUrl: req.get('Referer') });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).render('register', { error: 'Invalid email format.' , backUrl: req.get('Referer')});
    }
    if (phone && !phoneRegex.test(phone)) {
  return res.status(400).render('register', {
    error: 'Invalid phone number.'
  });
}
    if (password.length < 6) {
      return res.status(400).render('register', { error: 'Password must be at least 6 characters.', backUrl: req.get('Referer') });
    }

    try {
      const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).render('register', { error: 'Email is already registered.' , backUrl: req.get('Referer')});
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
      return res.status(500).render('status', { status: 'Registration Error', message: 'Registration failed. Please try again.', backUrl: req.get('Referer') });
    }
  }
}
