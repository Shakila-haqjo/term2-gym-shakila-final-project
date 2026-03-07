// backend/models/Blog.js
// models/Blog.js

const db = require('../config/database');

class Blog {
    // Find all blogs with author details
    static async findAll() {
        const [rows] = await db.query(`
            SELECT 
                b.id,
                b.title,
                b.content,
                b.image,
                b.created_at,
                b.user_id,
                u.firstname,
                u.lastname,
                u.email
            FROM blogs b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
        `);
        return rows;
    }

    // Find blog by ID with author details
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT 
                b.id,
                b.title,
                b.content,
                b.image,
                b.created_at,
                b.user_id,
                u.firstname,
                u.lastname,
                u.email
            FROM blogs b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [id]);
        return rows[0];
    }

    // Find blogs by user ID
    static async findByUserId(userId) {
        const [rows] = await db.query(`
            SELECT 
                b.id,
                b.title,
                b.content,
                b.image,
                b.created_at,
                b.user_id,
                u.firstname,
                u.lastname,
                u.email
            FROM blogs b
            JOIN users u ON b.user_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [userId]);
        return rows;
    }

    // Create new blog
    static async create({ user_id, title, content, image }) {
        const [result] = await db.query(
            'INSERT INTO blogs (user_id, title, content, image) VALUES (?, ?, ?, ?)',
            [user_id, title, content, image]
        );
        return result.insertId;
    }

    // Update blog
    static async update(id, { title, content, image }) {
        const [result] = await db.query(
            'UPDATE blogs SET title = ?, content = ?, image = ? WHERE id = ?',
            [title, content, image, id]
        );
        return result.affectedRows;
    }

    // Delete blog
    static async delete(id) {
        const [result] = await db.query('DELETE FROM blogs WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = Blog;