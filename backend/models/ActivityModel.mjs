import { DatabaseModel } from './DatabaseModel.mjs';
/**
 * ActivityModel
 *
 * Handles all database operations related to activities.
 *
 * Provides methods to:
 * - Retrieve activities (all or active only)
 * - Find activity by ID
 * - Create, update, and delete activities
 * - Track activity usage in sessions
 *
 * Extends the DatabaseModel for executing SQL queries.
 *
 * @class ActivityModel
 * @extends DatabaseModel
 */
export class ActivityModel extends DatabaseModel {
/**
 * Retrieves a list of activities.
 *
 * @async
 * @param {boolean} [activeOnly=false] - Whether to return only active activities
 * @returns {Promise<Array<Object>>} List of activity records
 */
static async listActivities(activeOnly = false) {
    const sql = activeOnly
      ? "SELECT * FROM activities WHERE status = 'active' ORDER BY name ASC"
      : 'SELECT * FROM activities ORDER BY name ASC';
    return await this.query(sql);
  }

  /**
 * Finds an activity by its ID.
 *
 * @async
 * @param {number} id - Activity ID
 * @returns {Promise<Object|undefined>} Activity object or undefined if not found
 */
static async findById(id) {
    const rows = await this.query('SELECT * FROM activities WHERE id = ?', [id]);
    return rows[0];
  }
/**
 * Creates a new activity in the database.
 *
 * @async
 * @param {string} name - Activity name
 * @param {string|null} description - Activity description
 * @param {string} status - Activity status ('active' or 'inactive')
 * @returns {Promise<number>} ID of the newly created activity
 */
static async createActivity(name, description, status) {
    const result = await this.query(
      'INSERT INTO activities (name, description, status) VALUES (?, ?, ?)',
      [name, description, status]
    );
    return result.insertId;
  }
/**
 * Updates an existing activity.
 *
 * @async
 * @param {number} id - Activity ID
 * @param {string} name - Updated name
 * @param {string|null} description - Updated description
 * @param {string} status - Updated status
 * @returns {Promise<void>}
 */
static async updateActivity(id, name, description, status) {
    await this.query(
      'UPDATE activities SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status, id]
    );
  }
/**
 * Counts how many sessions are using a specific activity.
 *
 * @async
 * @param {number} id - Activity ID
 * @returns {Promise<number>} Number of sessions using the activity
 */
static async countUsage(id) {
    const [{ used }] = await this.query(
      'SELECT COUNT(*) AS used FROM sessions WHERE activity_id = ?',
      [id]
    );
    return used;
  }
/**
 * Marks an activity as inactive.
 *
 * @async
 * @param {number} id - Activity ID
 * @returns {Promise<void>}
 */

  static async deactivateActivity(id) {
    await this.query("UPDATE activities SET status = 'inactive' WHERE id = ?", [id]);
  }

  /**
 * Permanently deletes an activity from the database.
 *
 * @async
 * @param {number} id - Activity ID
 * @returns {Promise<void>}
 */


  static async deleteActivity(id) {
    await this.query('DELETE FROM activities WHERE id = ?', [id]);
  }


  static async getStats() {
  const rows = await this.query(`
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'active') AS active,
      SUM(status = 'inactive') AS inactive
    FROM activities
  `);

  return {
    total: rows[0]?.total || 0,
    active: rows[0]?.active || 0,
    inactive: rows[0]?.inactive || 0
  };
}
  
}
