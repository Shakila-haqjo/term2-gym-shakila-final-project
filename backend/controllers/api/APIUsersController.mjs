/**
 * APIUsersController.mjs
 *
 * Mirrors coffee's APIEmployeesController pattern.
 * GET /api/users/self  → coffee's GET /api/employees/self
 * PUT /api/users/:id   → update profile
 */

import express from "express";
import bcrypt from "bcryptjs";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { UserModel } from "../../models/UserModel.mjs";

export class APIUsersController {
  static routes = express.Router();

  static {
    /**
     * GET /api/users/self - mirrors coffee's GET /api/employees/self exactly
     * Used by React app on page reload to restore session from auth key
     */
    this.routes.get(
      "/self",
      APIAuthenticationController.restrict("any"),
      this.getAuthenticatedUser,
    );

    /**
     * PUT /api/users/:id - update own profile
     */
    this.routes.put(
      "/:id",
      APIAuthenticationController.restrict("any"),
      this.updateProfile,
    );
  }

  /**
   * GET /api/users/self
   * Returns the currently authenticated user's data.
   * Mirrors coffee's getAuthenticatedEmployee exactly.
   *
   * @openapi
   * /api/users/self:
   *    get:
   *        summary: "Get currently authenticated user by auth key"
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
   */
  static async getAuthenticatedUser(req, res) {
    // Return authenticated user - mirrors coffee's pattern exactly
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
   * PUT /api/users/:id
   * Update the authenticated user's profile.
   *
   * @openapi
   * /api/users/{id}:
   *    put:
   *        summary: "Update user profile"
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
   *                                example: "Jane Updated"
   *                            phone:
   *                                type: string
   *                                example: "0400111222"
   *                            address:
   *                                type: string
   *                                example: "456 New St"
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
   *            '403':
   *                description: "Forbidden"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async updateProfile(req, res) {
    const targetId = parseInt(req.params.id);
    const me       = req.authenticatedUser;

    // Only own profile (unless admin) - same security as coffee
    if (me.id !== targetId && me.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own profile." });
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
      return res.status(500).json({ message: "Failed to update profile." });
    }
  }
}
