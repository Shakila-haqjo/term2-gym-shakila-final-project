// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;