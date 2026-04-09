import { DatabaseModel } from './DatabaseModel.mjs';

export class ActivityModel extends DatabaseModel {

  static async listActivities(activeOnly = false) {
    const sql = activeOnly
      ? "SELECT * FROM activities WHERE status = 'active' ORDER BY name ASC"
      : 'SELECT * FROM activities ORDER BY name ASC';
    return await this.query(sql);
  }

  static async findById(id) {
    const rows = await this.query('SELECT * FROM activities WHERE id = ?', [id]);
    return rows[0];
  }

  static async createActivity(name, description, status) {
    const result = await this.query(
      'INSERT INTO activities (name, description, status) VALUES (?, ?, ?)',
      [name, description, status]
    );
    return result.insertId;
  }

  static async updateActivity(id, name, description, status) {
    await this.query(
      'UPDATE activities SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status, id]
    );
  }

  static async countUsage(id) {
    const [{ used }] = await this.query(
      'SELECT COUNT(*) AS used FROM sessions WHERE activity_id = ?',
      [id]
    );
    return used;
  }

  static async deactivateActivity(id) {
    await this.query("UPDATE activities SET status = 'inactive' WHERE id = ?", [id]);
  }

  static async deleteActivity(id) {
    await this.query('DELETE FROM activities WHERE id = ?', [id]);
  }
}
