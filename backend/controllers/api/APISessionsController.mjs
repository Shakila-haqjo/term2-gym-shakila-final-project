/**
 * APISessionsController.mjs
 *
 * Mirrors coffee's APIProductsController.
 * Sessions = Products in the gym context.
 *
 * Routes (mounted at /api/sessions):
 *   GET /api/sessions              - All upcoming sessions (timetable) - public
 *   GET /api/sessions?trainer_id=X - Trainer's sessions
 *   GET /api/sessions/:id          - Single session details
 */

import express from "express";
import { SessionModel } from "../../models/SessionModel.mjs";

export class APISessionsController {
  static routes = express.Router();

  static {
    // GET /api/sessions  and  GET /api/sessions?trainer_id=X
    this.routes.get("/", this.getSessions);

    // GET /api/sessions/:id
    this.routes.get("/:id", this.getSessionById);
  }

  /**
   * GET /api/sessions
   * GET /api/sessions?trainer_id=3
   *
   * Mirrors coffee's getProducts. Returns upcoming sessions for the timetable.
   * If trainer_id provided, returns only that trainer's sessions.
   *
   * @openapi
   * /api/sessions:
   *    get:
   *        summary: "Get all upcoming sessions (timetable)"
   *        tags: [Sessions]
   *        parameters:
   *            - name: trainer_id
   *              in: query
   *              description: Filter by trainer ID
   *              required: false
   *              schema:
   *                  type: integer
   *                  example: 2
   *        responses:
   *            '200':
   *                description: "List of sessions"
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
   *                                    name:
   *                                        type: string
   *                                        example: "Morning Yoga"
   *                                    activityName:
   *                                        type: string
   *                                        example: "Yoga"
   *                                    trainerName:
   *                                        type: string
   *                                        example: "Sarah Johnson"
   *                                    date:
   *                                        type: string
   *                                        format: date
   *                                        example: "2026-06-15"
   *                                    time:
   *                                        type: string
   *                                        example: "09:00:00"
   *                                    locationName:
   *                                        type: string
   *                                        example: "Studio A"
   *                                    durationMinutes:
   *                                        type: integer
   *                                        example: 60
   *                                    maxParticipants:
   *                                        type: integer
   *                                        example: 20
   *                                    bookedCount:
   *                                        type: integer
   *                                        example: 5
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async getSessions(req, res) {
    try {
      const filters = { upcoming: true };
      if (req.query.trainer_id) {
        filters.trainerId = parseInt(req.query.trainer_id);
      }

      const sessions = await SessionModel.listSessions(filters);

      // Map to clean camelCase JSON - mirrors coffee's product mapping
      const data = sessions.map((s) => ({
        id:              s.id,
        name:            s.name,
        activityName:    s.activity_name,
        locationName:    s.location_name,
        locationAddress: s.location_address,
        trainerName:     s.trainer_name,
        date:            s.date,
        time:            s.time,
        durationMinutes: s.duration_minutes,
        maxParticipants: s.max_participants,
        bookedCount:     s.booked_count,
        description:     s.description,
      }));

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to load sessions from database",
        errors: [error],
      });
    }
  }

  /**
   * GET /api/sessions/:id
   * Mirrors coffee's getProductById.
   * Used by BookingCheckoutView to load session details.
   *
   * @openapi
   * /api/sessions/{id}:
   *    get:
   *        summary: "Get a specific session by ID"
   *        tags: [Sessions]
   *        parameters:
   *            - name: id
   *              in: path
   *              required: true
   *              schema:
   *                  type: integer
   *                  example: 1
   *        responses:
   *            '200':
   *                description: "Session details"
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
   *                                    example: "Morning Yoga"
   *                                activityName:
   *                                    type: string
   *                                    example: "Yoga"
   *                                trainerName:
   *                                    type: string
   *                                    example: "Sarah Johnson"
   *            '404':
   *                description: "Session not found"
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
   */
  static async getSessionById(req, res) {
    try {
      const session = await SessionModel.findById(parseInt(req.params.id));

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.status(200).json({
        id:              session.id,
        name:            session.name,
        activityName:    session.activity_name,
        locationName:    session.location_name,
        locationAddress: session.location_address,
        trainerName:     session.trainer_name,
        date:            session.date,
        time:            session.time,
        durationMinutes: session.duration_minutes,
        maxParticipants: session.max_participants,
        bookedCount:     session.booked_count,
        description:     session.description,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to load session from database",
        errors: [error],
      });
    }
  }
}
