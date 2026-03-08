// backend/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session/sessionController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', sessionController.getAllSessions);

// Protected routes - Trainer/Admin only
router.post('/', verifyToken, requireRole('trainer', 'admin'), sessionController.createSession);
router.put('/:id', verifyToken, requireRole('trainer', 'admin'), sessionController.updateSession);
router.delete('/:id', verifyToken, requireRole('trainer', 'admin'), sessionController.deleteSession);
router.get('/trainer/my-sessions', verifyToken, requireRole('trainer', 'admin'), sessionController.getTrainerSessions);
router.get('/trainer/:trainerId', verifyToken, sessionController.getTrainerSessionsById);

// Must be last - specific ID route
router.get('/:id', sessionController.getSessionById);

module.exports = router;