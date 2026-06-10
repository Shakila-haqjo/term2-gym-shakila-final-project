/**
 * APIBlogsController.mjs
 *
 * REST API endpoints for blog posts.
 *
 * Routes (mounted at /api/blogs):
 *   GET    /api/blogs      - All published posts (public)
 *   POST   /api/blogs      - Create a post (member/trainer)
 *   DELETE /api/blogs/:id  - Delete a post (own or admin)
 */

import express from "express";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { BlogModel } from "../../models/BlogModel.mjs";

export class APIBlogsController {
  static routes = express.Router();

  static {
    // GET /api/blogs - public (no auth required per use case diagram)
    this.routes.get("/", this.getBlogs);

    // POST /api/blogs - member or trainer only
    this.routes.post(
      "/",
      APIAuthenticationController.restrict(["member", "trainer", "admin"]),
      this.createBlog,
    );

    // DELETE /api/blogs/:id
    this.routes.delete(
      "/:id",
      APIAuthenticationController.restrict(["member", "trainer", "admin"]),
      this.deleteBlog,
    );
  }

  /**
   * GET /api/blogs
   * Returns all published blog posts, newest first.
   *
   * @openapi
   * /api/blogs:
   *    get:
   *        summary: "Get all published blog posts"
   *        tags: [Blogs]
   *        responses:
   *            '200':
   *                description: "List of blog posts"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: array
   *                            items:
   *                                type: object
   *                                properties:
   *                                    id:
   *                                        type: integer
   *                                        example: 1
   *                                    title:
   *                                        type: string
   *                                        example: "My Fitness Journey"
   *                                    content:
   *                                        type: string
   *                                    category:
   *                                        type: string
   *                                        example: "Fitness Tips"
   *                                    authorName:
   *                                        type: string
   *                                        example: "Alice Smith"
   *                                    createdAt:
   *                                        type: string
   *                                        format: date-time
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async getBlogs(req, res) {
    try {
      const blogs = await BlogModel.listBlogs({ publishedOnly: true });
      const data  = blogs.map((b) => ({
        id:          b.id,
        title:       b.title,
        category:    b.category,
        content:     b.content,
        status:      b.status,
        views:       b.views,
        createdAt:   b.created_at,
        authorId:    b.author_id,
        authorName:  b.author_name,
        authorAvatar: b.author_avatar,
      }));
      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to load blog posts from database",
        errors: [String(error)],
      });
    }
  }

  /**
   * POST /api/blogs
   * Create a new blog post.
   *
   * @openapi
   * /api/blogs:
   *    post:
   *        summary: "Create a new blog post"
   *        tags: [Blogs]
   *        security:
   *            - ApiKey: []
   *        requestBody:
   *            required: true
   *            content:
   *                application/json:
   *                    schema:
   *                        type: object
   *                        required:
   *                            - title
   *                            - content
   *                        properties:
   *                            title:
   *                                type: string
   *                                example: "My Fitness Journey"
   *                            content:
   *                                type: string
   *                                example: "Today I ran 5km..."
   *                            category:
   *                                type: string
   *                                example: "Fitness Tips"
   *        responses:
   *            '200':
   *                description: "Blog post created"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                id:
   *                                    type: integer
   *                                    example: 3
   *                                message:
   *                                    type: string
   *                                    example: "Blog post created"
   *            '400':
   *                description: "Validation error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async createBlog(req, res) {
    const { title, content, category } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: "Title must be at least 3 characters." });
    }
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ message: "Content must be at least 10 characters." });
    }

    try {
      const insertId = await BlogModel.createBlog(
        req.authenticatedUser.id,
        title.trim(),
        category || null,
        content.trim(),
        null,
        "published",
      );
      res.status(200).json({ id: insertId, message: "Blog post created" });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to create blog post",
        errors: [String(error)],
      });
    }
  }

  /**
   * DELETE /api/blogs/:id
   * Delete a blog post.
   *
   * @openapi
   * /api/blogs/{id}:
   *    delete:
   *        summary: "Delete a blog post"
   *        tags: [Blogs]
   *        security:
   *            - ApiKey: []
   *        parameters:
   *            - name: id
   *              in: path
   *              required: true
   *              schema:
   *                  type: integer
   *                  example: 1
   *        responses:
   *            '200':
   *                description: "Blog post deleted"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Blog post deleted"
   *            '403':
   *                description: "Forbidden - not your post"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *            '404':
   *                description: "Blog post not found"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async deleteBlog(req, res) {
    const blogId = parseInt(req.params.id);
    const me     = req.authenticatedUser;

    try {
      const blog = await BlogModel.findRawById(blogId);
      if (!blog) {
        return res.status(404).json({ message: "Blog post not found." });
      }

      // Members/trainers can only delete their own posts; admin can delete any
      if (me.role !== "admin" && blog.author_id !== me.id) {
        return res.status(403).json({ message: "You can only delete your own posts." });
      }

      await BlogModel.deleteBlog(blogId);
      res.status(200).json({ message: "Blog post deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to delete blog post",
        errors: [String(error)],
      });
    }
  }
}
