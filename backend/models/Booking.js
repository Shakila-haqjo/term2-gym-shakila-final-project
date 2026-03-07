// backend/models/Booking.js
// models/Booking.js

const db = require('../config/database');

class Booking {
    // Find all bookings with session and user details
    static async findAll() {
        const [rows] = await db.query(`
            SELECT 
                b.booking_id as id,
                b.booking_date,
                b.status,
                b.cancelled_at,
                b.session_id,
                b.user_id,
                s.session_name,
                s.session_date,
                s.session_time,
                s.duration,
                a.name as activity_name,
                l.name as location_name,
                l.address as location_address,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                CONCAT(t.first_name, ' ', t.last_name) as trainer_name
            FROM bookings b
            JOIN sessions s ON b.session_id = s.session_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users u ON b.user_id = u.user_id
            JOIN users t ON s.trainer_id = t.user_id
            ORDER BY b.booking_date DESC
        `);
        return rows;
    }

    // Find booking by ID
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT 
                b.booking_id as id,
                b.booking_date,
                b.status,
                b.cancelled_at,
                b.session_id,
                b.user_id,
                s.session_name,
                s.session_date,
                s.session_time,
                s.duration,
                s.max_participants,
                a.name as activity_name,
                l.name as location_name,
                l.address as location_address,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                u.phone as user_phone,
                CONCAT(t.first_name, ' ', t.last_name) as trainer_name,
                t.email as trainer_email
            FROM bookings b
            JOIN sessions s ON b.session_id = s.session_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users u ON b.user_id = u.user_id
            JOIN users t ON s.trainer_id = t.user_id
            WHERE b.booking_id = ?
        `, [id]);
        return rows[0];
    }

    // Find bookings by user ID
    static async findByUserId(userId) {
        const [rows] = await db.query(`
            SELECT 
                b.booking_id as id,
                b.booking_date,
                b.status,
                b.cancelled_at,
                b.session_id,
                s.session_name,
                s.session_date,
                s.session_time,
                s.duration,
                a.name as activity_name,
                l.name as location_name,
                l.address as location_address,
                CONCAT(t.first_name, ' ', t.last_name) as trainer_name
            FROM bookings b
            JOIN sessions s ON b.session_id = s.session_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users t ON s.trainer_id = t.user_id
            WHERE b.user_id = ?
            ORDER BY s.session_date DESC, s.session_time DESC
        `, [userId]);
        return rows;
    }

    // Find bookings by session ID
    static async findBySessionId(sessionId) {
        const [rows] = await db.query(`
            SELECT 
                b.booking_id as id,
                b.booking_date,
                b.status,
                b.cancelled_at,
                b.user_id,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            WHERE b.session_id = ?
            ORDER BY b.booking_date ASC
        `, [sessionId]);
        return rows;
    }

    // Create new booking
    static async create({ session_id, user_id }) {
        const [result] = await db.query(
            'INSERT INTO bookings (session_id, user_id, status) VALUES (?, ?, ?)',
            [session_id, user_id, 'confirmed']
        );
        return result.insertId;
    }

    // Update booking status
    static async updateStatus(id, status) {
        const cancelled_at = status === 'cancelled' ? new Date() : null;
        const [result] = await db.query(
            'UPDATE bookings SET status = ?, cancelled_at = ? WHERE booking_id = ?',
            [status, cancelled_at, id]
        );
        return result.affectedRows;
    }

    // Delete booking
    static async delete(id) {
        const [result] = await db.query('DELETE FROM bookings WHERE booking_id = ?', [id]);
        return result.affectedRows;
    }

    // Check if booking exists
    static async exists(sessionId, userId) {
        const [rows] = await db.query(
            'SELECT booking_id FROM bookings WHERE session_id = ? AND user_id = ?',
            [sessionId, userId]
        );
        return rows.length > 0;
    }

    // Get booking count for session
    static async getSessionBookingCount(sessionId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM bookings WHERE session_id = ? AND status = "confirmed"',
            [sessionId]
        );
        return rows[0].count;
    }
}

module.exports = Booking;