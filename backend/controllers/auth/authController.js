// backend/controllers/auth/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

// Register new user
exports.register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, role } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, phone, role || 'member']
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt for email:', email);

        // Get user from database
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];
        console.log('👤 User found:', { email: user.email, role: user.role, user_id: user.user_id });

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Return user data (excluding password)
        const { password: _, ...userData } = user;
        
        console.log('✅ Login successful for:', email);
        console.log('📦 Returning user data:', { ...userData, password: '[HIDDEN]' });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, email, first_name, last_name, phone, role, specialization, bio, profile_image FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
};