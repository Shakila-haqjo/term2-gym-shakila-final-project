-- =============================================================================
-- database.sql
-- Gym Fitness DB (gym_fitness_db_shakila) - Full Schema + Seed Data + Queries
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DATABASE
-- -----------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS gym_fitness_db_shakila;
USE gym_fitness_db_shakila;


-- -----------------------------------------------------------------------------
-- 2. DROP EXISTING TABLES (in dependency order)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;


-- -----------------------------------------------------------------------------
-- 3. SCHEMA
-- database.js reads statements between [SCHEMA:START] and [SCHEMA:END]
-- to initialize tables on startup (safe for re-runs).
-- -----------------------------------------------------------------------------

-- [SCHEMA:START]

CREATE TABLE IF NOT EXISTS users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    address       TEXT,
    avatar        VARCHAR(255),
    role          ENUM('member', 'trainer', 'admin') DEFAULT 'member',
    status        ENUM('active', 'inactive') DEFAULT 'active',
    created_at    DATETIME DEFAULT NOW(),
    INDEX idx_email (email),
    INDEX idx_role  (role),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS activities (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      ENUM('active', 'inactive') DEFAULT 'active',
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS locations (
    id       INT PRIMARY KEY AUTO_INCREMENT,
    name     VARCHAR(255) NOT NULL,
    address  TEXT,
    capacity INT DEFAULT 20,
    status   ENUM('active', 'inactive') DEFAULT 'active',
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS sessions (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    name             VARCHAR(255) NOT NULL,
    activity_id      INT NOT NULL,
    location_id      INT NOT NULL,
    trainer_id       INT NOT NULL,
    date             DATE NOT NULL,
    time             TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    max_participants INT DEFAULT 20,
    description      TEXT,
    created_at       DATETIME DEFAULT NOW(),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id)  ON DELETE CASCADE,
    FOREIGN KEY (trainer_id)  REFERENCES users(id)      ON DELETE CASCADE,
    INDEX idx_trainer (trainer_id),
    INDEX idx_date    (date)
);

CREATE TABLE IF NOT EXISTS bookings (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL,
    session_id INT NOT NULL,
    status     ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking (user_id, session_id),
    INDEX idx_user    (user_id),
    INDEX idx_session (session_id),
    INDEX idx_status  (status)
);

CREATE TABLE IF NOT EXISTS blogs (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    title          VARCHAR(255) NOT NULL,
    author_id      INT NOT NULL,
    category       VARCHAR(100),
    content        LONGTEXT,
    featured_image VARCHAR(255),
    status         ENUM('published', 'draft') DEFAULT 'draft',
    views          INT DEFAULT 0,
    created_at     DATETIME DEFAULT NOW(),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_author   (author_id),
    INDEX idx_status   (status),
    INDEX idx_category (category)
);


-- [SCHEMA:END]


-- -----------------------------------------------------------------------------
-- 4. SEED DATA
-- -----------------------------------------------------------------------------

-- Users (passwords are bcrypt hashes of the plaintext shown in comments)
-- All sample passwords: admin123 / trainer123 / member123
INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES
('Admin User',    'admin@gym.com',   '$2b$10$hash_admin_placeholder',   '+1000000001', '1 Admin St',   'admin',   'active'),
('Sarah Johnson', 'sarah@gym.com',   '$2b$10$hash_sarah_placeholder',   '+1000000002', '2 Trainer Ave', 'trainer', 'active'),
('Mike Williams', 'mike@gym.com',    '$2b$10$hash_mike_placeholder',    '+1000000003', '3 Fitness Rd',  'trainer', 'active'),
('Alice Brown',   'alice@gym.com',   '$2b$10$hash_alice_placeholder',   '+1000000004', '4 Member Ln',   'member',  'active'),
('Bob Davis',     'bob@gym.com',     '$2b$10$hash_bob_placeholder',     '+1000000005', '5 Member Ln',   'member',  'active'),
('Carol Wilson',  'carol@gym.com',   '$2b$10$hash_carol_placeholder',   '+1000000006', '6 Member Ln',   'member',  'active');

-- Activities
INSERT INTO activities (name, description, status) VALUES
('Yoga',              'Mindful stretching and breathing exercises',    'active'),
('CrossFit',          'High-intensity functional fitness training',     'active'),
('Spinning',          'Indoor cycling cardio sessions',                 'active'),
('Boxing',            'Cardio boxing and technique training',           'active'),
('Pilates',           'Core strengthening and flexibility training',    'active'),
('Zumba',             'Dance-based cardio fitness',                     'active'),
('Strength Training', 'Weight and resistance training sessions',        'active');

-- Locations
INSERT INTO locations (name, address, capacity, status) VALUES
('Main Studio',   '1 Gym St, Room A',     30, 'active'),
('Fitness Hall',  '1 Gym St, Hall B',     50, 'active'),
('Spin Room',     '1 Gym St, Room C',     20, 'active'),
('Boxing Ring',   '1 Gym St, Room D',     15, 'active'),
('Yoga Studio',   '1 Gym St, Room E',     25, 'active'),
('Outdoor Court', '1 Gym St, Outdoor',    40, 'active');

-- Sessions
INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) VALUES
('Morning Yoga Flow',      1, 5, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY),  '07:00:00', 60, 20, 'Start your day with a calming yoga session'),
('CrossFit Blast',         2, 2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY),  '09:00:00', 45, 15, 'High-intensity CrossFit workout'),
('Spin & Burn',            3, 3, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY),  '06:30:00', 45, 18, 'Intense indoor cycling session'),
('Boxing Fundamentals',    4, 4, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY),  '18:00:00', 60, 12, 'Learn boxing basics and cardio'),
('Core Pilates',           5, 1, 2, DATE_ADD(CURDATE(), INTERVAL 3 DAY),  '10:00:00', 50, 15, 'Strengthen your core with Pilates'),
('Zumba Party',            6, 2, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY),  '17:00:00', 60, 25, 'Fun dance-based cardio workout'),
('Strength & Conditioning',7, 2, 2, DATE_ADD(CURDATE(), INTERVAL 4 DAY),  '08:00:00', 75, 10, 'Build muscle and improve conditioning'),
('Evening Yoga',           1, 5, 3, DATE_ADD(CURDATE(), INTERVAL 4 DAY),  '19:00:00', 60, 20, 'Unwind with an evening yoga class');

