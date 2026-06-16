import { DatabaseModel } from './DatabaseModel.mjs';

const SESSION_SELECT = `
  SELECT s.*,
    a.name AS activity_name,
    l.name AS location_name, l.address AS location_address,
    u.name AS trainer_name,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'confirmed') AS booked_count
  FROM sessions s
  LEFT JOIN activities a ON a.id = s.activity_id
  LEFT JOIN locations  l ON l.id = s.location_id
  LEFT JOIN users      u ON u.id = s.trainer_id`;
/**
 * SessionModel
 *
 * Handles all database operations related to gym sessions.
 *
 * Provides methods to:
 * - Retrieve sessions with filtering (trainer, date, activity, search)
 * - Get session details with joined information (activity, trainer, location)
 * - Create, update, and delete sessions
 * - Track bookings and statistics
 *
 * Includes JOIN queries to enrich session data with:
 * - Activity name
 * - Location details
 * - Trainer information
 * - Booking count
 *
 * @class SessionModel
 * @extends DatabaseModel
 */

export class SessionModel extends DatabaseModel {

  /**
 * Retrieves a list of sessions with optional filters.
 *
 * @async
 * @param {Object} [filters={}] - Filter options
 * @param {number} [filters.trainerId] - Filter by trainer ID
 * @param {string} [filters.search] - Search by session or activity name
 * @param {number} [filters.activity_id] - Filter by activity ID
 * @param {string} [filters.date] - Filter by specific date (YYYY-MM-DD)
 * @param {boolean} [filters.upcoming] - Only include upcoming sessions
 * @returns {Promise<Array<Object>>} List of session records
 */

  static async listSessions({ trainerId, search, activity_id, date, upcoming } = {}) {
    let sql = SESSION_SELECT + ' WHERE 1=1';
    const params = [];
    if (trainerId)   { sql += ' AND s.trainer_id = ?';                params.push(trainerId); }
    if (search)      { sql += ' AND (s.name LIKE ? OR a.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (activity_id) { sql += ' AND s.activity_id = ?';               params.push(activity_id); }
    if (date)        { sql += ' AND s.date = ?';                      params.push(date); }
    if (upcoming)    { sql += ' AND s.date >= CURDATE()'; }
    sql += ' ORDER BY s.date ASC, s.time ASC';
    return await this.query(sql, params);
  }
/**
 * Finds a session by ID with full joined details.
 *
 * @async
 * @param {number} id - Session ID
 * @returns {Promise<Object|undefined>} Session object with related data
 */

  static async findById(id) {
    const rows = await this.query(SESSION_SELECT + ' WHERE s.id = ?', [id]);
    return rows[0];
  }
/**
 * Finds a session by ID without joins (raw database record).
 *
 * @async
 * @param {number} id - Session ID
 * @returns {Promise<Object|undefined>} Raw session object
 */

  static async findRawById(id) {
    const rows = await this.query('SELECT * FROM sessions WHERE id = ?', [id]);
    return rows[0];
  }
/**
 * Creates a new session.
 *
 * @async
 * @param {string} name - Session name
 * @param {number|null} activity_id - Associated activity ID
 * @param {number|null} location_id - Location ID
 * @param {number|null} trainer_id - Trainer (user) ID
 * @param {string} date - Session date (YYYY-MM-DD)
 * @param {string} time - Session time (HH:MM)
 * @param {number} duration_minutes - Duration in minutes
 * @param {number} max_participants - Maximum participants allowed
 * @param {string|null} description - Session description
 * @returns {Promise<number>} ID of the created session
 */

  static async createSession(name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) {
    const result = await this.query(
      'INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description]
    );
    return result.insertId;
  }
/**
 * Updates an existing session with provided fields.
 *
 * Only updates allowed fields:
 * - name, activity_id, location_id, trainer_id
 * - date, time, duration_minutes, max_participants, description
 *
 * @async
 * @param {number} id - Session ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */

  static async updateSession(id, fields) {
    const updates = [];
    const params  = [];
    const allowed = ['name', 'activity_id', 'location_id', 'trainer_id', 'date', 'time', 'duration_minutes', 'max_participants', 'description'];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
    }
    if (updates.length === 0) return;
    params.push(id);
    await this.query(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`, params);
  }
/**
 * Deletes a session and its related bookings.
 *
 * Ensures referential integrity by:
 * 1. Deleting bookings linked to the session
 * 2. Deleting the session itself
 *
 * @async
 * @param {number} id - Session ID
 * @returns {Promise<void>}
 */

  static async deleteSession(id) {
    await this.query('DELETE FROM bookings WHERE session_id = ?', [id]);
    await this.query('DELETE FROM sessions WHERE id = ?', [id]);
  }
/**
 * Retrieves session statistics.
 *
 * If trainerId is provided:
 * - Returns stats only for that trainer
 *
 * Otherwise:
 * - Returns global session statistics
 *
 * @async
 * @param {number|null} [trainerId] - Optional trainer ID
 * @returns {Promise<Object>} Statistics object:
 * {
 *   total: number,
 *   upcoming: number,
 *   totalBookings: number
 * }
 */

  static async getStats(trainerId = null) {
    let total, upcoming, totalBookings;
    if (trainerId) {
      [{ total }]         = await this.query('SELECT COUNT(*) as total FROM sessions WHERE trainer_id = ?', [trainerId]);
      [{ upcoming }]      = await this.query('SELECT COUNT(*) as upcoming FROM sessions WHERE trainer_id = ? AND date >= CURDATE()', [trainerId]);
      [{ totalBookings }] = await this.query(
        `SELECT COUNT(*) as totalBookings FROM bookings b
         JOIN sessions s ON s.id = b.session_id
         WHERE s.trainer_id = ? AND b.status = 'confirmed'`, [trainerId]);
    } else {
      [{ total }]         = await this.query('SELECT COUNT(*) as total FROM sessions');
      [{ upcoming }]      = await this.query('SELECT COUNT(*) as upcoming FROM sessions WHERE date >= CURDATE()');
      [{ totalBookings }] = await this.query("SELECT COUNT(*) as totalBookings FROM bookings WHERE status = 'confirmed'");
    }
    return { total, upcoming, totalBookings };
  }
/**
 * Retrieves all bookings for a specific session.
 *
 * Includes member details such as:
 * - Name
 * - Email
 * - Phone number
 *
 * @async
 * @param {number} sessionId - Session ID
 * @returns {Promise<Array<Object>>} List of bookings with member info
 */

  static async getSessionBookings(sessionId) {
    return await this.query(
      `SELECT b.*, u.name AS member_name, u.email AS member_email, u.phone AS member_phone
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.session_id = ?
       ORDER BY b.created_at DESC`,
      [sessionId]
    );
  }
  static async cancelSession(id) {
  await this.query(
    "DELETE FROM sessions WHERE id = ?",
    [id]
  );
}
}
