/**
 * @module LocationModel
 * @description Database model for gym location operations.
 *              Handles listing, creating, updating, and removing location records.
 */

import db from '../DatabaseModel.mjs';

/**
 * List all locations, ordered by name.
 * @param {boolean} [activeOnly=false] - If true, only return locations with status 'active'.
 * @returns {Promise<Array<Object>>} Array of location rows.
 */
export async function listLocations(activeOnly = false) {
  const sql = activeOnly
    ? "SELECT * FROM locations WHERE status = 'active' ORDER BY name ASC"
    : 'SELECT * FROM locations ORDER BY name ASC';
  const [locations] = await db.execute(sql);
  return locations;
}

/**
 * Get a single location row by ID.
 * @param {number} id - Location ID.
 * @returns {Promise<Object|undefined>} Location row, or undefined if not found.
 */
export async function findById(id) {
  const [[location]] = await db.execute('SELECT * FROM locations WHERE id = ?', [id]);
  return location;
}

/**
 * Create a new location record.
 * @param {string} name     - Location name.
 * @param {string} address  - Street address.
 * @param {number} capacity - Maximum capacity.
 * @param {string} status   - 'active' or 'inactive'.
 * @returns {Promise<number>} The insertId of the newly created location.
 */
export async function createLocation(name, address, capacity, status) {
  const [result] = await db.execute(
    'INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)',
    [name, address, capacity, status]
  );
  return result.insertId;
}

/**
 * Update a location record.
 * @param {number} id       - Location ID to update.
 * @param {string} name     - New name.
 * @param {string} address  - New address.
 * @param {number} capacity - New capacity.
 * @param {string} status   - New status.
 * @returns {Promise<void>}
 */
export async function updateLocation(id, name, address, capacity, status) {
  await db.execute(
    'UPDATE locations SET name = ?, address = ?, capacity = ?, status = ? WHERE id = ?',
    [name, address, capacity, status, id]
  );
}

/**
 * Check whether a location is currently referenced by any session.
 * @param {number} id - Location ID to check.
 * @returns {Promise<number>} Count of sessions using this location.
 */
export async function countUsage(id) {
  const [[{ used }]] = await db.execute(
    'SELECT COUNT(*) AS used FROM sessions WHERE location_id = ?',
    [id]
  );
  return used;
}

/**
 * Deactivate a location (soft delete — sets status to 'inactive').
 * @param {number} id - Location ID to deactivate.
 * @returns {Promise<void>}
 */
export async function deactivateLocation(id) {
  await db.execute("UPDATE locations SET status = 'inactive' WHERE id = ?", [id]);
}

/**
 * Permanently delete a location record.
 * @param {number} id - Location ID to delete.
 * @returns {Promise<void>}
 */
export async function deleteLocation(id) {
  await db.execute('DELETE FROM locations WHERE id = ?', [id]);
}

// =============================================================================
// Quick test — run: node models/LocationModel.mjs
// =============================================================================
// import { listLocations, findById } from './LocationModel.mjs';
// const all = await listLocations();
// console.log('All locations:', all.map(l => l.name));
// const location = await findById(1);
// console.log('Location #1:', location?.name, '| capacity:', location?.capacity);
