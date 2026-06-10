import { DatabaseModel } from './DatabaseModel.mjs';

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
 * BookingModel
 *
 * Handles all database operations related to bookings.
 *
 * Provides methods to:
 * - Retrieve bookings with filters
 * - Find bookings by ID
 * - Create and update bookings
 * - Cancel or delete bookings
 * - Count session bookings
 * - Generate booking statistics
 *
 * Extends DatabaseModel for executing SQL queries.
 *
 * @class BookingModel
 * @extends DatabaseModel
 */

export class BookingModel extends DatabaseModel {
/**
 * Retrieves bookings with optional filtering.
 *
 * Supports filtering by:
 * - user ID
 * - trainer ID
 * - booking status
 * - upcoming or past sessions
 *
 * @async
 * @param {Object} [options={}] - Filter options
 * @param {number} [options.userId] - Member ID
 * @param {number} [options.trainerId] - Trainer ID
 * @param {string} [options.status] - Booking status
 * @param {boolean} [options.upcoming] - Include upcoming sessions only
 * @param {boolean} [options.past] - Include past sessions only
 * @returns {Promise<Array<Object>>} List of bookings
 */
  static async listBookings({ userId, trainerId, status, upcoming, past } = {}) {
    let sql = BOOKING_SELECT + ' WHERE 1=1';
    const params = [];
    if (userId)            { sql += ' AND b.user_id = ?';    params.push(userId); }
    if (trainerId)         { sql += ' AND s.trainer_id = ?'; params.push(trainerId); }
    if (status)            { sql += ' AND b.status = ?';     params.push(status); }
    if (upcoming === true) { sql += ' AND s.date >= CURDATE()'; }
    if (past === true)     { sql += ' AND s.date < CURDATE()'; }
    sql += ' ORDER BY s.date DESC, s.time DESC';
    return await this.query(sql, params);
  }
/**
 * Finds a booking by ID with full joined details.
 *
 * @async
 * @param {number} id - Booking ID
 * @returns {Promise<Object|undefined>} Booking object or undefined
 */

  static async findById(id) {
    const rows = await this.query(BOOKING_SELECT + ' WHERE b.id = ?', [id]);
    return rows[0];
  }

  static async findRawById(id) {
    const rows = await this.query('SELECT * FROM bookings WHERE id = ?', [id]);
    return rows[0];
  }
/**
 * Counts confirmed bookings for a specific session.
 *
 * @async
 * @param {number} sessionId - Session ID
 * @returns {Promise<number>} Number of confirmed bookings
 */

  static async countConfirmed(sessionId) {
    const [{ booked }] = await this.query(
      "SELECT COUNT(*) AS booked FROM bookings WHERE session_id = ? AND status = 'confirmed'",
      [sessionId]
    );
    return booked;
  }
/**
 * Checks if a booking already exists for a user and session.
 *
 * @async
 * @param {number} userId - Member ID
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object|undefined>} Existing booking if found
 */

  static async findExisting(userId, sessionId) {
  
  const rows = await this.query(
    'SELECT * FROM bookings WHERE user_id = ? AND session_id = ?',
    [userId, sessionId]
  );

  return rows[0];
}
      

  // INSERT HERE
  static async findUserBookingAtSameTime(
  userId,
  sessionDate,
  sessionTime
) {
  const rows = await this.query(
    `
    SELECT b.id
    FROM bookings b
    JOIN sessions s
      ON s.id = b.session_id
    WHERE b.user_id = ?
      AND s.date = ?
      AND s.time = ?
      AND b.status != 'cancelled'
    `,
    [userId, sessionDate, sessionTime]
  );

  return rows[0];
}
/**
 * Creates a new booking.
 *
 * @async
 * @param {number} userId - Member ID
 * @param {number} sessionId - Session ID
 * @param {string} status - Booking status
 * @returns {Promise<number>} ID of the new booking
 */

  static async createBooking(userId, sessionId, status) {
    const result = await this.query(
      'INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?)',
      [userId, sessionId, status]
    );
    return result.insertId;
  }
/**
 * Reactivates a cancelled booking.
 *
 * Sets status back to 'confirmed' and updates timestamp.
 *
 * @async
 * @param {number} bookingId - Booking ID
 * @returns {Promise<void>}
 */

  static async reactivate(bookingId) {
    await this.query(
      "UPDATE bookings SET status = 'confirmed', created_at = NOW() WHERE id = ?",
      [bookingId]
    );
  }

  /**
 * Updates the session associated with a booking.
 *
 * @async
 * @param {number} bookingId - Booking ID
 * @param {number} sessionId - New session ID
 * @returns {Promise<void>}
 */
static async updateBookingSession(bookingId, sessionId) {
    await this.query('UPDATE bookings SET session_id = ? WHERE id = ?', [sessionId, bookingId]);
  }

 /**
 * Updates the status of a booking.
 *
 * @async
 * @param {number} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
static async updateBookingStatus(bookingId, status) {
    await this.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
  }
/**
 * Cancels a booking by setting its status to 'cancelled'.
 *
 * @async
 * @param {number} bookingId - Booking ID
 * @returns {Promise<void>}
 */

static async updateBooking(
  bookingId,
  sessionId,
  status
) {
  await this.query(
    `
    UPDATE bookings
    SET session_id = ?,
        status = ?
    WHERE id = ?
    `,
    [sessionId, status, bookingId]
  );
}

  static async cancelBooking(bookingId) {
    await this.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
  }
/**
 * Permanently deletes a booking from the database.
 *
 * @async
 * @param {number} bookingId - Booking ID
 * @returns {Promise<void>}
 */

  static async deleteBooking(bookingId) {
    await this.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
  }
/**
 * Retrieves booking statistics for dashboard display.
 *
 * Includes:
 * - Total bookings
 * - Confirmed bookings
 * - Cancelled bookings
 * - Completed bookings
 * - Booking trend over the last 7 days
 *
 * @async
 * @returns {Promise<Object>} Statistics object
 */

  static async getStats() {
    const [{ total }]     = await this.query('SELECT COUNT(*) AS total FROM bookings');
    const [{ confirmed }] = await this.query("SELECT COUNT(*) AS confirmed FROM bookings WHERE status = 'confirmed'");
    const [{ cancelled }] = await this.query("SELECT COUNT(*) AS cancelled FROM bookings WHERE status = 'cancelled'");
    const [{ completed }] = await this.query("SELECT COUNT(*) AS completed FROM bookings WHERE status = 'completed'");
    const trend           = await this.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS cnt
       FROM bookings
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY day ORDER BY day`
    );
    return { total, confirmed, cancelled, completed, trend };
  }
}
