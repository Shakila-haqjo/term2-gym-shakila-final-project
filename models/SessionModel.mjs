/**
 * @module SessionModel
 * @description Database model for gym session operations.
 *              Handles listing, creating, updating, and deleting sessions,
 *              as well as session-level booking queries.
 */

import db from '../DatabaseModel.mjs';

/**
 * Reusable SELECT with JOINs for session listings.
 * Includes activity name, location, trainer name, and confirmed booking count.
 * @constant {string}
 */
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
 * List sessions with optional filters.
 * @param {Object} [filters={}] - Optional filter parameters.
 * @param {number} [filters.trainerId]   - Restrict to a specific trainer's sessions.
 * @param {string} [filters.search]      - Substring match on session or activity name.
 * @param {number} [filters.activity_id] - Filter by activity ID.
 * @param {string} [filters.date]        - Filter by exact date (YYYY-MM-DD).
 * @param {boolean} [filters.upcoming]   - If true, only return sessions from today onward.
 * @returns {Promise<Array<Object>>} Array of enriched session rows.
 */
export async function listSessions({ trainerId, search, activity_id, date, upcoming } = {}) {
  let sql = SESSION_SELECT + ' WHERE 1=1';
  const params = [];
  if (trainerId)   { sql += ' AND s.trainer_id = ?';               params.push(trainerId); }
  if (search)      { sql += ' AND (s.name LIKE ? OR a.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (activity_id) { sql += ' AND s.activity_id = ?';              params.push(activity_id); }
  if (date)        { sql += ' AND s.date = ?';                     params.push(date); }
  if (upcoming)    { sql += ' AND s.date >= CURDATE()'; }
  sql += ' ORDER BY s.date ASC, s.time ASC';
  const [sessions] = await db.execute(sql, params);
  return sessions;
}

/**
 * Get a single enriched session row by ID.
 * @param {number} id - Session ID.
 * @returns {Promise<Object|undefined>} Enriched session row, or undefined if not found.
 */
export async function findById(id) {
  const [[session]] = await db.execute(SESSION_SELECT + ' WHERE s.id = ?', [id]);
  return session;
}

/**
 * Get the raw sessions row (no joins) by ID — used for ownership checks.
 * @param {number} id - Session ID.
 * @returns {Promise<Object|undefined>} Raw session row, or undefined if not found.
 */
export async function findRawById(id) {
  const [[session]] = await db.execute('SELECT * FROM sessions WHERE id = ?', [id]);
  return session;
}

/**
 * Create a new session record.
 * @param {string} name             - Session name.
 * @param {number|null} activity_id - Activity ID.
 * @param {number|null} location_id - Location ID.
 * @param {number} trainer_id       - Trainer's user ID.
 * @param {string} date             - Session date (YYYY-MM-DD).
 * @param {string} time             - Start time (HH:MM:SS).
 * @param {number} duration_minutes - Duration in minutes.
 * @param {number} max_participants - Maximum number of participants.
 * @param {string|null} description - Optional description.
 * @returns {Promise<number>} The insertId of the newly created session.
 */
export async function createSession(name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) {
  const [result] = await db.execute(
    'INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description]
  );
  return result.insertId;
}

/**
 * Update specified fields on a session record.
 * @param {number} id      - Session ID to update.
 * @param {Object} fields  - Fields to change (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description).
 * @returns {Promise<void>}
 */
export async function updateSession(id, fields) {
  const updates = [];
  const params  = [];
  const map = ['name', 'activity_id', 'location_id', 'trainer_id', 'date', 'time', 'duration_minutes', 'max_participants', 'description'];
  for (const key of map) {
    if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
  }
  if (updates.length === 0) return;
  params.push(id);
  await db.execute(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`, params);
}

/**
 * Delete a session and all its associated bookings.
 * @param {number} id - Session ID to delete.
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  await db.execute('DELETE FROM bookings WHERE session_id = ?', [id]);
  await db.execute('DELETE FROM sessions WHERE id = ?', [id]);
}

/**
 * Get session count statistics.
 * @param {number|null} [trainerId=null] - If provided, restrict to that trainer's sessions.
 * @returns {Promise<{total: number, upcoming: number, totalBookings: number}>}
 */
export async function getStats(trainerId = null) {
  let total, upcoming, totalBookings;
  if (trainerId) {
    [[{ total }]]         = await db.execute('SELECT COUNT(*) as total FROM sessions WHERE trainer_id = ?', [trainerId]);
    [[{ upcoming }]]      = await db.execute('SELECT COUNT(*) as upcoming FROM sessions WHERE trainer_id = ? AND date >= CURDATE()', [trainerId]);
    [[{ totalBookings }]] = await db.execute(
      `SELECT COUNT(*) as totalBookings FROM bookings b
       JOIN sessions s ON s.id = b.session_id
       WHERE s.trainer_id = ? AND b.status = 'confirmed'`, [trainerId]);
  } else {
    [[{ total }]]         = await db.execute('SELECT COUNT(*) as total FROM sessions');
    [[{ upcoming }]]      = await db.execute('SELECT COUNT(*) as upcoming FROM sessions WHERE date >= CURDATE()');
    [[{ totalBookings }]] = await db.execute("SELECT COUNT(*) as totalBookings FROM bookings WHERE status = 'confirmed'");
  }
  return { total, upcoming, totalBookings };
}

/**
 * List all bookings for a given session, joined with member details.
 * @param {number} sessionId - Session ID.
 * @returns {Promise<Array<Object>>} Array of booking rows with member info.
 */
export async function getSessionBookings(sessionId) {
  const [bookings] = await db.execute(
    `SELECT b.*, u.name AS member_name, u.email AS member_email, u.phone AS member_phone
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     WHERE b.session_id = ?
     ORDER BY b.created_at DESC`,
    [sessionId]
  );
  return bookings;
}

// =============================================================================
// Quick test — run: node models/SessionModel.mjs
// =============================================================================
// import { listSessions, getStats } from './SessionModel.mjs';
// const sessions = await listSessions({ upcoming: true });
// console.log('Upcoming sessions:', sessions.length);
// const stats = await getStats();
// console.log('Session stats:', stats);
