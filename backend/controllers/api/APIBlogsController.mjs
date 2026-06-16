/**
 * APIBlogsController.mjs
 * GET    /api/blogs     - All published posts (public)
 * POST   /api/blogs     - Create post (member/trainer)
 * DELETE /api/blogs/:id - Delete post (own or admin)
 */
import express from "express";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { BlogModel }                   from "../../models/BlogModel.mjs";

export class APIBlogsController {
  static routes = express.Router();

  static {
    this.routes.get("/", APIBlogsController.getBlogs);
    this.routes.post("/",
      APIAuthenticationController.restrict(["member", "trainer", "admin"]),
      APIBlogsController.createBlog);
    this.routes.delete("/:id",
      APIAuthenticationController.restrict(["member", "trainer", "admin"]),
      APIBlogsController.deleteBlog);
  }

  /**
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
   *                                        example: "Today I ran 5km..."
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
   *                        example:
   *                            message: "Failed to load blog posts from database"
   *                            errors: ["Database error"]
   */
  static async getBlogs(req, res) {
    try {
      const blogs = await BlogModel.listBlogs({ publishedOnly: true });
      const data  = blogs.map(b => ({
        id:           b.id,
        title:        b.title,
        category:     b.category,
        content:      b.content,
        status:       b.status,
        views:        b.views,
        createdAt:    b.created_at,
        authorId:     b.author_id,
        authorName:   b.author_name,
        authorAvatar: b.author_avatar,
      }));
      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to load blog posts from database", errors: [String(error)] });
    }
  }

  /**
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
   *                                example: "Today I ran 5km for the first time!"
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
   *                        example:
   *                            message: "Title must be at least 3 characters."
   *                            errors: ["Validation failed"]
   *            '401':
   *                description: "Not authenticated"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Not authenticated"
   *                            errors: ["Please authenticate to access this resource"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to create blog post"
   *                            errors: ["Database error"]
   */
 static async createBlog(req, res) {
  const { title, content, category } = req.body;

  // Check for HTML tags — prevent XSS
  const htmlTagPattern = /<[^>]*>/g;
  if (!title || title.trim().length < 3)
    return res.status(400).json({ message: "Title must be at least 3 characters.", errors: ["Validation failed"] });
  if (htmlTagPattern.test(title))
    return res.status(400).json({ message: "Title cannot contain HTML tags or special characters.", errors: ["XSS not allowed"] });
  if (!content || content.trim().length < 10)
    return res.status(400).json({ message: "Content must be at least 10 characters.", errors: ["Validation failed"] });
  if (/<[^>]*>/g.test(content))
    return res.status(400).json({ message: "Content cannot contain HTML tags or special characters.", errors: ["XSS not allowed"] });

  // Sanitise — strip any remaining special chars
  const sanitise = (str) => str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  const cleanTitle    = sanitise(title.trim());
  const cleanContent  = sanitise(content.trim());
  const cleanCategory = category ? sanitise(category.trim()) : null;
   try {
      const insertId = await BlogModel.createBlog(
    req.authenticatedUser.id, cleanTitle, cleanCategory, cleanContent, null, "published"
  );
      return res.status(200).json({ id: insertId, message: "Blog post created" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to create blog post", errors: [String(error)] });
    }
  }

  /**
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
   *            '401':
   *                description: "Not authenticated"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Not authenticated"
   *                            errors: ["Please authenticate to access this resource"]
   *            '403':
   *                description: "Forbidden - not your post"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "You can only delete your own posts."
   *                            errors: ["Access forbidden"]
   *            '404':
   *                description: "Blog post not found"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Blog post not found."
   *                            errors: ["No post with that ID exists"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to delete blog post"
   *                            errors: ["Database error"]
   */
  static async deleteBlog(req, res) {
    const blogId = parseInt(req.params.id);
    const me     = req.authenticatedUser;
    try {
      const blog = await BlogModel.findRawById(blogId);
      if (!blog) return res.status(404).json({ message: "Blog post not found.", errors: ["No post with that ID exists"] });
      if (me.role !== "admin" && blog.author_id !== me.id)
        return res.status(403).json({ message: "You can only delete your own posts.", errors: ["Access forbidden"] });
      await BlogModel.deleteBlog(blogId);
      return res.status(200).json({ message: "Blog post deleted" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to delete blog post", errors: [String(error)] });
    }
  }
}
