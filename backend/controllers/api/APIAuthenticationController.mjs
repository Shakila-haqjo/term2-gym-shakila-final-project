/**
 * APIAuthenticationController.mjs
 *
 * Mirrors the coffee project's APIAuthenticationController.mjs EXACTLY.
 * Adapted for gym: uses email+password instead of username+password,
 * and uses UserModel instead of EmployeeModel.
 *
 * Routes:
 *   POST   /api/authenticate  - Login with email + password
 *   DELETE /api/authenticate  - Logout (clear auth key)
 *   POST   /api/register      - Register new member account
 */

import express from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import { UserModel } from "../../models/UserModel.mjs";

export class APIAuthenticationController {
  static middleware = express.Router();
  static routes = express.Router();

  static {
    // Middleware: checks x-auth-key header on every request (mirrors coffee)
    this.middleware.use(this.#APIAuthenticationProvider);

    // Routes - same structure as coffee project
    this.routes.post("/authenticate", this.handleAuthenticate);
    this.routes.delete("/authenticate", this.handleAuthenticate);
    this.routes.post("/register", this.handleRegister);
  }

  /**
   * Middleware: reads x-auth-key header, looks up user, attaches to req.
   * Mirrors coffee's #APIAuthenticationProvider exactly.
   * @private
   */
  static async #APIAuthenticationProvider(req, res, next) {
    const authenticationKey = req.headers["x-auth-key"];
    if (authenticationKey) {
      try {
        const user = await UserModel.findByAuthKey(authenticationKey);
        if (user) {
          req.authenticatedUser = user;
        } else {
          // Key not found - mirrors coffee's "not found" error
          return res.status(404).json({
            message: "Failed to authenticate - key not found",
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          message: "Failed to authenticate - database error",
        });
      }
    }
    next();
  }

  /**
   * POST /api/authenticate  - Login
   * DELETE /api/authenticate - Logout
   *
   * Mirrors coffee's handleAuthenticate method exactly.
   *
   * @openapi
   * /api/authenticate:
   *    post:
   *        summary: "Authenticate with email and password"
   *        tags: [Authentication]
   *        requestBody:
   *            required: true
   *            content:
   *                application/json:
   *                    schema:
   *                        type: object
   *                        required:
   *                            - email
   *                            - password
   *                        properties:
   *                            email:
   *                                type: string
   *                                format: email
   *                                example: "alice@gym.com"
   *                            password:
   *                                type: string
   *                                example: "member123"
   *        responses:
   *            '200':
   *                description: "Login successful"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                authenticationKey:
   *                                    type: string
   *                                    example: "uuid-here"
   *                                id:
   *                                    type: integer
   *                                    example: 1
   *                                name:
   *                                    type: string
   *                                    example: "Alice Smith"
   *                                role:
   *                                    type: string
   *                                    example: "member"
   *            '400':
   *                description: "Invalid credentials"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *    delete:
   *        summary: "Logout - clear authentication key"
   *        tags: [Authentication]
   *        security:
   *            - ApiKey: []
   *        responses:
   *            '200':
   *                description: "Logged out successfully"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Logged out successfully"
   *            '401':
   *                description: "Not authenticated"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async handleAuthenticate(req, res) {
    if (req.method == "POST") {
      // LOGIN - mirrors coffee's POST authenticate handler
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required." });
        }
        if (!validator.isEmail(email)) {
          return res.status(400).json({ message: "Invalid email format." });
        }

        const user = await UserModel.findByEmail(email.toLowerCase().trim());
        if (!user) {
          return res.status(400).json({ message: "Invalid credentials" });
        }
        if (user.status !== "active") {
          return res.status(403).json({ message: "Account is inactive. Contact an admin." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (passwordMatch) {
          // Generate UUID auth key - mirrors coffee project exactly
          const authenticationKey = crypto.randomUUID();
          await UserModel.setAuthKey(user.id, authenticationKey);

          res.status(200).json({
            authenticationKey,
            id:    user.id,
            name:  user.name,
            email: user.email,
            role:  user.role,
          });
        } else {
          res.status(400).json({ message: "Invalid credentials" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to authenticate user" });
      }
    } else if (req.method == "DELETE") {
      // LOGOUT - mirrors coffee's DELETE authenticate handler exactly
      if (req.authenticatedUser) {
        await UserModel.setAuthKey(req.authenticatedUser.id, null);
        res.status(200).json({ message: "Logged out successfully" });
      } else {
        res.status(401).json({
          message: "Please login to access the requested resources",
        });
      }
    }
  }

  /**
   * POST /api/register
   * Register a new member account.
   *
   * @openapi
   * /api/register:
   *    post:
   *        summary: "Register a new member account"
   *        tags: [Authentication]
   *        requestBody:
   *            required: true
   *            content:
   *                application/json:
   *                    schema:
   *                        type: object
   *                        required:
   *                            - name
   *                            - email
   *                            - password
   *                        properties:
   *                            name:
   *                                type: string
   *                                example: "Jane Smith"
   *                            email:
   *                                type: string
   *                                format: email
   *                                example: "jane@example.com"
   *                            password:
   *                                type: string
   *                                example: "password123"
   *                            phone:
   *                                type: string
   *                                example: "0400000000"
   *                            address:
   *                                type: string
   *                                example: "123 Gym St, Brisbane"
   *        responses:
   *            '200':
   *                description: "Registration successful"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                id:
   *                                    type: integer
   *                                    example: 5
   *                                message:
   *                                    type: string
   *                                    example: "Registration successful"
   *            '400':
   *                description: "Validation error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *            '409':
   *                description: "Email already registered"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async handleRegister(req, res) {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    if (!/^[a-zA-Z\-\' ]{2,}$/.test(name.trim())) {
      return res.status(400).json({ message: "Invalid name." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    try {
      const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "Email is already registered." });
      }

      const hash     = await bcrypt.hash(password, 10);
      const insertId = await UserModel.createUser(
        name.trim(),
        email.toLowerCase().trim(),
        hash,
        phone   || null,
        address || null,
        "member",
        "active",
      );

      return res.status(200).json({ id: insertId, message: "Registration successful" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Registration failed. Please try again." });
    }
  }

  /**
   * Restrict routes by role - mirrors coffee project exactly.
   * @param {Array<"member"|"trainer"|"admin"> | "any"} allowedRoles
   * @returns {express.RequestHandler}
   */
  static restrict(allowedRoles) {
    return function (req, res, next) {
      if (req.authenticatedUser) {
        if (
          allowedRoles == "any" ||
          allowedRoles.includes(req.authenticatedUser.role)
        ) {
          next();
        } else {
          res.status(403).json({
            message: "Access forbidden",
            errors: ["Role does not have access to the requested resource"],
          });
        }
      } else {
        res.status(401).json({
          message: "Not authenticated",
          errors: ["Please authenticate to access the requested resource"],
        });
      }
    };
  }
}
