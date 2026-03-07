// backend/models/Session.js
// models/Session.js

const db = require('../config/database');

class Session {
    // Find all sessions with related data
    static async findAll() {
        const [rows] = await db.query(`
            SELECT 
                s.session_id as id,
                s.session_name,
                s.session_date,
                s.session_time,
                s.duration,
                s.max_participants,
                s.description,
                s.created_at,
                s.trainer_id,
                s.activity_id,
                s.location_id,
                CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                a.name as activity_name,
                l.name as location_name,
                l.address as location_address,
                (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_participants
            FROM sessions s
            JOIN users u ON s.trainer_id = u.user_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            ORDER BY s.session_date DESC, s.session_time DESC
        `);
        return rows;
    }

    // Find session by ID
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT 
                s.session_id as id,
                s.session_name,
                s.session_date,
                s.session_time,
                s.duration,
                s.max_participants,
                s.description,
                s.created_at,
                s.trainer_id,
                s.activity_id,
                s.location_id,
                CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                u.email as trainer_email,
                a.name as activity_name,
                a.description as activity_description,
                l.name as location_name,
                l.address as location_address,
                (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_participants
            FROM sessions s
            JOIN users u ON s.trainer_id = u.user_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            WHERE s.session_id = ?
        `, [id]);
        return rows[0];
    }

    // Find sessions by trainer ID
    static async findByTrainerId(trainerId) {
        const [rows] = await db.query(`
            SELECT 
                s.session_id as id,
                s.session_name,
                s.session_date,
                s.session_time,
                s.duration,
                s.max_participants,
                s.description,
                s.created_at,
                s.trainer_id,
                s.activity_id,
                s.location_id,
                a.name as activity_name,
                l.name as location_name,
                l.address as location_address,
                (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_participants
            FROM sessions s
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            WHERE s.trainer_id = ?
            ORDER BY s.session_date DESC, s.session_time DESC
        `, [trainerId]);
        return rows;
    }

    // Find upcoming sessions
    static async findUpcoming() {
        const [rows] = await db.query(`
            SELECT 
                s.session_id as id,
                s.session_name,
                s.session_date,
                s.session_time,
                s.duration,
                s.max_participants,
                s.description,
                s.created_at,
                s.trainer_id,
                s.activity_id,
                s.location_id,
                CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                a.name as activity_name,
                l.name as location_name,
                l.address as location_address,
                (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_participants
            FROM sessions s
            JOIN users u ON s.trainer_id = u.user_id
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            WHERE s.session_date >= CURDATE()
            ORDER BY s.session_date ASC, s.session_time ASC
        `);
        return rows;
    }

    // Create new session
    static async create({ trainer_id, activity_id, location_id, session_name, session_date, session_time, duration, max_participants, description }) {
        const [result] = await db.query(
            `INSERT INTO sessions (trainer_id, activity_id, location_id, session_name, session_date, session_time, duration, max_participants, description) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [trainer_id, activity_id, location_id, session_name, session_date, session_time, duration, max_participants, description || null]
        );
        return result.insertId;
    }

    // Update session
    static async update(id, { activity_id, location_id, session_name, session_date, session_time, duration, max_participants, description }) {
        const [result] = await db.query(
            `UPDATE sessions 
             SET activity_id = ?, location_id = ?, session_name = ?, session_date = ?, session_time = ?, duration = ?, max_participants = ?, description = ?
             WHERE session_id = ?`,
            [activity_id, location_id, session_name, session_date, session_time, duration, max_participants, description, id]
        );
        return result.affectedRows;
    }

    // Delete session
    static async delete(id) {
        const [result] = await db.query('DELETE FROM sessions WHERE session_id = ?', [id]);
        return result.affectedRows;
    }

    // Get session participants
    static async getParticipants(sessionId) {
        const [rows] = await db.query(`
            SELECT 
                b.booking_id,
                b.booking_date,
                b.status,
                u.user_id as id,
                u.email,
                u.first_name,
                u.last_name,
                u.phone
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            WHERE b.session_id = ? AND b.status = 'confirmed'
            ORDER BY b.booking_date ASC
        `, [sessionId]);
        return rows;
    }
}

module.exports = Session;