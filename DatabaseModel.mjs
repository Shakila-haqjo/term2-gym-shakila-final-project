import mysql from 'mysql2/promise';

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'gym_fitness_db_shakila',
      waitForConnections: true,
      connectionLimit:    10,
    });
  }

  // Execute a parameterized query — returns [rows, fields] (compatible with all model files)
  execute(sql, params = []) {
    return this.pool.execute(sql, params);
  }

  // Get a raw connection from the pool (used for transactions / schema init)
  getConnection() {
    return this.pool.getConnection();
  }

  // Convenience helper that returns the rows array directly
  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }
}

const db = new Database();
export default db;