-- Bookings (user_id 4=alice, 5=bob, 6=carol; session_id 1-8)
INSERT INTO bookings (user_id, session_id, status) VALUES
(4, 1, 'confirmed'),
(4, 2, 'confirmed'),
(5, 1, 'confirmed'),
(5, 3, 'confirmed'),
(5, 5, 'cancelled'),
(6, 2, 'confirmed'),
(6, 4, 'confirmed'),
(6, 6, 'confirmed'),
(4, 7, 'completed'),
(5, 8, 'completed');

-- Blogs
INSERT INTO blogs (title, author_id, category, content, status, views) VALUES
('5 Benefits of Morning Yoga',       2, 'Wellness',  'Starting your day with yoga improves focus, flexibility and mental clarity...',  'published', 142),
('CrossFit for Beginners',           3, 'Training',  'CrossFit can seem intimidating but here is how to get started safely...',         'published',  98),
('Nutrition Tips for Gym-Goers',     2, 'Nutrition', 'Fueling your body correctly before and after a workout is essential...',          'published', 210),
('Why Strength Training Matters',    3, 'Training',  'Many people skip weights but resistance training has life-changing benefits...', 'draft',       12);


-- =============================================================================
-- 5. QUERY REFERENCE
-- All queries used by the API, grouped by route file.
-- These are NOT executed here — they serve as documentation / reference.
-- =============================================================================


