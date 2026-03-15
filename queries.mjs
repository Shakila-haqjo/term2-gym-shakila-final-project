// queries.mjs
// Single source of truth for all SQL queries used by the application.
// Controllers import from here instead of writing inline SQL.

// =============================================================================
// REUSABLE JOIN BASES  (appended with WHERE clauses at runtime)
// =============================================================================

const SESSION_SELECT = `
  SELECT s.*,
    a.name as activity_name,
    l.name as location_name, l.address as location_address,
    u.name as trainer_name,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'confirmed') as booked_count
  FROM sessions s
  LEFT JOIN activities a ON a.id = s.activity_id
  LEFT JOIN locations  l ON l.id = s.location_id
  LEFT JOIN users      u ON u.id = s.trainer_id`;

const BOOKING_SELECT = `
  SELECT b.*,
    u.name as member_name, u.email as member_email,
    s.name as session_name, s.date as session_date, s.time as session_time,
    s.duration_minutes, s.trainer_id,
    a.name as activity_name,
    l.name as location_name,
    t.name as trainer_name
  FROM bookings b
  JOIN users    u ON u.id = b.user_id
  JOIN sessions s ON s.id = b.session_id
  LEFT JOIN activities a ON a.id = s.activity_id
  LEFT JOIN locations  l ON l.id = s.location_id
  LEFT JOIN users      t ON t.id = s.trainer_id`;

const BLOG_SELECT = `
  SELECT b.*, u.name as author_name, u.avatar as author_avatar
  FROM blogs b
  JOIN users u ON u.id = b.author_id`;

// =============================================================================
// AUTH  (controllers/auth.mjs + middleware/auth.mjs)
// =============================================================================

export const AUTH = {
  FIND_BY_EMAIL:    'SELECT * FROM users WHERE email = ?',
  CHECK_EMAIL:      'SELECT id FROM users WHERE email = ?',
  INSERT_USER:      'INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
  GET_PROFILE:      'SELECT id, name, email, role, avatar, phone, address FROM users WHERE id = ?',
  GET_FULL_PROFILE: 'SELECT id, name, email, role, status, avatar, phone, address FROM users WHERE id = ?',
};

// =============================================================================
// USERS  (controllers/users.mjs)
// =============================================================================

export const USERS = {
  LIST_BASE:            'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE 1=1',
  STATS_TOTAL:          'SELECT COUNT(*) as total FROM users',
  STATS_MEMBERS:        "SELECT COUNT(*) as members FROM users WHERE role = 'member'",
  STATS_TRAINERS:       "SELECT COUNT(*) as trainers FROM users WHERE role = 'trainer'",
  STATS_ACTIVE:         "SELECT COUNT(*) as active FROM users WHERE status = 'active'",
  GET_BY_ID:            'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?',
  GET_ALL_BY_ID:        'SELECT * FROM users WHERE id = ?',
  CHECK_EMAIL:          'SELECT id FROM users WHERE email = ?',
  CHECK_EMAIL_CONFLICT: 'SELECT id FROM users WHERE email = ? AND id != ?',
  CHECK_ID:             'SELECT id FROM users WHERE id = ?',
  INSERT:               'INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
  SOFT_DELETE:          "UPDATE users SET status = 'inactive' WHERE id = ?",
};

// =============================================================================
// SESSIONS  (controllers/sessions.mjs)
// =============================================================================

export const SESSIONS = {
  SELECT:                  SESSION_SELECT,
  LIST_BASE:               SESSION_SELECT + ' WHERE 1=1',
  GET_BY_ID:               SESSION_SELECT + ' WHERE s.id = ?',
  GET_RAW:                 'SELECT * FROM sessions WHERE id = ?',
  INSERT:                  'INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  DELETE_BOOKINGS:         'DELETE FROM bookings WHERE session_id = ?',
  DELETE:                  'DELETE FROM sessions WHERE id = ?',
  STATS_TOTAL:             'SELECT COUNT(*) as total FROM sessions',
  STATS_TOTAL_TRAINER:     'SELECT COUNT(*) as total FROM sessions WHERE trainer_id = ?',
  STATS_UPCOMING:          'SELECT COUNT(*) as upcoming FROM sessions WHERE date >= CURDATE()',
  STATS_UPCOMING_TRAINER:  'SELECT COUNT(*) as upcoming FROM sessions WHERE trainer_id = ? AND date >= CURDATE()',
  STATS_BOOKINGS:          "SELECT COUNT(*) as totalBookings FROM bookings WHERE status = 'confirmed'",
  STATS_BOOKINGS_TRAINER:  `SELECT COUNT(*) as totalBookings FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    WHERE s.trainer_id = ? AND b.status = 'confirmed'`,
  BOOKINGS_LIST:           `SELECT b.*, u.name as member_name, u.email as member_email, u.phone as member_phone
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    WHERE b.session_id = ?
    ORDER BY b.created_at DESC`,
};

