import express from 'express';
import { authenticate } from '../middleware/auth.mjs';
import * as Blog from '../models/BlogModel.mjs';

const router = express.Router();

// GET /api/blogs
router.get('/', async (req, res) => {
  const { search, category, status } = req.query;
  const currentUser = req.session?.user || null;

  let publishedOnly = false;
  let authorId;
  let statusFilter;

  if (!currentUser) {
    // Unauthenticated: only published posts
    publishedOnly = true;
  } else if (currentUser.role === 'admin') {
    // Admin: see all posts, optionally filtered by status
    statusFilter = status || undefined;
  } else if (status === 'published') {
    // Member/trainer viewing public blog: see ALL published posts (not just own)
    statusFilter = 'published';
  } else {
    // Member/trainer in their own management view: see only their own posts
    authorId = currentUser.id;
    statusFilter = status || undefined;
  }

  const blogs = await Blog.listBlogs({ publishedOnly, authorId, search, category, status: statusFilter });
  res.json({ blogs });
});

// GET /api/blogs/:id
router.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });
  res.json({ blog });
});

// POST /api/blogs
router.post('/', authenticate, async (req, res) => {
  const { title, category, content, featured_image, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const blogStatus = status === 'published' ? 'published' : 'draft';
  try {
    const insertId = await Blog.createBlog(
      req.user.id, title.trim(), category || null,
      content || null, featured_image || null, blogStatus
    );
    const blog = await Blog.findById(insertId);
    res.status(201).json({ blog });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id
router.put('/:id', authenticate, async (req, res) => {
  const raw = await Blog.findRawById(req.params.id);
  if (!raw) return res.status(404).json({ error: 'Blog not found' });
  if (raw.author_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: "Cannot edit another author's blog" });

  const { title, category, content, featured_image, status } = req.body;
  const fields = {};
  if (title !== undefined)          fields.title          = title.trim();
  if (category !== undefined)       fields.category       = category;
  if (content !== undefined)        fields.content        = content;
  if (featured_image !== undefined) fields.featured_image = featured_image;
  if (status && ['published','draft'].includes(status)) fields.status = status;

  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

  await Blog.updateBlog(req.params.id, fields);
  const blog = await Blog.findById(req.params.id);
  res.json({ blog });
});

// DELETE /api/blogs/:id
router.delete('/:id', authenticate, async (req, res) => {
  const raw = await Blog.findRawById(req.params.id);
  if (!raw) return res.status(404).json({ error: 'Blog not found' });
  if (raw.author_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: "Cannot delete another author's blog" });

  await Blog.deleteBlog(req.params.id);
  res.json({ message: 'Blog deleted' });
});

// POST /api/blogs/:id/view
router.post('/:id/view', async (req, res) => {
  await Blog.incrementViews(req.params.id);
  res.json({ message: 'View counted' });
});

export default router;