-- ------------------------------------
-- AUTH ROUTES  (routes/auth.js)
-- ------------------------------------

-- POST /api/auth/login — find user by email
-- SELECT * FROM users WHERE email = ?;

-- POST /api/auth/register — check email uniqueness
-- SELECT id FROM users WHERE email = ?;

-- POST /api/auth/register — create user
-- INSERT INTO users (name, email, password_hash, phone, address, role, status)
-- VALUES (?, ?, ?, ?, ?, ?, ?);

-- POST /api/auth/register — return new user
-- SELECT id, name, email, role, avatar, phone, address FROM users WHERE id = ?;

-- GET /api/auth/me — fetch authenticated user (also used in auth middleware)
-- SELECT id, name, email, role, status, avatar, phone, address FROM users WHERE id = ?;

-- PUT /api/auth/me — update own profile
-- UPDATE users SET name=?, phone=?, address=? [, password_hash=?] WHERE id = ?;

-- PUT /api/auth/me — return updated profile
-- SELECT id, name, email, role, avatar, phone, address FROM users WHERE id = ?;


-- ------------------------------------
-- USER ROUTES  (routes/users.js)
-- ------------------------------------

-- GET /api/users — list all users (admin) with optional filters
-- SELECT id, name, email, phone, address, role, status, avatar, created_at
-- FROM users
-- WHERE 1=1
--   [AND (name LIKE ? OR email LIKE ?)]
--   [AND role = ?]
--   [AND status = ?]
-- ORDER BY created_at DESC;

-- GET /api/users/stats — dashboard stats
-- SELECT COUNT(*) as total                    FROM users;
-- SELECT COUNT(*) as members                  FROM users WHERE role = 'member';
-- SELECT COUNT(*) as trainers                 FROM users WHERE role = 'trainer';
-- SELECT COUNT(*) as active                   FROM users WHERE status = 'active';

-- GET /api/users/:id — single user
-- SELECT id, name, email, phone, address, role, status, avatar, created_at
-- FROM users WHERE id = ?;

-- POST /api/users — create user (admin)
-- SELECT id FROM users WHERE email = ?;
-- INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?);
-- SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?;

-- PUT /api/users/:id — update user (admin)
-- SELECT * FROM users WHERE id = ?;
-- SELECT id FROM users WHERE email = ? AND id != ?;
-- UPDATE users SET name=?, email=?, phone=?, address=?, role=?, status=? [, password_hash=?] WHERE id = ?;
-- SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?;

-- DELETE /api/users/:id — soft-delete user (set inactive)
-- SELECT id FROM users WHERE id = ?;
-- UPDATE users SET status = 'inactive' WHERE id = ?;


-- ------------------------------------
-- SESSION ROUTES  (routes/sessions.js)
-- ------------------------------------

-- Reusable join used across most session endpoints:
-- SELECT s.*,
--   a.name AS activity_name,
--   l.name AS location_name, l.address AS location_address,
--   u.name AS trainer_name,
--   (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'confirmed') AS booked_count
-- FROM sessions s
-- LEFT JOIN activities a ON a.id = s.activity_id
-- LEFT JOIN locations  l ON l.id = s.location_id
-- LEFT JOIN users      u ON u.id = s.trainer_id

-- GET /api/sessions — list sessions with optional filters
-- [above join] WHERE 1=1
--   [AND s.trainer_id = ?]                         -- trainer sees only their sessions
--   [AND (s.name LIKE ? OR a.name LIKE ?)]          -- search param
--   [AND s.activity_id = ?]
--   [AND s.date = ?]
--   [AND s.date >= CURDATE()]                       -- upcoming=true
-- ORDER BY s.date ASC, s.time ASC;

-- GET /api/sessions/stats
-- SELECT COUNT(*) as total    FROM sessions [WHERE trainer_id = ?];
-- SELECT COUNT(*) as upcoming FROM sessions WHERE [trainer_id = ? AND] date >= CURDATE();
-- SELECT COUNT(*) as totalBookings FROM bookings b
--   JOIN sessions s ON s.id = b.session_id
--   WHERE [s.trainer_id = ? AND] b.status = 'confirmed';

