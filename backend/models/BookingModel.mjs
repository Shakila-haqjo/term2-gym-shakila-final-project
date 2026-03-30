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

export class BookingModel extends DatabaseModel {

  static async listBookings({ userId, trainerId, status, upcoming, past } = {}) {
    let sql = BOOKING_SELECT + ' WHERE 1=1';
    const params = [];
    if (userId)            { sql += ' AND b.user_id = ?';    params.push(userId); }
    if (trainerId)         { sql += ' AND s.trainer_id = ?'; params.push(trainerId); }
    if (status)            { sql += ' AND b.status = ?';     params.push(status); }
    if (upcoming === true) { sql += ' AND s.date >= CURDATE()'; }
    if (past === true)     { sql += ' AND s.date < CURDATE()'; }
    sql += ' ORDER BY s.date DESC, s.time DESC';
    const [bookings] = await this.execute(sql, params);
    return bookings;
  }

  static async findById(id) {
    const [[booking]] = await this.execute(BOOKING_SELECT + ' WHERE b.id = ?', [id]);
    return booking;
  }

  static async findRawById(id) {
    const [[booking]] = await this.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    return booking;
  }

  static async countConfirmed(sessionId) {
    const [[{ booked }]] = await this.execute(
      "SELECT COUNT(*) AS booked FROM bookings WHERE session_id = ? AND status = 'confirmed'",
      [sessionId]
    );
    return booked;
  }

  static async findExisting(userId, sessionId) {
    const [[booking]] = await this.execute(
      'SELECT * FROM bookings WHERE user_id = ? AND session_id = ?',
      [userId, sessionId]
    );
    return booking;
  }

  static async createBooking(userId, sessionId, status) {
    const [result] = await this.execute(
      'INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?)',
      [userId, sessionId, status]
    );
    return result.insertId;
  }

  static async reactivate(bookingId) {
    await this.execute(
      "UPDATE bookings SET status = 'confirmed', created_at = NOW() WHERE id = ?",
      [bookingId]
    );
  }

  static async updateBookingSession(bookingId, sessionId) {
    await this.execute('UPDATE bookings SET session_id = ? WHERE id = ?', [sessionId, bookingId]);
  }

  static async cancelBooking(bookingId) {
    await this.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
  }

  static async deleteBooking(bookingId) {
    await this.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
  }

  static async getStats() {
    const [[{ total }]]     = await this.execute('SELECT COUNT(*) AS total FROM bookings');
    const [[{ confirmed }]] = await this.execute("SELECT COUNT(*) AS confirmed FROM bookings WHERE status = 'confirmed'");
    const [[{ cancelled }]] = await this.execute("SELECT COUNT(*) AS cancelled FROM bookings WHERE status = 'cancelled'");
    const [[{ completed }]] = await this.execute("SELECT COUNT(*) AS completed FROM bookings WHERE status = 'completed'");
    const [trend]           = await this.execute(
      `SELECT DATE(created_at) AS day, COUNT(*) AS cnt
       FROM bookings
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY day ORDER BY day`
    );
    return { total, confirmed, cancelled, completed, trend };
  }
}
