// backend/models/Activity.js
// models/Activity.js

const db = require('../config/database');

class Activity {
    // Find all activities
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM activities ORDER BY name');
        return rows;
    }

    // Find activity by ID
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM activities WHERE id = ?', [id]);
        return rows[0];
    }

    // Create new activity
    static async create({ name, description, duration_minutes }) {
        const [result] = await db.query(
            'INSERT INTO activities (name, description, duration_minutes) VALUES (?, ?, ?)',
            [name, description, duration_minutes]
        );
        return result.insertId;
    }

    // Update activity
    static async update(id, { name, description, duration_minutes }) {
        const [result] = await db.query(
            'UPDATE activities SET name = ?, description = ?, duration_minutes = ? WHERE id = ?',
            [name, description, duration_minutes, id]
        );
        return result.affectedRows;
    }

    // Delete activity
    static async delete(id) {
        const [result] = await db.query('DELETE FROM activities WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = Activity;