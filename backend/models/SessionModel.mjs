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

export class SessionModel extends DatabaseModel {

  static async listSessions({ trainerId, search, activity_id, date, upcoming } = {}) {
    let sql = SESSION_SELECT + ' WHERE 1=1';
    const params = [];
    if (trainerId)   { sql += ' AND s.trainer_id = ?';                params.push(trainerId); }
    if (search)      { sql += ' AND (s.name LIKE ? OR a.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (activity_id) { sql += ' AND s.activity_id = ?';               params.push(activity_id); }
    if (date)        { sql += ' AND s.date = ?';                      params.push(date); }
    if (upcoming)    { sql += ' AND s.date >= CURDATE()'; }
    sql += ' ORDER BY s.date ASC, s.time ASC';
    const [sessions] = await this.execute(sql, params);
    return sessions;
  }

  static async findById(id) {
    const [[session]] = await this.execute(SESSION_SELECT + ' WHERE s.id = ?', [id]);
    return session;
  }

  static async findRawById(id) {
    const [[session]] = await this.execute('SELECT * FROM sessions WHERE id = ?', [id]);
    return session;
  }

  static async createSession(name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) {
    const [result] = await this.execute(
      'INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description]
    );
    return result.insertId;
  }

  static async updateSession(id, fields) {
    const updates = [];
    const params  = [];
    const allowed = ['name', 'activity_id', 'location_id', 'trainer_id', 'date', 'time', 'duration_minutes', 'max_participants', 'description'];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
    }
    if (updates.length === 0) return;
    params.push(id);
    await this.execute(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  static async deleteSession(id) {
    await this.execute('DELETE FROM bookings WHERE session_id = ?', [id]);
    await this.execute('DELETE FROM sessions WHERE id = ?', [id]);
  }

  static async getStats(trainerId = null) {
    let total, upcoming, totalBookings;
    if (trainerId) {
      [[{ total }]]         = await this.execute('SELECT COUNT(*) as total FROM sessions WHERE trainer_id = ?', [trainerId]);
      [[{ upcoming }]]      = await this.execute('SELECT COUNT(*) as upcoming FROM sessions WHERE trainer_id = ? AND date >= CURDATE()', [trainerId]);
      [[{ totalBookings }]] = await this.execute(
        `SELECT COUNT(*) as totalBookings FROM bookings b
         JOIN sessions s ON s.id = b.session_id
         WHERE s.trainer_id = ? AND b.status = 'confirmed'`, [trainerId]);
    } else {
      [[{ total }]]         = await this.execute('SELECT COUNT(*) as total FROM sessions');
      [[{ upcoming }]]      = await this.execute('SELECT COUNT(*) as upcoming FROM sessions WHERE date >= CURDATE()');
      [[{ totalBookings }]] = await this.execute("SELECT COUNT(*) as totalBookings FROM bookings WHERE status = 'confirmed'");
    }
    return { total, upcoming, totalBookings };
  }

  static async getSessionBookings(sessionId) {
    const [bookings] = await this.execute(
      `SELECT b.*, u.name AS member_name, u.email AS member_email, u.phone AS member_phone
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.session_id = ?
       ORDER BY b.created_at DESC`,
      [sessionId]
    );
    return bookings;
  }
}
