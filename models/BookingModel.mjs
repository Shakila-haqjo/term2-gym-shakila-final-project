/**
 * @module BookingModel
 * @description Database model for booking operations.
 *              Handles creating, listing, cancelling, and deleting bookings.
 */

import db from '../DatabaseModel.mjs';

/**
 * Reusable SELECT with JOINs for booking listings.
 * Includes member info, session info, activity, location, and trainer name.
 * @constant {string}
 */
const BOOKING_SELECT = `
  SELECT b.*,
    u.name AS member_name, u.email AS member_email,
    s.name AS session_name, s.date AS session_date, s.time AS session_time,
    s.duration_minutes, s.trainer_id,
    a.name AS activity_name,
    l.name AS location_name,
    t.name AS trainer_name
  FROM bookings b
  JOIN users    u ON u.id = b.user_id
  JOIN sessions s ON s.id = b.session_id
  LEFT JOIN activities a ON a.id = s.activity_id
  LEFT JOIN locations  l ON l.id = s.location_id
  LEFT JOIN users      t ON t.id = s.trainer_id`;

/**
 * List bookings with optional filters.
 * @param {Object} [filters={}] - Optional filter parameters.
 * @param {number} [filters.userId]    - Restrict to a specific member's bookings.
 * @param {number} [filters.trainerId] - Restrict to bookings on a trainer's sessions.
 * @param {string} [filters.status]    - Filter by status ('confirmed', 'cancelled', 'completed').
 * @param {boolean} [filters.upcoming] - If true, only return bookings for future sessions.
 * @param {boolean} [filters.past]     - If true, only return bookings for past sessions.
 * @returns {Promise<Array<Object>>} Array of enriched booking rows.
 */
export async function listBookings({ userId, trainerId, status, upcoming, past } = {}) {
  let sql = BOOKING_SELECT + ' WHERE 1=1';
  const params = [];
  if (userId)            { sql += ' AND b.user_id = ?';    params.push(userId); }
  if (trainerId)         { sql += ' AND s.trainer_id = ?'; params.push(trainerId); }
  if (status)            { sql += ' AND b.status = ?';     params.push(status); }
  if (upcoming === true) { sql += ' AND s.date >= CURDATE()'; }
  if (past === true)     { sql += ' AND s.date < CURDATE()'; }
  sql += ' ORDER BY s.date DESC, s.time DESC';
  const [bookings] = await db.execute(sql, params);
  return bookings;
}

/**
 * Get a single enriched booking row by ID.
 * @param {number} id - Booking ID.
 * @returns {Promise<Object|undefined>} Enriched booking row, or undefined if not found.
 */
export async function findById(id) {
  const [[booking]] = await db.execute(BOOKING_SELECT + ' WHERE b.id = ?', [id]);
  return booking;
}

/**
 * Get the raw booking row (no joins) by ID — used for ownership checks.
 * @param {number} id - Booking ID.
 * @returns {Promise<Object|undefined>} Raw booking row, or undefined if not found.
 */
export async function findRawById(id) {
  const [[booking]] = await db.execute('SELECT * FROM bookings WHERE id = ?', [id]);
  return booking;
}

/**
 * Count confirmed bookings for a session (for capacity checking).
 * @param {number} sessionId - Session ID.
 * @returns {Promise<number>} Number of confirmed bookings.
 */
export async function countConfirmed(sessionId) {
  const [[{ booked }]] = await db.execute(
    "SELECT COUNT(*) AS booked FROM bookings WHERE session_id = ? AND status = 'confirmed'",
    [sessionId]
  );
  return booked;
}

/**
 * Find an existing booking for a user+session pair (any status).
 * @param {number} userId    - User ID.
 * @param {number} sessionId - Session ID.
 * @returns {Promise<Object|undefined>} Existing booking row, or undefined.
 */
export async function findExisting(userId, sessionId) {
  const [[booking]] = await db.execute(
    'SELECT * FROM bookings WHERE user_id = ? AND session_id = ?',
    [userId, sessionId]
  );
  return booking;
}

/**
 * Create a new booking record.
 * @param {number} userId    - Member's user ID.
 * @param {number} sessionId - Session ID.
 * @param {string} status    - Initial status (typically 'confirmed').
 * @returns {Promise<number>} The insertId of the newly created booking.
 */
export async function createBooking(userId, sessionId, status) {
  const [result] = await db.execute(
    'INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?)',
    [userId, sessionId, status]
  );
  return result.insertId;
}

/**
 * Reactivate a previously cancelled booking.
 * @param {number} bookingId - Booking ID to reactivate.
 * @returns {Promise<void>}
 */
export async function reactivate(bookingId) {
  await db.execute(
    "UPDATE bookings SET status = 'confirmed', created_at = NOW() WHERE id = ?",
    [bookingId]
  );
}

/**
 * Update the session assigned to a booking (admin use).
 * @param {number} bookingId  - Booking ID to update.
 * @param {number} sessionId  - New session ID.
 * @returns {Promise<void>}
 */
export async function updateBookingSession(bookingId, sessionId) {
  await db.execute('UPDATE bookings SET session_id = ? WHERE id = ?', [sessionId, bookingId]);
}

/**
 * Cancel a booking by setting its status to 'cancelled'.
 * @param {number} bookingId - Booking ID to cancel.
 * @returns {Promise<void>}
 */
export async function cancelBooking(bookingId) {
  await db.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
}

/**
 * Permanently delete a booking record.
 * @param {number} bookingId - Booking ID to delete.
 * @returns {Promise<void>}
 */
export async function deleteBooking(bookingId) {
  await db.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
}

/**
 * Get booking statistics for the admin dashboard.
 * @returns {Promise<{total: number, confirmed: number, cancelled: number, completed: number, trend: Array}>}
 */
export async function getStats() {
  const [[{ total }]]     = await db.execute('SELECT COUNT(*) AS total FROM bookings');
  const [[{ confirmed }]] = await db.execute("SELECT COUNT(*) AS confirmed FROM bookings WHERE status = 'confirmed'");
  const [[{ cancelled }]] = await db.execute("SELECT COUNT(*) AS cancelled FROM bookings WHERE status = 'cancelled'");
  const [[{ completed }]] = await db.execute("SELECT COUNT(*) AS completed FROM bookings WHERE status = 'completed'");
  const [trend]           = await db.execute(
    `SELECT DATE(created_at) AS day, COUNT(*) AS cnt
     FROM bookings
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY day ORDER BY day`
  );
  return { total, confirmed, cancelled, completed, trend };
}

// =============================================================================
// Quick test — run: node models/BookingModel.mjs
// =============================================================================
// import { getStats, listBookings } from './BookingModel.mjs';
// const stats = await getStats();
// console.log('Booking stats:', stats);
// const bookings = await listBookings({ upcoming: true });
// console.log('Upcoming bookings:', bookings.length);
