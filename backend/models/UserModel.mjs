import { DatabaseModel } from './DatabaseModel.mjs';

export class UserModel extends DatabaseModel {

  static async findByEmail(email) {
    const [[user]] = await this.execute('SELECT * FROM users WHERE email = ?', [email]);
    return user;
  }

  static async findById(id) {
    const [[user]] = await this.execute(
      'SELECT id, name, email, role, avatar, phone, address, status, created_at FROM users WHERE id = ?',
      [id]
    );
    return user;
  }

  static async checkEmailExists(email) {
    const [[existing]] = await this.execute('SELECT id FROM users WHERE email = ?', [email]);
    return existing;
  }

  static async checkEmailConflict(email, excludeId) {
    const [[conflict]] = await this.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, excludeId]
    );
    return conflict;
  }

  static async createUser(name, email, passwordHash, phone, address, role, status) {
    const [result] = await this.execute(
      'INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone, address, role, status]
    );
    return result.insertId;
  }

  static async getProfile(id) {
    const [[user]] = await this.execute(
      'SELECT id, name, email, role, avatar, phone, address FROM users WHERE id = ?',
      [id]
    );
    return user;
  }

  static async getFullById(id) {
    const [[user]] = await this.execute(
      'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    return user;
  }

  static async listUsers({ search, role, status } = {}) {
    let sql = 'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role)   { sql += ' AND role = ?';   params.push(role); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const [users] = await this.execute(sql, params);
    return users;
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
    await this.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  static async deactivateUser(id) {
    await this.execute("UPDATE users SET status = 'inactive' WHERE id = ?", [id]);
  }

  static async getStats() {
    const [[{ total }]]    = await this.execute('SELECT COUNT(*) as total FROM users');
    const [[{ members }]]  = await this.execute("SELECT COUNT(*) as members FROM users WHERE role = 'member'");
    const [[{ trainers }]] = await this.execute("SELECT COUNT(*) as trainers FROM users WHERE role = 'trainer'");
    const [[{ active }]]   = await this.execute("SELECT COUNT(*) as active FROM users WHERE status = 'active'");
    return { total, members, trainers, active };
  }
}
