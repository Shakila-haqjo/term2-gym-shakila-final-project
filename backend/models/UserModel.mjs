import { DatabaseModel } from './DatabaseModel.mjs';

/**
 * UserModel
 *
 * Handles all database operations related to users.
 * TERM 2 ADDITIONS (marked with ── TERM 2 ──):
 *   - findByAuthKey(key)     - look up user by authentication_key
 *   - setAuthKey(id, key)    - save/clear authentication_key on login/logout
 */
export class UserModel extends DatabaseModel {

  static async findByEmail(email) {
    const rows = await this.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const rows = await this.query(
      'SELECT id, name, email, role, avatar, phone, address, status, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async checkEmailExists(email) {
    const rows = await this.query('SELECT id FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async checkEmailConflict(email, excludeId) {
    const rows = await this.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, excludeId]
    );
    return rows[0];
  }

  static async createUser(name, email, passwordHash, phone, address, role, status) {
    const result = await this.query(
      'INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone, address, role, status]
    );
    return result.insertId;
  }

  static async getProfile(id) {
    const rows = await this.query(
      'SELECT id, name, email, role, avatar, phone, address FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async getFullById(id) {
    const rows = await this.query(
      'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async listUsers({ search, role, status } = {}) {
    let sql = 'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role)   { sql += ' AND role = ?';   params.push(role); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    return await this.query(sql, params);
  }

  static async updateUser(id, fields) {
    const updates = [];
    const params  = [];
    if (fields.name         !== undefined) { updates.push('name = ?');          params.push(fields.name); }
    if (fields.email        !== undefined) { updates.push('email = ?');         params.push(fields.email); }
    if (fields.phone        !== undefined) { updates.push('phone = ?');         params.push(fields.phone); }
    if (fields.address      !== undefined) { updates.push('address = ?');       params.push(fields.address); }
    if (fields.role         !== undefined) { updates.push('role = ?');          params.push(fields.role); }
    if (fields.status       !== undefined) { updates.push('status = ?');        params.push(fields.status); }
    if (fields.passwordHash !== undefined) { updates.push('password_hash = ?'); params.push(fields.passwordHash); }
    if (updates.length === 0) return;
    params.push(id);
    await this.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  static async deactivateUser(id) {
    await this.query("UPDATE users SET status = 'inactive' WHERE id = ?", [id]);
  }

  static async getStats() {
    const [{ total }]    = await this.query('SELECT COUNT(*) as total FROM users');
    const [{ members }]  = await this.query("SELECT COUNT(*) as members FROM users WHERE role = 'member'");
    const [{ trainers }] = await this.query("SELECT COUNT(*) as trainers FROM users WHERE role = 'trainer'");
    const [{ active }]   = await this.query("SELECT COUNT(*) as active FROM users WHERE status = 'active'");
    return { total, members, trainers, active };
  }

  // ── TERM 2 ADDITIONS ──────────────────────────────────────────────────────

  /**
   * Find a user by their authentication_key.
   * Called by the API auth middleware on every request that sends x-auth-key.
   * Mirrors coffee project's EmployeeModel.getByAuthenticationKey().
   *
   * @param {string} key - UUID authentication key
   * @returns {Promise<Object|undefined>} User record or undefined
   */
  static async findByAuthKey(key) {
    const rows = await this.query(
      'SELECT id, name, email, phone, address, role, avatar, status, authentication_key FROM users WHERE authentication_key = ?',
      [key]
    );
    return rows[0];
  }

  /**
   * Save or clear the authentication_key for a user.
   * Called on login (set a UUID) and logout (set NULL).
   * Mirrors coffee project's EmployeeModel.update() auth key handling.
   *
   * @param {number} id  - User ID
   * @param {string|null} key - UUID to store, or null to clear
   */
  static async setAuthKey(id, key) {
    await this.query(
      'UPDATE users SET authentication_key = ? WHERE id = ?',
      [key, id]
    );
  }
}
