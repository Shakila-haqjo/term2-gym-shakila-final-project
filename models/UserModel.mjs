/**
 * @module UserModel
 * @description Database model for user-related operations.
 *              Handles create, read, update, and deactivation of user records.
 */

import db from '../DatabaseModel.mjs';

/**
 * Find a user by their email address (includes password_hash for login).
 * @param {string} email - The user's email address.
 * @returns {Promise<Object|undefined>} Full user row, or undefined if not found.
 */
export async function findByEmail(email) {
  const [[user]] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return user;
}

/**
 * Find a user's public profile by ID (excludes password_hash).
 * @param {number} id - The user's ID.
 * @returns {Promise<Object|undefined>} User profile row, or undefined if not found.
 */
export async function findById(id) {
  const [[user]] = await db.execute(
    'SELECT id, name, email, role, avatar, phone, address, status, created_at FROM users WHERE id = ?',
    [id]
  );
  return user;
}

/**
 * Check if an email address is already registered.
 * @param {string} email - Email to check.
 * @returns {Promise<Object|undefined>} Existing user's id row, or undefined if free.
 */
export async function checkEmailExists(email) {
  const [[existing]] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  return existing;
}

/**
 * Check for email conflicts when updating (excludes current user).
 * @param {string} email - Email to check.
 * @param {number} excludeId - User ID to exclude from the check.
 * @returns {Promise<Object|undefined>} Conflicting user row, or undefined if clear.
 */
export async function checkEmailConflict(email, excludeId) {
  const [[conflict]] = await db.execute(
    'SELECT id FROM users WHERE email = ? AND id != ?',
    [email, excludeId]
  );
  return conflict;
}

/**
 * Create a new user record in the database.
 * @param {string} name - Full name.
 * @param {string} email - Email address.
 * @param {string} passwordHash - Bcrypt hashed password.
 * @param {string|null} phone - Phone number (optional).
 * @param {string|null} address - Address (optional).
 * @param {string} role - Role: 'member', 'trainer', or 'admin'.
 * @param {string} status - Status: 'active' or 'inactive'.
 * @returns {Promise<number>} The insertId of the newly created user.
 */
export async function createUser(name, email, passwordHash, phone, address, role, status) {
  const [result] = await db.execute(
    'INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, email, passwordHash, phone, address, role, status]
  );
  return result.insertId;
}

/**
 * Get a user's profile fields (no password_hash) by ID.
 * @param {number} id - The user's ID.
 * @returns {Promise<Object|undefined>} Profile data row, or undefined if not found.
 */
export async function getProfile(id) {
  const [[user]] = await db.execute(
    'SELECT id, name, email, role, avatar, phone, address FROM users WHERE id = ?',
    [id]
  );
  return user;
}

/**
 * Get a full user row including all admin-visible fields.
 * @param {number} id - The user's ID.
 * @returns {Promise<Object|undefined>} Full user row, or undefined if not found.
 */
export async function getFullById(id) {
  const [[user]] = await db.execute(
    'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE id = ?',
    [id]
  );
  return user;
}

/**
 * List all users with optional search, role, and status filters.
 * @param {Object} [filters={}] - Optional filter parameters.
 * @param {string} [filters.search] - Substring match on name or email.
 * @param {string} [filters.role]   - Filter by role ('member', 'trainer', 'admin').
 * @param {string} [filters.status] - Filter by status ('active', 'inactive').
 * @returns {Promise<Array<Object>>} Array of user rows ordered by creation date.
 */
export async function listUsers({ search, role, status } = {}) {
  let sql = 'SELECT id, name, email, phone, address, role, status, avatar, created_at FROM users WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (role)   { sql += ' AND role = ?';   params.push(role); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const [users] = await db.execute(sql, params);
  return users;
}

/**
 * Update specified fields on a user record.
 * @param {number} id - User ID to update.
 * @param {Object} fields - Fields to change.
 * @param {string} [fields.name]         - New full name.
 * @param {string} [fields.email]        - New email address.
 * @param {string} [fields.phone]        - New phone number.
 * @param {string} [fields.address]      - New address.
 * @param {string} [fields.role]         - New role.
 * @param {string} [fields.status]       - New status.
 * @param {string} [fields.passwordHash] - New bcrypt password hash.
 * @returns {Promise<void>}
 */
export async function updateUser(id, fields) {
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
  await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
}

/**
 * Soft-delete a user by setting their status to 'inactive'.
 * @param {number} id - User ID to deactivate.
 * @returns {Promise<void>}
 */
export async function deactivateUser(id) {
  await db.execute("UPDATE users SET status = 'inactive' WHERE id = ?", [id]);
}

/**
 * Get user count statistics for the admin dashboard.
 * @returns {Promise<{total: number, members: number, trainers: number, active: number}>}
 */
export async function getStats() {
  const [[{ total }]]    = await db.execute('SELECT COUNT(*) as total FROM users');
  const [[{ members }]]  = await db.execute("SELECT COUNT(*) as members FROM users WHERE role = 'member'");
  const [[{ trainers }]] = await db.execute("SELECT COUNT(*) as trainers FROM users WHERE role = 'trainer'");
  const [[{ active }]]   = await db.execute("SELECT COUNT(*) as active FROM users WHERE status = 'active'");
  return { total, members, trainers, active };
}

// =============================================================================
// Quick test — run: node models/UserModel.mjs
// =============================================================================
// import { findByEmail, getStats } from './UserModel.mjs';
// const user = await findByEmail('admin@gym.com');
// console.log('findByEmail:', user?.name, user?.role);
// const stats = await getStats();
// console.log('getStats:', stats);
