import mysql from "mysql2/promise";

/**
 * DatabaseModel
 *
 * Base model class responsible for managing database connections
 * and executing SQL queries.
 *
 * Provides:
 * - MySQL connection pool using mysql2/promise
 * - Generic query execution method
 * - Utility function for date formatting
 *
 * All other models extend this class to interact with the database.
 *
 * @class DatabaseModel
 */
export class DatabaseModel {

  /**
 * MySQL connection pool instance.
 *
 * @type {import('mysql2/promise').Pool}
 */

  static connection;
/**
 * Initializes the database connection pool.
 *
 * Uses mysql2/promise for asynchronous database operations.
 * Configuration is defined for local database connection.
 */

  static {
    this.connection = mysql.createPool({
  host:     "localhost",
  port:     3307,                      //   new MySQL port
  user:     "gym_fitness_db_shakila",  //   custom user
  password: "root123",                 // Password set for this user
  database: "gym_fitness_db_shakila",
      nestTables: true  //query results are returned as nested objects (e.g., row.users.name).
      
    });
  }
/**
 * Executes a SQL query using the connection pool.
 *
 * @async
 * @param {string} sql - SQL query string
 * @param {Array<any>} [values] - Optional query parameters
 * @returns {Promise<any>} Query result (rows or result object)
 */

  // static query(sql, values) {
  //   return this.connection.query(sql, values).then(([result]) => result);
  // }

  static query(sql, values) {
  return this.connection.query({
    sql,
    values,
    nestTables: false // ✅ to keep the data structure simple and consistent with my existing code. 
    // my project was already using column aliases like session_name and member_name,
  }).then(([result]) => result);
}
/**
 * Converts a JavaScript Date object into MySQL DATE format (YYYY-MM-DD).
 *
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted date string for MySQL
 */
  static toMySqlDate(date) {
    const year  = date.toLocaleString("default", { year:  "numeric" });
    const month = date.toLocaleString("default", { month: "2-digit" });
    const day   = date.toLocaleString("default", { day:   "2-digit" });
    return [year, month, day].join("-");
  }
}
