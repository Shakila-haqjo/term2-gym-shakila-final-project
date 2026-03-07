// models/User.js

const db = require('../config/database');

class User {
    // Find all users
    static async findAll() {
        const [rows] = await db.query(`
            SELECT 
                user_id as id,
                email,
                first_name,
                last_name,
                phone,
                role,
                specialization,
                bio,
                profile_image,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
        `);
        return rows;
    }

    // Find user by ID (without password)
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT 
                user_id as id,
                email,
                first_name,
                last_name,
                phone,
                role,
                specialization,
                bio,
                profile_image,
                created_at,
                updated_at
            FROM users
            WHERE user_id = ?
        `, [id]);
        return rows[0];
    }

    // Find user by email (with password for authentication)
    static async findByEmail(email) {
        const [rows] = await db.query(`
            SELECT 
                user_id as id,
                email,
                password,
                first_name,
                last_name,
                phone,
                role,
                specialization,
                bio,
                profile_image,
                created_at,
                updated_at
            FROM users
            WHERE email = ?
        `, [email]);
        return rows[0];
    }

    // Find users by role
    static async findByRole(role) {
        const [rows] = await db.query(`
            SELECT 
                user_id as id,
                email,
                first_name,
                last_name,
                phone,
                role,
                specialization,
                bio,
                profile_image,
                created_at,
                updated_at
            FROM users
            WHERE role = ?
            ORDER BY created_at DESC
        `, [role]);
        return rows;
    }

    // Create new user
    static async create({ email, password, first_name, last_name, phone, role, specialization, bio, profile_image }) {
        const [result] = await db.query(
            `INSERT INTO users (email, password, first_name, last_name, phone, role, specialization, bio, profile_image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, password, first_name, last_name, phone || null, role || 'member', specialization || null, bio || null, profile_image || null]
        );
        return result.insertId;
    }

    // Update user
    static async update(id, { email, first_name, last_name, phone, role, specialization, bio, profile_image }) {
        const [result] = await db.query(
            `UPDATE users 
             SET email = ?, first_name = ?, last_name = ?, phone = ?, role = ?, specialization = ?, bio = ?, profile_image = ?
             WHERE user_id = ?`,
            [email, first_name, last_name, phone, role, specialization, bio, profile_image, id]
        );
        return result.affectedRows;
    }

    // Update password
    static async updatePassword(id, hashedPassword) {
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows;
    }

    // Delete user
    static async delete(id) {
        const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
        return result.affectedRows;
    }

    // Check if email exists
    static async emailExists(email) {
        const [rows] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );
        return rows.length > 0;
    }
}

module.exports = User;