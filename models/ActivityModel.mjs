/**
 * @module ActivityModel
 * @description Database model for gym activity operations.
 *              Handles listing, creating, updating, and removing activity records.
 */

import db from '../DatabaseModel.mjs';

/**
 * List all activities, ordered by name.
 * @param {boolean} [activeOnly=false] - If true, only return activities with status 'active'.
 * @returns {Promise<Array<Object>>} Array of activity rows.
 */
export async function listActivities(activeOnly = false) {
  const sql = activeOnly
    ? "SELECT * FROM activities WHERE status = 'active' ORDER BY name ASC"
    : 'SELECT * FROM activities ORDER BY name ASC';
  const [activities] = await db.execute(sql);
  return activities;
}

/**
 * Get a single activity row by ID.
 * @param {number} id - Activity ID.
 * @returns {Promise<Object|undefined>} Activity row, or undefined if not found.
 */
export async function findById(id) {
  const [[activity]] = await db.execute('SELECT * FROM activities WHERE id = ?', [id]);
  return activity;
}

/**
 * Create a new activity record.
 * @param {string} name        - Activity name.
 * @param {string} description - Activity description.
 * @param {string} status      - 'active' or 'inactive'.
 * @returns {Promise<number>} The insertId of the newly created activity.
 */
export async function createActivity(name, description, status) {
  const [result] = await db.execute(
    'INSERT INTO activities (name, description, status) VALUES (?, ?, ?)',
    [name, description, status]
  );
  return result.insertId;
}

/**
 * Update an activity record.
 * @param {number} id          - Activity ID to update.
 * @param {string} name        - New name.
 * @param {string} description - New description.
 * @param {string} status      - New status.
 * @returns {Promise<void>}
 */
export async function updateActivity(id, name, description, status) {
  await db.execute(
    'UPDATE activities SET name = ?, description = ?, status = ? WHERE id = ?',
    [name, description, status, id]
  );
}

/**
 * Check whether an activity is currently referenced by any session.
 * @param {number} id - Activity ID to check.
 * @returns {Promise<number>} Count of sessions using this activity.
 */
export async function countUsage(id) {
  const [[{ used }]] = await db.execute(
    'SELECT COUNT(*) AS used FROM sessions WHERE activity_id = ?',
    [id]
  );
  return used;
}

/**
 * Deactivate an activity (soft delete — sets status to 'inactive').
 * @param {number} id - Activity ID to deactivate.
 * @returns {Promise<void>}
 */
export async function deactivateActivity(id) {
  await db.execute("UPDATE activities SET status = 'inactive' WHERE id = ?", [id]);
}

/**
 * Permanently delete an activity record.
 * @param {number} id - Activity ID to delete.
 * @returns {Promise<void>}
 */
export async function deleteActivity(id) {
  await db.execute('DELETE FROM activities WHERE id = ?', [id]);
}

// =============================================================================
// Quick test — run: node models/ActivityModel.mjs
// =============================================================================
// import { listActivities, findById } from './ActivityModel.mjs';
// const all = await listActivities();
// console.log('All activities:', all.map(a => a.name));
// const activity = await findById(1);
// console.log('Activity #1:', activity?.name);
