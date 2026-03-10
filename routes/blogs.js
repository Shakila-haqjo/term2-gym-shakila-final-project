const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { BLOGS } = require('../queries');

// GET /api/blogs
router.get('/', async (req, res) => {
  const { search, category, status } = req.query;
  const token = req.headers['authorization'];
  let currentUserId = null;

  if (token && token.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
      currentUserId = decoded.id;
    } catch (e) {}
  }

  let sql = BLOGS.LIST_BASE;
  const params = [];

  if (!currentUserId) {
    sql += " AND b.status = 'published'";
  } else {
    const [[user]] = await db.execute(BLOGS.GET_AUTHOR_ROLE, [currentUserId]);
    if (user && user.role === 'admin') {
      if (status) { sql += ' AND b.status = ?'; params.push(status); }
    } else {
      sql += " AND (b.status = 'published' OR b.author_id = ?)";
      params.push(currentUserId);
      if (status) { sql += ' AND b.status = ?'; params.push(status); }
    }
  }

  if (search)   { sql += ' AND (b.title LIKE ? OR b.category LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (category) { sql += ' AND b.category = ?'; params.push(category); }
  sql += ' ORDER BY b.created_at DESC';

  const [blogs] = await db.execute(sql, params);
  res.json({ blogs });
});

// GET /api/blogs/:id
router.get('/:id', async (req, res) => {
  const [[blog]] = await db.execute(BLOGS.GET_BY_ID, [req.params.id]);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });
  res.json({ blog });
});

// POST /api/blogs
router.post('/', authenticate, async (req, res) => {
  const { title, category, content, featured_image, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const blogStatus = status === 'published' ? 'published' : 'draft';

  try {
    const [result] = await db.execute(BLOGS.INSERT,
      [title.trim(), req.user.id, category || null, content || null, featured_image || null, blogStatus]
    );
    const [[blog]] = await db.execute(BLOGS.GET_BY_ID, [result.insertId]);
    res.status(201).json({ blog });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id
router.put('/:id', authenticate, async (req, res) => {
  const [[blog]] = await db.execute(BLOGS.GET_RAW, [req.params.id]);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  if (blog.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Cannot edit another author's blog" });
  }

  const { title, category, content, featured_image, status } = req.body;
  const updates = [];
  const params = [];

  if (title)                     { updates.push('title = ?');          params.push(title.trim()); }
  if (category !== undefined)    { updates.push('category = ?');       params.push(category); }
  if (content !== undefined)     { updates.push('content = ?');        params.push(content); }
  if (featured_image !== undefined) { updates.push('featured_image = ?'); params.push(featured_image); }
  if (status && ['published','draft'].includes(status)) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  await db.execute(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, params);

  const [[updated]] = await db.execute(BLOGS.GET_BY_ID, [req.params.id]);
  res.json({ blog: updated });
});

// DELETE /api/blogs/:id
router.delete('/:id', authenticate, async (req, res) => {
  const [[blog]] = await db.execute(BLOGS.GET_RAW, [req.params.id]);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  if (blog.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Cannot delete another author's blog" });
  }

  await db.execute(BLOGS.DELETE, [req.params.id]);
  res.json({ message: 'Blog deleted' });
});

// POST /api/blogs/:id/view
router.post('/:id/view', async (req, res) => {
  await db.execute(BLOGS.INCREMENT_VIEWS, [req.params.id]);
  res.json({ message: 'View counted' });
});

module.exports = router;
