// backend/controllers/session/sessionController.js
const db = require('../../config/database');

// Get all sessions
exports.getAllSessions = async (req, res) => {
    try {
        const { activity, trainer, date } = req.query;

        let query = `
            SELECT s.*, 
                   a.name as activity_name,
                   l.name as location_name,
                   u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_bookings
            FROM sessions s
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users u ON s.trainer_id = u.user_id
            WHERE 1=1
        `;

        const params = [];

        if (activity) {
            query += ' AND s.activity_id = ?';
            params.push(activity);
        }

        if (trainer) {
            query += ' AND s.trainer_id = ?';
            params.push(trainer);
        }

        if (date) {
            query += ' AND s.session_date = ?';
            params.push(date);
        }

        query += ' ORDER BY s.session_date, s.session_time';

        const [sessions] = await db.query(query, params);

        res.json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions'
        });
    }
};

// Get session by ID
exports.getSessionById = async (req, res) => {
    try {
        const [sessions] = await db.query(`
            SELECT s.*, 
                   a.name as activity_name,
                   l.name as location_name,
                   u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_bookings
            FROM sessions s
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users u ON s.trainer_id = u.user_id
            WHERE s.session_id = ?
        `, [req.params.id]);

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            session: sessions[0]
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch session'
        });
    }
};

// Create new session (trainer/admin only)
exports.createSession = async (req, res) => {
    try {
        const { activityId, locationId, sessionName, sessionDate, sessionTime, duration, maxParticipants, description } = req.body;
        const trainerId = req.user.user_id;

        const [result] = await db.query(`
            INSERT INTO sessions (trainer_id, activity_id, location_id, session_name, session_date, session_time, duration, max_participants, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [trainerId, activityId, locationId, sessionName, sessionDate, sessionTime, duration, maxParticipants, description]);

        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            sessionId: result.insertId
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create session'
        });
    }
};

// Update session
exports.updateSession = async (req, res) => {
    try {
        const { activityId, locationId, sessionName, sessionDate, sessionTime, duration, maxParticipants, description } = req.body;

        await db.query(`
            UPDATE sessions 
            SET activity_id = ?, location_id = ?, session_name = ?, session_date = ?, session_time = ?, duration = ?, max_participants = ?, description = ?
            WHERE session_id = ? AND trainer_id = ?
        `, [activityId, locationId, sessionName, sessionDate, sessionTime, duration, maxParticipants, description, req.params.id, req.user.user_id]);

        res.json({
            success: true,
            message: 'Session updated successfully'
        });
    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update session'
        });
    }
};

// Delete session
exports.deleteSession = async (req, res) => {
    try {
        await db.query(
            'DELETE FROM sessions WHERE session_id = ? AND trainer_id = ?',
            [req.params.id, req.user.user_id]
        );

        res.json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete session'
        });
    }
};

// Get trainer's sessions
exports.getTrainerSessions = async (req, res) => {
    try {
        const [sessions] = await db.query(`
            SELECT s.*, 
                   a.name as activity_name,
                   l.name as location_name,
                   (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_bookings
            FROM sessions s
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            WHERE s.trainer_id = ?
            ORDER BY s.session_date DESC, s.session_time
        `, [req.user.user_id]);

        res.json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Get trainer sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions'
        });
    }
};

// Get sessions by trainer ID (for viewing specific trainer's sessions)
exports.getTrainerSessionsById = async (req, res) => {
    try {
        const [sessions] = await db.query(`
            SELECT s.*, 
                   a.name as activity_name,
                   l.name as location_name,
                   u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM bookings WHERE session_id = s.session_id AND status = 'confirmed') as current_participants
            FROM sessions s
            JOIN activities a ON s.activity_id = a.activity_id
            JOIN locations l ON s.location_id = l.location_id
            JOIN users u ON s.trainer_id = u.user_id
            WHERE s.trainer_id = ?
            ORDER BY s.session_date DESC, s.session_time
        `, [req.params.trainerId]);

        res.json(sessions);
    } catch (error) {
        console.error('Get trainer sessions by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions'
        });
    }
};