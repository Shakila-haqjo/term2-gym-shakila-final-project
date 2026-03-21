/**
 * @module DatabaseModel
 * @description MySQL database connection pool for the FitGym application.
 *              This is the single database connection used by all model files.
 *              Follows the reference project pattern (config/db.js).
 */

import mysql from 'mysql2/promise';

/**
 * MySQL connection pool shared across all models.
 * Configuration is read from environment variables.
 * @type {mysql.Pool}
 */
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'gym_fitness_db_shakila',
  waitForConnections: true,
  connectionLimit:    10,
});

export default db;
