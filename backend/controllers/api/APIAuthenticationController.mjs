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

import express   from "express";
import bcrypt    from "bcryptjs";
import validator from "validator";
import { UserModel } from "../../models/UserModel.mjs";

export class APIAuthenticationController {
  static middleware = express.Router();
  static routes     = express.Router();

  static {
    this.middleware.use(this.#APIAuthenticationProvider);
    this.routes.post("/authenticate",   this.handleAuthenticate);
    this.routes.delete("/authenticate", this.handleAuthenticate);
    this.routes.post("/register",       this.handleRegister);
  }

  /**
   * Middleware: reads x-auth-key header, looks up user, attaches to req.
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
   *                                    example: "a3f8c2d1-7b4e-4f9a-8c3d-2e1f5b6a9d0c"
   *                                id:
   *                                    type: integer
   *                                    example: 3
   *                                name:
   *                                    type: string
   *                                    example: "Alice Smith"
   *                                email:
   *                                    type: string
   *                                    example: "alice@gym.com"
   *                                role:
   *                                    type: string
   *                                    example: "member"
   *            '400':
   *                description: "Invalid credentials or missing fields"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Invalid credentials"
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Email or password is incorrect"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Failed to authenticate user"
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Database connection failed"]
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
   *                description: "Not authenticated - no valid auth key provided"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Please login to access the requested resources"
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Please authenticate to access this resource"]
   */
  static async handleAuthenticate(req, res) {
    if (req.method == "POST") {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            message: "Email and password are required.",
            errors: ["Both email and password must be provided"],
          });
        }
        if (!validator.isEmail(email)) {
          return res.status(400).json({
            message: "Invalid email format.",
            errors: ["Please provide a valid email address"],
          });
        }

        const user = await UserModel.findByEmail(email.toLowerCase().trim());
        if (!user) {
          return res.status(400).json({
            message: "Invalid credentials",
            errors: ["Email or password is incorrect"],
          });
        }
        if (user.status !== "active") {
          return res.status(403).json({
            message: "Account is inactive. Contact an admin.",
            errors: ["Account has been deactivated"],
          });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (passwordMatch) {
          const authenticationKey = crypto.randomUUID();
          await UserModel.setAuthKey(user.id, authenticationKey);
          return res.status(200).json({
            authenticationKey,
            id:    user.id,
            name:  user.name,
            email: user.email,
            role:  user.role,
          });
        } else {
          return res.status(400).json({
            message: "Invalid credentials",
            errors: ["Email or password is incorrect"],
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          message: "Failed to authenticate user",
          errors: [String(error)],
        });
      }
    } else if (req.method == "DELETE") {
      if (req.authenticatedUser) {
        await UserModel.setAuthKey(req.authenticatedUser.id, null);
        return res.status(200).json({ message: "Logged out successfully" });
      } else {
        return res.status(401).json({
          message: "Please login to access the requested resources",
          errors: ["Please authenticate to access this resource"],
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
   *                description: "Validation error - missing or invalid fields"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Name is required and must be at least 2 characters."
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Validation failed - check all required fields"]
   *            '409':
   *                description: "Email already registered"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "An account with this email already exists."
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Duplicate email - please use a different email address"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Registration failed. Please try again."
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Database error"]
   */
  static async handleRegister(req, res) {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
        errors: ["All required fields must be provided"],
      });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format.",
        errors: ["Please provide a valid email address"],
      });
    }
    if (!/^[a-zA-Z\-\' ]{2,}$/.test(name.trim())) {
      return res.status(400).json({
        message: "Invalid name.",
        errors: ["Name must be at least 2 characters and contain only letters"],
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
        errors: ["Password is too short"],
      });
    }

    try {
      const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({
          message: "An account with this email already exists.",
          errors: ["Duplicate email - please use a different email address"],
        });
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
      return res.status(500).json({
        message: "Registration failed. Please try again.",
        errors: [String(error)],
      });
    }
  }

  /**
   * Restrict routes by role.
   * @param {Array<"member"|"trainer"|"admin"> | "any"} allowedRoles
   */
  static restrict(allowedRoles) {
    return function (req, res, next) {
      if (req.authenticatedUser) {
        if (
          allowedRoles === "any" ||
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
