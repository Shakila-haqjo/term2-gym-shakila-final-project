import { DatabaseModel } from './DatabaseModel.mjs';
/**
 * LocationModel
 *
 * Handles all database operations related to locations.
 *
 * Provides methods to:
 * - Retrieve locations (all or active only)
 * - Find a location by ID
 * - Create, update, and delete locations
 * - Track location usage in sessions
 *
 * Extends DatabaseModel to execute SQL queries.
 *
 * @class LocationModel
 * @extends DatabaseModel
 */
export class LocationModel extends DatabaseModel {

  /**
 * Retrieves a list of locations.
 *
 * @async
 * @param {boolean} [activeOnly=false] - Whether to return only active locations
 * @returns {Promise<Array<Object>>} List of location records
 */

  static async listLocations(activeOnly = false) {
    const sql = activeOnly
      ? "SELECT * FROM locations WHERE status = 'active' ORDER BY name ASC"
      : 'SELECT * FROM locations ORDER BY name ASC';
    return await this.query(sql);
  }
/**
 * Finds a location by its ID.
 *
 * @async
 * @param {number} id - Location ID
 * @returns {Promise<Object|undefined>} Location object or undefined if not found
 */

  static async findById(id) {
    const rows = await this.query('SELECT * FROM locations WHERE id = ?', [id]);
    return rows[0];
  }

  /**
 * Creates a new location in the database.
 *
 * @async
 * @param {string} name - Location name
 * @param {string|null} address - Location address
 * @param {number|null} capacity - Maximum capacity of the location
 * @param {string} status - Location status ('active' or 'inactive')
 * @returns {Promise<number>} ID of the newly created location
 */
static async createLocation(name, address, capacity, status) {
    const result = await this.query(
      'INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)',
      [name, address, capacity, status]
    );
    return result.insertId;
  }

 /**
 * Updates an existing location with provided fields.
 *
 * Only updates fields that are defined:
 * - name
 * - address
 * - capacity
 * - status
 *
 * @async
 * @param {number} id - Location ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */
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

  /**
 * Counts how many sessions are using a specific location.
 *
 * @async
 * @param {number} id - Location ID
 * @returns {Promise<number>} Number of sessions using the location
 */
static async countUsage(id) {
    const [{ used }] = await this.query(
      'SELECT COUNT(*) AS used FROM sessions WHERE location_id = ?',
      [id]
    );
    return used;
  }

 /**
 * Marks a location as inactive.
 *
 * @async
 * @param {number} id - Location ID
 * @returns {Promise<void>}
 */
static async deactivateLocation(id) {
    await this.query("UPDATE locations SET status = 'inactive' WHERE id = ?", [id]);
  }

 /**
 * Permanently deletes a location from the database.
 *
 * @async
 * @param {number} id - Location ID
 * @returns {Promise<void>}
 */
static async deleteLocation(id) {
    await this.query('DELETE FROM locations WHERE id = ?', [id]);
  }
  static async getStats() {
  const rows = await this.query(`
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'active') AS active,
      SUM(status = 'inactive') AS inactive
    FROM locations
  `);

  return {
    total: rows[0]?.total || 0,
    active: rows[0]?.active || 0,
    inactive: rows[0]?.inactive || 0
  };
}
}
