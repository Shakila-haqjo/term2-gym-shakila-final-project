import { DatabaseModel } from './DatabaseModel.mjs';

const BLOG_SELECT = `
  SELECT b.*, u.name AS author_name, u.avatar AS author_avatar
  FROM blogs b
  JOIN users u ON u.id = b.author_id`;

export class BlogModel extends DatabaseModel {

  static async listBlogs({ status, authorId, search, category, publishedOnly } = {}) {
    let sql = BLOG_SELECT + ' WHERE 1=1';
    const params = [];
    if (publishedOnly) { sql += " AND b.status = 'published'"; }
    if (status)        { sql += ' AND b.status = ?';    params.push(status); }
    if (authorId)      { sql += ' AND b.author_id = ?'; params.push(authorId); }
    if (search)        { sql += ' AND (b.title LIKE ? OR b.category LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category)      { sql += ' AND b.category = ?';  params.push(category); }
    sql += ' ORDER BY b.created_at DESC';
    const [blogs] = await this.execute(sql, params);
    return blogs;
  }

  static async findById(id) {
    const [[blog]] = await this.execute(BLOG_SELECT + ' WHERE b.id = ?', [id]);
    return blog;
  }

  static async findRawById(id) {
    const [[blog]] = await this.execute('SELECT * FROM blogs WHERE id = ?', [id]);
    return blog;
  }

  static async createBlog(authorId, title, category, content, featured_image, status) {
    const [result] = await this.execute(
      'INSERT INTO blogs (title, author_id, category, content, featured_image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, authorId, category, content, featured_image, status]
    );
    return result.insertId;
  }

  static async updateBlog(id, fields) {
    const allowed = ['title', 'category', 'content', 'featured_image', 'status'];
    const updates = [];
    const params  = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
    }
    if (updates.length === 0) return;
    params.push(id);
    await this.execute(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  static async deleteBlog(id) {
    await this.execute('DELETE FROM blogs WHERE id = ?', [id]);
  }

  static async incrementViews(id) {
    await this.execute('UPDATE blogs SET views = views + 1 WHERE id = ?', [id]);
  }
}