-- GET /api/sessions/:id
-- [above join] WHERE s.id = ?;

-- POST /api/sessions — create session
-- INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description)
-- VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
-- [above join] WHERE s.id = ?;

-- PUT /api/sessions/:id
-- SELECT * FROM sessions WHERE id = ?;
-- UPDATE sessions SET name=?, activity_id=?, location_id=?, trainer_id=?, date=?, time=?, duration_minutes=?, max_participants=?, description=? WHERE id = ?;
-- [above join] WHERE s.id = ?;

-- DELETE /api/sessions/:id
-- SELECT * FROM sessions WHERE id = ?;
-- DELETE FROM bookings WHERE session_id = ?;
-- DELETE FROM sessions WHERE id = ?;

-- GET /api/sessions/:id/bookings
-- SELECT * FROM sessions WHERE id = ?;
-- SELECT b.*, u.name AS member_name, u.email AS member_email, u.phone AS member_phone
-- FROM bookings b
-- JOIN users u ON u.id = b.user_id
-- WHERE b.session_id = ?
-- ORDER BY b.created_at DESC;


-- ------------------------------------
-- BOOKING ROUTES  (routes/bookings.js)
-- ------------------------------------

-- Reusable join used across most booking endpoints:
-- SELECT b.*,
--   u.name AS member_name, u.email AS member_email,
--   s.name AS session_name, s.date AS session_date, s.time AS session_time,
--   s.duration_minutes, s.trainer_id,
--   a.name AS activity_name,
--   l.name AS location_name,
--   t.name AS trainer_name
-- FROM bookings b
-- JOIN users    u ON u.id = b.user_id
-- JOIN sessions s ON s.id = b.session_id
-- LEFT JOIN activities a ON a.id = s.activity_id
-- LEFT JOIN locations  l ON l.id = s.location_id
-- LEFT JOIN users      t ON t.id = s.trainer_id

-- GET /api/bookings/stats (admin only)
-- SELECT COUNT(*) as total     FROM bookings;
-- SELECT COUNT(*) as confirmed FROM bookings WHERE status = 'confirmed';
-- SELECT COUNT(*) as cancelled FROM bookings WHERE status = 'cancelled';
-- SELECT COUNT(*) as completed FROM bookings WHERE status = 'completed';
-- SELECT DATE(created_at) as day, COUNT(*) as cnt
-- FROM bookings
-- WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
-- GROUP BY day ORDER BY day;

-- GET /api/bookings — list bookings with optional filters
-- [above join] WHERE 1=1
--   [AND b.user_id = ?]              -- member sees only their bookings
--   [AND s.trainer_id = ?]           -- trainer sees bookings for their sessions
--   [AND b.status = ?]
--   [AND s.date >= CURDATE()]        -- upcoming=true
--   [AND s.date < CURDATE()]         -- past=true
-- ORDER BY s.date DESC, s.time DESC;

-- POST /api/bookings — create booking (member only)
-- SELECT * FROM sessions WHERE id = ?;
-- SELECT COUNT(*) as booked FROM bookings WHERE session_id = ? AND status = 'confirmed';
-- SELECT * FROM bookings WHERE user_id = ? AND session_id = ?;
-- UPDATE bookings SET status = 'confirmed', created_at = NOW() WHERE id = ?;   -- reactivate cancelled
-- INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?);
-- [above join] WHERE b.id = ?;

-- PUT /api/bookings/:id/cancel
-- SELECT * FROM bookings WHERE id = ?;
-- UPDATE bookings SET status = 'cancelled' WHERE id = ?;

-- DELETE /api/bookings/:id (admin only)
-- SELECT id FROM bookings WHERE id = ?;
-- DELETE FROM bookings WHERE id = ?;


