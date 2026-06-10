import express from 'express';
import { SessionModel } from '../models/SessionModel.mjs';
import { BlogModel }    from '../models/BlogModel.mjs';


/**
 * PublicController
 *
 * Handles all publicly accessible routes in the application.
 * - Home page routing
 * - Viewing timetable (sessions)
 * - Viewing blog list
 * - Viewing individual blog posts
 *
 * These routes are accessible without authentication,
 * but may redirect authenticated users to their dashboards.
 *
 * @class PublicController
 */
export class PublicController {

  /**
 * Express router containing all public routes.
 *
 * @type {import('express').Router}
 */
  static routes = express.Router();

  static {
    const r = PublicController.routes;

    r.get('/',          PublicController.viewHome);
    r.get('/timetable', PublicController.viewTimetable);
    r.get('/blog',      PublicController.viewBlog);
    r.get('/blog/:id',  PublicController.viewBlogDetail);
  }
/**
 * Renders the home page.
 *
 * If a user is already authenticated, redirects them
 * to their respective dashboard based on role.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
  static viewHome(req, res) {
    if (req.authenticatedUser) {
      const role = req.authenticatedUser.role;
      if (role === 'admin')   return res.redirect('/admin/dashboard');
      if (role === 'trainer') return res.redirect('/trainer/dashboard');
      return res.redirect('/member/dashboard');
    }
    res.render('home');
  }
/**
 * Displays the timetable of upcoming sessions.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewTimetable(req, res) {
    try {
      const sessions = await SessionModel.listSessions({ upcoming: true });
      res.render('timetable', { sessions });
    } catch (err) {
      console.error(err);
      res.render('timetable', { sessions: [] });
    }
  }

  /**
 * Displays a list of published blog posts.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewBlog(req, res) {
    try {
      const blogs = await BlogModel.listBlogs({ publishedOnly: true });
      res.render('blog', { blogs });
    } catch (err) {
      console.error(err);
      res.render('blog', { blogs: [] });
    }
  }

  /**
 * Displays a single blog post in detail.
 *
 * Increments the view count for the blog post.
 * Returns 404 if the blog does not exist.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
  static async viewBlogDetail(req, res) {
    try {
      const blog = await BlogModel.findById(req.params.id);
      if (!blog) return res.status(404).render('status', { status: 'Not Found', message: 'Blog post not found.', backUrl: req.get('Referer') });
      await BlogModel.incrementViews(req.params.id);
      res.render('blog_detail', { blog });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog post.', backUrl: req.get('Referer') });
    }
  }
}
