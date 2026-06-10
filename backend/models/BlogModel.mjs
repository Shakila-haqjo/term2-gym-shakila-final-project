import { DatabaseModel } from './DatabaseModel.mjs';

const BLOG_SELECT = `
  SELECT b.*, u.name AS author_name, u.avatar AS author_avatar
  FROM blogs b
  JOIN users u ON u.id = b.author_id`;
/**
 * BlogModel
 *
 * Handles all database operations related to blog posts.
 *
 * Provides methods to:
 * - Retrieve blog posts with filtering options
 * - Retrieve single blog post (with or without joins)
 * - Create, update, and delete blog posts
 * - Increment blog post view count
 *
 * Extends DatabaseModel to execute SQL queries.
 *
 * @class BlogModel
 * @extends DatabaseModel
 */

export class BlogModel extends DatabaseModel {
/**
 * Retrieves blog posts with optional filtering.
 *
 * Supports filtering by:
 * - status
 * - author ID
 * - search keyword (title/category)
 * - category
 * - published-only flag
 *
 * @async
 * @param {Object} [options={}] - Filter options
 * @param {string} [options.status] - Blog status (e.g., 'published', 'draft')
 * @param {number} [options.authorId] - Author ID
 * @param {string} [options.search] - Search keyword
 * 
 * @param {boolean} [options.publishedOnly] - Whether to return only published blogs
 * @returns {Promise<Array<Object>>} List of blog posts
 */

  static async listBlogs({ status, authorId, search, category, publishedOnly } = {}) {
    let sql = BLOG_SELECT + ' WHERE 1=1';
    const params = [];
    if (publishedOnly) { sql += " AND b.status = 'published'"; }
    if (status)        { sql += ' AND b.status = ?';    params.push(status); }
    if (authorId)      { sql += ' AND b.author_id = ?'; params.push(authorId); }
    if (search)        { sql += ' AND (b.title LIKE ? OR b.category LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category)      { sql += ' AND b.category = ?';  params.push(category); }
    sql += ' ORDER BY b.created_at DESC';
    return await this.query(sql, params);
  }
/**
 * Finds a blog post by ID including author details.
 *
 * @async
 * @param {number} id - Blog ID
 * @returns {Promise<Object|undefined>} Blog object or undefined if not found
 */

  static async findById(id) {
    const rows = await this.query(BLOG_SELECT + ' WHERE b.id = ?', [id]);
    return rows[0];
  }

  static async findRawById(id) {
    const rows = await this.query('SELECT * FROM blogs WHERE id = ?', [id]);
    return rows[0];
  }
/**
 * Creates a new blog post.
 *
 * @async
 * @param {number} authorId - ID of the author
 * @param {string} title - Blog title
 * @param {string|null} category - Blog category
 * @param {string|null} content - Blog content
 * @param {string|null} featured_image - Featured image URL/path
 * @param {string} status - Blog status ('published' or 'draft')
 * @returns {Promise<number>} ID of the newly created blog
 */

  static async createBlog(authorId, title, category, content, featured_image, status) {
    const result = await this.query(
      'INSERT INTO blogs (title, author_id, category, content, featured_image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, authorId, category, content, featured_image, status]
    );
    return result.insertId;
  }
/**
 * Updates a blog post with given fields.
 *
 * Only allows updating specific fields:
 * - title
 * - category
 * - content
 * - featured_image
 * - status
 *
 * @async
 * @param {number} id - Blog ID
 * @param {Object} fields - Fields to update
 * @returns {Promise<void>}
 */

  static async updateBlog(id, fields) {
    const allowed = ['title', 'category', 'content', 'featured_image', 'status'];
    const updates = [];
    const params  = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
    }
    if (updates.length === 0) return;
    params.push(id);
    await this.query(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, params);
  }
/**
 * Deletes a blog post from the database.
 *
 * @async
 * @param {number} id - Blog ID
 * @returns {Promise<void>}
 */

  static async deleteBlog(id) {
    await this.query('DELETE FROM blogs WHERE id = ?', [id]);
  }
/**
 * Increments the view count of a blog post.
 *
 * @async
 * @param {number} id - Blog ID
 * @returns {Promise<void>}
 */

  static async incrementViews(id) {
    await this.query('UPDATE blogs SET views = views + 1 WHERE id = ?', [id]);
  }

  static async getStats() {
  const rows = await this.query(`
    SELECT 
      COUNT(*) AS total,
      COALESCE(SUM(status = 'published'), 0) AS published,
      COALESCE(SUM(status = 'draft'), 0) AS draft
    FROM blogs
  `);

  return {
    total: rows[0]?.total || 0,
    published: rows[0]?.published || 0,
    draft: rows[0]?.draft || 0
  };
}
}
