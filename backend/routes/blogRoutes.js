// backend/routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog/blogController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', blogController.getAllBlogs);

// Protected routes - authenticated users
router.post('/', verifyToken, blogController.createBlog);
router.put('/:id', verifyToken, blogController.updateBlog);
router.delete('/:id', verifyToken, blogController.deleteBlog);

// Get blogs by user ID - must come before /:id
router.get('/user/:userId', verifyToken, blogController.getBlogsByUser);

// Get single blog - must be last
router.get('/:id', blogController.getBlogById);

module.exports = router;
