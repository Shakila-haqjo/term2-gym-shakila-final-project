// backend/controllers/blog/blogController.js
// controllers/blog/blogController.js

const Blog = require('../../models/Blog');
const User = require('../../models/User');

// Get all blogs with author details
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.findAll();
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single blog by ID
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new blog post
exports.createBlog = async (req, res) => {
    try {
        const { title, content, image } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const blogId = await Blog.create({
            user_id: req.user.id,
            title,
            content,
            image: image || null
        });

        const blog = await Blog.findById(blogId);
        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update blog post
exports.updateBlog = async (req, res) => {
    try {
        const { title, content, image } = req.body;
        const blogId = req.params.id;

        // Check if blog exists and belongs to user
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        if (blog.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this blog' });
        }

        await Blog.update(blogId, { title, content, image });
        const updatedBlog = await Blog.findById(blogId);
        res.json(updatedBlog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete blog post
exports.deleteBlog = async (req, res) => {
    try {
        const blogId = req.params.id;

        // Check if blog exists and belongs to user
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        if (blog.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this blog' });
        }

        await Blog.delete(blogId);
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get blogs by user ID
exports.getBlogsByUser = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const blogs = await Blog.findByUserId(userId);
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};