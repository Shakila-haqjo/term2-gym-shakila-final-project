// backend/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking/bookingController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All booking routes require authentication
router.post('/', verifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getUserBookings);
router.put('/:id/cancel', verifyToken, bookingController.cancelBooking);

// Trainer/Admin only
router.get('/session/:sessionId', verifyToken, requireRole('trainer', 'admin'), bookingController.getSessionBookings);

module.exports = router;