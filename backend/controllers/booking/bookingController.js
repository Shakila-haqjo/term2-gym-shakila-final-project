// backend/controllers/booking/bookingController.js
const db = require('../../config/database');

// Create booking
exports.createBooking = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user.user_id;

        // Check if session exists and has available spots
        const [sessions] = await db.query(`
            SELECT s.max_participants,
                   (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_bookings
            FROM sessions s
            WHERE s.session_id = ?
        `, [sessionId]);

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (sessions[0].current_bookings >= sessions[0].max_participants) {
            return res.status(400).json({
                success: false,
                message: 'Session is full'
            });
        }

        // Check if user already booked
        const [existingBookings] = await db.query(
            'SELECT booking_id FROM bookings WHERE session_id = ? AND user_id = ? AND status != "cancelled"',
            [sessionId, userId]
        );

        if (existingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Already booked this session'
            });
        }

        // Create booking
        const [result] = await db.query(
            'INSERT INTO bookings (session_id, user_id, status) VALUES (?, ?, "confirmed")',
            [sessionId, userId]
        );

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            bookingId: result.insertId
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking'
        });
    }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT b.*, 
                   s.session_name, s.session_date, s.session_time, s.duration,
                   a.name as activity_name,
                   l.name as location_name,
                   u.first_name, u.last_name
            FROM bookings b
            JOIN sessions s ON b.session_id = s.session_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users u ON s.trainer_id = u.user_id
            WHERE b.user_id = ?
        `;

        const params = [req.user.user_id];

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY s.session_date DESC, s.session_time';

        const [bookings] = await db.query(query, params);

        res.json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        await db.query(
            'UPDATE bookings SET status = "cancelled", cancelled_at = NOW() WHERE booking_id = ? AND user_id = ?',
            [req.params.id, req.user.user_id]
        );

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking'
        });
    }
};

// Get session bookings (trainer/admin)
exports.getSessionBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT b.*, 
                   u.first_name, u.last_name, u.email, u.phone
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            WHERE b.session_id = ?
            ORDER BY b.booking_date
        `, [req.params.sessionId]);

        res.json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Get session bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
};