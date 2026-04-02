import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DatabaseModel {
  static connection;

  static {
    this.connection = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'gym_fitness_db_shakila',
      waitForConnections: true,
      connectionLimit:    10,
      dateStrings:        true,   // return DATE/DATETIME as strings, no timezone shift
    });
  }

  // Returns [rows, fields] — for [[row]] = await X.execute(...) destructuring in models
  static execute(sql, params = []) {
    return this.connection.execute(sql, params);
  }

  // Returns rows array directly
  static async query(sql, params = []) {
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }

  static getConnection() {
    return this.connection.getConnection();
  }

  // ── Schema init ─────────────────────────────────────────────────────────────

  static async initialize() {
    const conn = await DatabaseModel.getConnection();
    try {
      for (const stmt of DatabaseModel.#readSchema()) {
        await conn.execute(stmt);
      }
      console.log('Database schema ready.');
    } finally {
      conn.release();
    }
  }

  static #readSchema() {
    const sql = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');
    const start = sql.indexOf('-- [SCHEMA:START]');
    const end   = sql.indexOf('-- [SCHEMA:END]');
    if (start === -1 || end === -1) throw new Error('Schema markers not found in database.sql');
    return sql
      .slice(start + '-- [SCHEMA:START]'.length, end)
      .split(';')
      .map(s => s.replace(/--.*$/gm, '').trim())
      .filter(s => s.length > 0);
  }
}