-- ------------------------------------
-- BLOG ROUTES  (routes/blogs.js)
-- ------------------------------------

-- Reusable join:
-- SELECT b.*, u.name AS author_name, u.avatar AS author_avatar
-- FROM blogs b
-- JOIN users u ON u.id = b.author_id

-- GET /api/blogs — list blogs with visibility filters
-- [above join] WHERE 1=1
--   [AND b.status = 'published']                            -- unauthenticated
--   [AND (b.status = 'published' OR b.author_id = ?)]      -- member/trainer
--   [AND b.status = ?]                                      -- admin with status param
--   [AND (b.title LIKE ? OR b.category LIKE ?)]
--   [AND b.category = ?]
-- ORDER BY b.created_at DESC;

-- GET /api/blogs/:id
-- [above join] WHERE b.id = ?;

-- POST /api/blogs — create blog
-- INSERT INTO blogs (title, author_id, category, content, featured_image, status) VALUES (?, ?, ?, ?, ?, ?);
-- [above join] WHERE b.id = ?;

-- PUT /api/blogs/:id
-- SELECT * FROM blogs WHERE id = ?;
-- UPDATE blogs SET title=?, category=?, content=?, featured_image=?, status=? WHERE id = ?;
-- [above join] WHERE b.id = ?;

-- DELETE /api/blogs/:id
-- SELECT * FROM blogs WHERE id = ?;
-- DELETE FROM blogs WHERE id = ?;

-- POST /api/blogs/:id/view — increment view counter
-- UPDATE blogs SET views = views + 1 WHERE id = ?;


-- ------------------------------------
-- ACTIVITY ROUTES  (routes/activities.js)
-- ------------------------------------

-- GET /api/activities
-- SELECT * FROM activities [WHERE status = 'active'] ORDER BY name ASC;

-- POST /api/activities (admin)
-- INSERT INTO activities (name, description, status) VALUES (?, ?, ?);
-- SELECT * FROM activities WHERE id = ?;

-- PUT /api/activities/:id (admin)
-- SELECT * FROM activities WHERE id = ?;
-- UPDATE activities SET name=?, description=?, status=? WHERE id = ?;
-- SELECT * FROM activities WHERE id = ?;

-- DELETE /api/activities/:id (admin) — deactivate if in use, delete if not
-- SELECT * FROM activities WHERE id = ?;
-- SELECT COUNT(*) as used FROM sessions WHERE activity_id = ?;
-- UPDATE activities SET status = 'inactive' WHERE id = ?;   -- if used
-- DELETE FROM activities WHERE id = ?;                       -- if not used


-- ------------------------------------
-- LOCATION ROUTES  (routes/locations.js)
-- ------------------------------------

-- GET /api/locations
-- SELECT * FROM locations [WHERE status = 'active'] ORDER BY name ASC;

-- POST /api/locations (admin)
-- INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?);
-- SELECT * FROM locations WHERE id = ?;

-- PUT /api/locations/:id (admin)
-- SELECT * FROM locations WHERE id = ?;
-- UPDATE locations SET name=?, address=?, capacity=?, status=? WHERE id = ?;
-- SELECT * FROM locations WHERE id = ?;

-- DELETE /api/locations/:id (admin) — deactivate if in use, delete if not
-- SELECT * FROM locations WHERE id = ?;
-- SELECT COUNT(*) as used FROM sessions WHERE location_id = ?;
-- UPDATE locations SET status = 'inactive' WHERE id = ?;   -- if used
-- DELETE FROM locations WHERE id = ?;                       -- if not used


-- ------------------------------------
-- AUTH MIDDLEWARE  (middleware/auth.js)
-- ------------------------------------

-- Verify JWT token — fetch user on every protected request
-- SELECT id, name, email, role, status, avatar, phone, address FROM users WHERE id = ?;


-- =============================================================================
-- END OF FILE
-- =============================================================================
