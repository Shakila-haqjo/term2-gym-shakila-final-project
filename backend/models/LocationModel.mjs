import { DatabaseModel } from './DatabaseModel.mjs';

export class LocationModel extends DatabaseModel {

  static async listLocations(activeOnly = false) {
    const sql = activeOnly
      ? "SELECT * FROM locations WHERE status = 'active' ORDER BY name ASC"
      : 'SELECT * FROM locations ORDER BY name ASC';
    return await this.query(sql);
  }

  static async findById(id) {
    const rows = await this.query('SELECT * FROM locations WHERE id = ?', [id]);
    return rows[0];
  }

  static async createLocation(name, address, capacity, status) {
    const result = await this.query(
      'INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)',
      [name, address, capacity, status]
    );
    return result.insertId;
  }

  static async updateLocation(id, fields) {
    const updates = [];
    const params  = [];
    if (fields.name     !== undefined) { updates.push('name = ?');     params.push(fields.name); }
    if (fields.address  !== undefined) { updates.push('address = ?');  params.push(fields.address); }
    if (fields.capacity !== undefined) { updates.push('capacity = ?'); params.push(fields.capacity); }
    if (fields.status   !== undefined) { updates.push('status = ?');   params.push(fields.status); }
    if (updates.length === 0) return;
    params.push(id);
    await this.query(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  static async countUsage(id) {
    const [{ used }] = await this.query(
      'SELECT COUNT(*) AS used FROM sessions WHERE location_id = ?',
      [id]
    );
    return used;
  }

  static async deactivateLocation(id) {
    await this.query("UPDATE locations SET status = 'inactive' WHERE id = ?", [id]);
  }

  static async deleteLocation(id) {
    await this.query('DELETE FROM locations WHERE id = ?', [id]);
  }
}
