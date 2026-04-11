import express from 'express';
import { SessionModel } from '../models/SessionModel.mjs';
import { BlogModel }    from '../models/BlogModel.mjs';

export class PublicController {
  static routes = express.Router();

  static {
    const r = PublicController.routes;

    r.get('/',          PublicController.viewHome);
    r.get('/timetable', PublicController.viewTimetable);
    r.get('/blog',      PublicController.viewBlog);
    r.get('/blog/:id',  PublicController.viewBlogDetail);
  }

  static viewHome(req, res) {
    if (req.authenticatedUser) {
      const role = req.authenticatedUser.role;
      if (role === 'admin')   return res.redirect('/admin/dashboard');
      if (role === 'trainer') return res.redirect('/trainer/dashboard');
      return res.redirect('/member/dashboard');
    }
    res.render('home');
  }

  static async viewTimetable(req, res) {
    try {
      const sessions = await SessionModel.listSessions({ upcoming: true });
      res.render('timetable', { sessions });
    } catch (err) {
      console.error(err);
      res.render('timetable', { sessions: [] });
    }
  }

  static async viewBlog(req, res) {
    try {
      const blogs = await BlogModel.listBlogs({ publishedOnly: true });
      res.render('blog', { blogs });
    } catch (err) {
      console.error(err);
      res.render('blog', { blogs: [] });
    }
  }

  static async viewBlogDetail(req, res) {
    try {
      const blog = await BlogModel.findById(req.params.id);
      if (!blog) return res.status(404).render('status', { status: 'Not Found', message: 'Blog post not found.' });
      await BlogModel.incrementViews(req.params.id);
      res.render('blog_detail', { blog });
    } catch (err) {
      console.error(err);
      res.status(500).render('status', { status: 'Error', message: 'Could not load blog post.' });
    }
  }
}
