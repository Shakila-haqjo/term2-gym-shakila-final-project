const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const BLOG_SELECT = `
  SELECT b.*, u.name as author_name, u.avatar as author_avatar
  FROM blogs b
  JOIN users u ON u.id = b.author_id
`;

// GET /api/blogs
router.get('/', (req, res) => {
  const { search, category, status } = req.query;
  const token = req.headers['authorization'];
  let currentUserId = null;

  // Try to get current user (optional auth)
  if (token && token.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
      currentUserId = decoded.id;
    } catch (e) {}
  }

  let sql = BLOG_SELECT + ' WHERE 1=1';
  const params = [];

  // Non-authenticated or members see published only + own drafts
  if (!currentUserId) {
    sql += " AND b.status = 'published'";
  } else {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(currentUserId);
    if (user && user.role === 'admin') {
      // Admin sees all
      if (status) { sql += ' AND b.status = ?'; params.push(status); }
    } else {
      // Authors see their own drafts + all published
      sql += " AND (b.status = 'published' OR b.author_id = ?)";
      params.push(currentUserId);
      if (status) { sql += ' AND b.status = ?'; params.push(status); }
    }
  }

  if (search) {
    sql += ' AND (b.title LIKE ? OR b.category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += ' AND b.category = ?';
    params.push(category);
  }

  sql += ' ORDER BY b.created_at DESC';

  const blogs = db.prepare(sql).all(...params);
  res.json({ blogs });
});

// GET /api/blogs/:id
router.get('/:id', (req, res) => {
  const blog = db.prepare(BLOG_SELECT + ' WHERE b.id = ?').get(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });
  res.json({ blog });
});

// POST /api/blogs
router.post('/', authenticate, (req, res) => {
  const { title, category, content, featured_image, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const blogStatus = status === 'published' ? 'published' : 'draft';

  try {
    const result = db.prepare(`
      INSERT INTO blogs (title, author_id, category, content, featured_image, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title.trim(), req.user.id, category || null, content || null, featured_image || null, blogStatus);

    const blog = db.prepare(BLOG_SELECT + ' WHERE b.id = ?').get(result.lastInsertRowid);
    res.status(201).json({ blog });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id
router.put('/:id', authenticate, (req, res) => {
  const blog = db.prepare('SELECT * FROM blogs WHERE id = ?').get(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  if (blog.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Cannot edit another author\'s blog' });
  }

  const { title, category, content, featured_image, status } = req.body;
  const updates = [];
  const params = [];

  if (title) { updates.push('title = ?'); params.push(title.trim()); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (featured_image !== undefined) { updates.push('featured_image = ?'); params.push(featured_image); }
  if (status && ['published','draft'].includes(status)) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare(BLOG_SELECT + ' WHERE b.id = ?').get(req.params.id);
  res.json({ blog: updated });
});

// DELETE /api/blogs/:id
router.delete('/:id', authenticate, (req, res) => {
  const blog = db.prepare('SELECT * FROM blogs WHERE id = ?').get(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });

  if (blog.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Cannot delete another author\'s blog' });
  }

  db.prepare('DELETE FROM blogs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Blog deleted' });
});

// POST /api/blogs/:id/view
router.post('/:id/view', (req, res) => {
  db.prepare('UPDATE blogs SET views = views + 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'View counted' });
});

module.exports = router;
