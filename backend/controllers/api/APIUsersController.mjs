/**
 * APIUsersController.mjs
 * GET  /api/users/self  - get current user
 * PUT  /api/users/:id   - replace profile fields
 * PATCH /api/users/:id  - update single field
 */

import express  from "express";
import bcrypt   from "bcryptjs";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { UserModel }                   from "../../models/UserModel.mjs";

const ErrorSchema = { $ref: "#/components/schemas/Error" };

export class APIUsersController {
  static routes = express.Router();

  static {
    this.routes.get("/self",
      APIAuthenticationController.restrict(["member", "trainer", "admin"]),
      APIUsersController.getAuthenticatedUser);

     this.routes.put("/:id",
       APIAuthenticationController.restrict(["member", "trainer", "admin"]),
       APIUsersController.updateProfile);

    // PATCH — update a single field (new per feedback)
   this.routes.patch("/:id",
  APIAuthenticationController.restrict(["member", "trainer", "admin"]),
  APIUsersController.patchProfile);
  }

  /**
   * @openapi
   * /api/users/self:
   *    get:
   *        summary: "Get currently authenticated user"
   *        tags: [Users]
   *        security:
   *            - ApiKey: []
   *        responses:
   *            '200':
   *                description: "User data"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                id:
   *                                    type: integer
   *                                    example: 1
   *                                name:
   *                                    type: string
   *                                    example: "Alice Smith"
   *                                email:
   *                                    type: string
   *                                    example: "alice@gym.com"
   *                                role:
   *                                    type: string
   *                                    example: "member"
   *                                phone:
   *                                    type: string
   *                                    example: "0400000000"
   *            '401':
   *                description: "Not authenticated"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Not authenticated"
   *                            errors: ["Please authenticate to access this resource"]
   */
  static async getAuthenticatedUser(req, res) {
    res.status(200).json({
      id:                req.authenticatedUser.id,
      name:              req.authenticatedUser.name,
      email:             req.authenticatedUser.email,
      phone:             req.authenticatedUser.phone,
      address:           req.authenticatedUser.address,
      role:              req.authenticatedUser.role,
      avatar:            req.authenticatedUser.avatar,
      authenticationKey: req.authenticatedUser.authentication_key,
    });
  }

  /**
   * @openapi
   * /api/users/{id}:
   *    put:
   *        summary: "Replace all user profile fields"
   *        tags: [Users]
   *        security:
   *            - ApiKey: []
   *        parameters:
   *            - name: id
   *              in: path
   *              required: true
   *              schema:
   *                  type: integer
   *                  example: 1
   *        requestBody:
   *            required: true
   *            content:
   *                application/json:
   *                    schema:
   *                        type: object
   *                        properties:
   *                            name:
   *                                type: string
   *                                example: "Alice Updated"
   *                            phone:
   *                                type: string
   *                                example: "0411111111"
   *                            address:
   *                                type: string
   *                                example: "456 New St Brisbane"
   *        responses:
   *            '200':
   *                description: "Profile updated"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Profile updated successfully"
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
   *                description: "Forbidden - can only update own profile"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "You can only update your own profile."
   *                            errors: ["Access forbidden"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to update profile."
   *                            errors: ["Database error"]
   */
  static async updateProfile(req, res) {
    const targetId = parseInt(req.params.id);
    const me       = req.authenticatedUser;

    if (me.id !== targetId && me.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own profile.", errors: ["Access forbidden"] });
    }

    const { name, phone, address, password } = req.body;
    try {
      const fields = {};
      if (name    !== undefined) fields.name    = name.trim();
      if (phone   !== undefined) fields.phone   = phone || null;
      if (address !== undefined) fields.address = address || null;
      if (password)              fields.passwordHash = await bcrypt.hash(password, 10);
      await UserModel.updateUser(targetId, fields);
      return res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to update profile.", errors: [String(error)] });
    }
  }

  /**
   * @openapi
   * /api/users/{id}:
   *    patch:
   *        summary: "Update a single user profile field"
   *        tags: [Users]
   *        security:
   *            - ApiKey: []
   *        parameters:
   *            - name: id
   *              in: path
   *              required: true
   *              schema:
   *                  type: integer
   *                  example: 1
   *        requestBody:
   *            required: true
   *            content:
   *                application/json:
   *                    schema:
   *                        type: object
   *                        properties:
   *                            name:
   *                                type: string
   *                                example: "Alice Updated"
   *                            phone:
   *                                type: string
   *                                example: "0411111111"
   *                            address:
   *                                type: string
   *                                example: "456 New St Brisbane"
   *        responses:
   *            '200':
   *                description: "Field updated"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Profile field updated successfully"
   *            '400':
   *                description: "No valid field provided"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "No valid field provided for patch."
   *                            errors: ["Provide at least one field: name, phone, or address"]
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
   *                description: "Forbidden"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "You can only update your own profile."
   *                            errors: ["Access forbidden"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to patch profile."
   *                            errors: ["Database error"]
   */
  static async patchProfile(req, res) {
    const targetId = parseInt(req.params.id);
    const me       = req.authenticatedUser;

    if (me.id !== targetId && me.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own profile.", errors: ["Access forbidden"] });
    }

    const { name, phone, address } = req.body;
    const fields = {};
    if (name    !== undefined) fields.name    = name.trim();
    if (phone   !== undefined) fields.phone   = phone || null;
    if (address !== undefined) fields.address = address || null;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: "No valid field provided for patch.", errors: ["Provide at least one field: name, phone, or address"] });
    }

    try {
      await UserModel.updateUser(targetId, fields);
      return res.status(200).json({ message: "Profile field updated successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to patch profile.", errors: [String(error)] });
    }
  }
}
