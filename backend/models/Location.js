// backend/models/Location.js
// models/Location.js

const db = require('../config/database');

class Location {
    // Find all locations
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM locations ORDER BY name');
        return rows;
    }

    // Find location by ID
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM locations WHERE id = ?', [id]);
        return rows[0];
    }

    // Create new location
    static async create({ name, address }) {
        const [result] = await db.query(
            'INSERT INTO locations (name, address) VALUES (?, ?)',
            [name, address]
        );
        return result.insertId;
    }

    // Update location
    static async update(id, { name, address }) {
        const [result] = await db.query(
            'UPDATE locations SET name = ?, address = ? WHERE id = ?',
            [name, address, id]
        );
        return result.affectedRows;
    }

    // Delete location
    static async delete(id) {
        const [result] = await db.query('DELETE FROM locations WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = Location;