/**
 * @module BlogModel
 * @description Database model for blog post operations.
 *              Handles creating, listing, updating, deleting, and view-counting of blog posts.
 */

import db from '../DatabaseModel.mjs';

/**
 * Reusable SELECT with JOIN for blog listings.
 * Includes the author's name and avatar.
 * @constant {string}
 */
const BLOG_SELECT = `
  SELECT b.*, u.name AS author_name, u.avatar AS author_avatar
  FROM blogs b
  JOIN users u ON u.id = b.author_id`;

/**
 * List blog posts with optional visibility and filter parameters.
 * @param {Object} [filters={}] - Optional filter parameters.
 * @param {string} [filters.status]    - 'published' or 'draft'.
 * @param {number} [filters.authorId]  - Restrict to a specific author.
 * @param {string} [filters.search]    - Substring match on title or category.
 * @param {string} [filters.category]  - Exact category match.
 * @param {boolean} [filters.publishedOnly] - If true, only return published posts.
 * @returns {Promise<Array<Object>>} Array of enriched blog rows.
 */
export async function listBlogs({ status, authorId, search, category, publishedOnly } = {}) {
  let sql = BLOG_SELECT + ' WHERE 1=1';
  const params = [];
  if (publishedOnly) { sql += " AND b.status = 'published'"; }
  if (status)        { sql += ' AND b.status = ?';    params.push(status); }
  if (authorId)      { sql += ' AND b.author_id = ?'; params.push(authorId); }
  if (search)        { sql += ' AND (b.title LIKE ? OR b.category LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (category)      { sql += ' AND b.category = ?';  params.push(category); }
  sql += ' ORDER BY b.created_at DESC';
  const [blogs] = await db.execute(sql, params);
  return blogs;
}

/**
 * Get a single enriched blog post by ID.
 * @param {number} id - Blog post ID.
 * @returns {Promise<Object|undefined>} Enriched blog row, or undefined if not found.
 */
export async function findById(id) {
  const [[blog]] = await db.execute(BLOG_SELECT + ' WHERE b.id = ?', [id]);
  return blog;
}

/**
 * Get the raw blog row (no join) by ID — used for ownership checks.
 * @param {number} id - Blog post ID.
 * @returns {Promise<Object|undefined>} Raw blog row, or undefined if not found.
 */
export async function findRawById(id) {
  const [[blog]] = await db.execute('SELECT * FROM blogs WHERE id = ?', [id]);
  return blog;
}

/**
 * Create a new blog post.
 * @param {number} authorId              - Author's user ID.
 * @param {string} title                 - Post title.
 * @param {string} category              - Post category.
 * @param {string} content               - Post content (HTML supported).
 * @param {string|null} featured_image   - Optional featured image URL.
 * @param {string} status                - 'published' or 'draft'.
 * @returns {Promise<number>} The insertId of the newly created blog post.
 */
export async function createBlog(authorId, title, category, content, featured_image, status) {
  const [result] = await db.execute(
    'INSERT INTO blogs (title, author_id, category, content, featured_image, status) VALUES (?, ?, ?, ?, ?, ?)',
    [title, authorId, category, content, featured_image, status]
  );
  return result.insertId;
}

/**
 * Update specified fields on a blog post.
 * @param {number} id      - Blog ID to update.
 * @param {Object} fields  - Fields to change (title, category, content, featured_image, status).
 * @returns {Promise<void>}
 */
export async function updateBlog(id, fields) {
  const allowed = ['title', 'category', 'content', 'featured_image', 'status'];
  const updates = [];
  const params  = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
  }
  if (updates.length === 0) return;
  params.push(id);
  await db.execute(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, params);
}

/**
 * Permanently delete a blog post.
 * @param {number} id - Blog ID to delete.
 * @returns {Promise<void>}
 */
export async function deleteBlog(id) {
  await db.execute('DELETE FROM blogs WHERE id = ?', [id]);
}

/**
 * Increment the view counter for a blog post.
 * @param {number} id - Blog ID to increment.
 * @returns {Promise<void>}
 */
export async function incrementViews(id) {
  await db.execute('UPDATE blogs SET views = views + 1 WHERE id = ?', [id]);
}

// =============================================================================
// Quick test — run: node models/BlogModel.mjs
// =============================================================================
// import { listBlogs, findById } from './BlogModel.mjs';
// const published = await listBlogs({ publishedOnly: true });
// console.log('Published blogs:', published.length);
// const blog = await findById(1);
// console.log('Blog #1:', blog?.title);