// =============================================================================
// BOOKINGS  (controllers/bookings.mjs)
// =============================================================================

export const BOOKINGS = {
  SELECT:          BOOKING_SELECT,
  LIST_BASE:       BOOKING_SELECT + ' WHERE 1=1',
  GET_BY_ID:       BOOKING_SELECT + ' WHERE b.id = ?',
  GET_RAW:         'SELECT * FROM bookings WHERE id = ?',
  CHECK_ID:        'SELECT id FROM bookings WHERE id = ?',
  CHECK_CAPACITY:  "SELECT COUNT(*) as booked FROM bookings WHERE session_id = ? AND status = 'confirmed'",
  CHECK_EXISTING:  'SELECT * FROM bookings WHERE user_id = ? AND session_id = ?',
  INSERT:          "INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?)",
  REACTIVATE:      "UPDATE bookings SET status = 'confirmed', created_at = NOW() WHERE id = ?",
  CANCEL:          "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
  DELETE:          'DELETE FROM bookings WHERE id = ?',
  STATS_TOTAL:     'SELECT COUNT(*) as total FROM bookings',
  STATS_CONFIRMED: "SELECT COUNT(*) as confirmed FROM bookings WHERE status = 'confirmed'",
  STATS_CANCELLED: "SELECT COUNT(*) as cancelled FROM bookings WHERE status = 'cancelled'",
  STATS_COMPLETED: "SELECT COUNT(*) as completed FROM bookings WHERE status = 'completed'",
  STATS_TREND:     `SELECT DATE(created_at) as day, COUNT(*) as cnt
    FROM bookings
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY day
    ORDER BY day`,
};

// =============================================================================
// BLOGS  (controllers/blogs.mjs)
// =============================================================================

export const BLOGS = {
  SELECT:          BLOG_SELECT,
  LIST_BASE:       BLOG_SELECT + ' WHERE 1=1',
  GET_BY_ID:       BLOG_SELECT + ' WHERE b.id = ?',
  GET_RAW:         'SELECT * FROM blogs WHERE id = ?',
  GET_AUTHOR_ROLE: 'SELECT role FROM users WHERE id = ?',
  INSERT:          'INSERT INTO blogs (title, author_id, category, content, featured_image, status) VALUES (?, ?, ?, ?, ?, ?)',
  DELETE:          'DELETE FROM blogs WHERE id = ?',
  INCREMENT_VIEWS: 'UPDATE blogs SET views = views + 1 WHERE id = ?',
};

// =============================================================================
// ACTIVITIES  (controllers/activities.mjs)
// =============================================================================

export const ACTIVITIES = {
  LIST_ALL:     'SELECT * FROM activities ORDER BY name ASC',
  LIST_ACTIVE:  "SELECT * FROM activities WHERE status = 'active' ORDER BY name ASC",
  GET_BY_ID:    'SELECT * FROM activities WHERE id = ?',
  INSERT:       'INSERT INTO activities (name, description, status) VALUES (?, ?, ?)',
  CHECK_IN_USE: 'SELECT COUNT(*) as used FROM sessions WHERE activity_id = ?',
  DEACTIVATE:   "UPDATE activities SET status = 'inactive' WHERE id = ?",
  DELETE:       'DELETE FROM activities WHERE id = ?',
};

// =============================================================================
// LOCATIONS  (controllers/locations.mjs)
// =============================================================================

export const LOCATIONS = {
  LIST_ALL:     'SELECT * FROM locations ORDER BY name ASC',
  LIST_ACTIVE:  "SELECT * FROM locations WHERE status = 'active' ORDER BY name ASC",
  GET_BY_ID:    'SELECT * FROM locations WHERE id = ?',
  INSERT:       'INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)',
  CHECK_IN_USE: 'SELECT COUNT(*) as used FROM sessions WHERE location_id = ?',
  DEACTIVATE:   "UPDATE locations SET status = 'inactive' WHERE id = ?",
  DELETE:       'DELETE FROM locations WHERE id = ?',
};
