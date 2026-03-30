import express from 'express';
import { AuthController } from './AuthController.mjs';
import { BlogModel } from '../models/BlogModel.mjs';
import { UserModel } from '../models/UserModel.mjs';

export class BlogController {
  static routes = express.Router();

  static {
    this.routes.param('id', (_req, res, next, id) => {
      if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid ID' });
      next();
    });

    // Public reads — no auth required
    this.routes.get('/',       BlogController.listBlogs);
    this.routes.get('/:id',    BlogController.getBlog);
    this.routes.post('/:id/view', BlogController.incrementView);

    // Writes — require auth
    this.routes.post('/',      AuthController.restrict(), BlogController.createBlog);
    this.routes.put('/:id',    AuthController.restrict(), BlogController.updateBlog);
    this.routes.delete('/:id', AuthController.restrict(), BlogController.deleteBlog);
  }

  static async listBlogs(req, res) {
    const { search, category, status, mine } = req.query;
    const currentUser = req.session?.user || null;

    let publishedOnly = false;
    let authorId;
    let statusFilter;

    if (!currentUser) {
      // Guests: published posts only
      publishedOnly = true;
    } else if (currentUser.role === 'admin') {
      // Admin: all posts, optionally filtered by status
      statusFilter = status || undefined;
    } else if (mine === 'true') {
      // Logged-in user viewing only their own posts (e.g. management view)
      authorId = currentUser.id;
      statusFilter = status || undefined;
    } else {
      // Any logged-in user viewing the public blog feed: all published posts
      publishedOnly = true;
    }

    const blogs = await BlogModel.listBlogs({ publishedOnly, authorId, search, category, status: statusFilter });
    res.json({ blogs });
  }

  static async getBlog(req, res) {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json({ blog });
  }

  static async createBlog(req, res) {
    if (req.user.role === 'admin') return res.status(403).json({ error: 'Admins cannot create blog posts.' });

    const { title, category, content, featured_image, status } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const blogStatus = status === 'published' ? 'published' : 'draft';
    try {
      if (req.user.role === 'trainer') {
        const trainer = await UserModel.findById(req.user.id);
        if (!trainer || trainer.status !== 'active') {
          return res.status(403).json({ error: 'Inactive trainers cannot create blog posts.' });
        }
      }
      const insertId = await BlogModel.createBlog(
        req.user.id, title.trim(), category || null,
        content || null, featured_image || null, blogStatus
      );
      const blog = await BlogModel.findById(insertId);
      res.status(201).json({ blog });
    } catch {
      res.status(500).json({ error: 'Failed to create blog' });
    }
  }

  static async updateBlog(req, res) {
    if (req.user.role === 'admin') return res.status(403).json({ error: 'Admins cannot edit blog posts.' });

    const raw = await BlogModel.findRawById(req.params.id);
    if (!raw) return res.status(404).json({ error: 'Blog not found' });
    if (raw.author_id !== req.user.id)
      return res.status(403).json({ error: "Cannot edit another author's blog" });

    const { title, category, content, featured_image, status } = req.body;
    const fields = {};
    if (title !== undefined)          fields.title          = title.trim();
    if (category !== undefined)       fields.category       = category;
    if (content !== undefined)        fields.content        = content;
    if (featured_image !== undefined) fields.featured_image = featured_image;
    if (status && ['published', 'draft'].includes(status)) fields.status = status;

    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

    await BlogModel.updateBlog(req.params.id, fields);
    const blog = await BlogModel.findById(req.params.id);
    res.json({ blog });
  }

  static async deleteBlog(req, res) {
    const raw = await BlogModel.findRawById(req.params.id);
    if (!raw) return res.status(404).json({ error: 'Blog not found' });
    if (raw.author_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: "Cannot delete another author's blog" });

    await BlogModel.deleteBlog(req.params.id);
    res.json({ message: 'Blog deleted' });
  }

  static async incrementView(req, res) {
    await BlogModel.incrementViews(req.params.id);
    res.json({ message: 'View counted' });
  }
}
