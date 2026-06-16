/**
 * APISessionsController.mjs
 * GET    /api/sessions              - All upcoming sessions (public)
 * GET    /api/sessions?trainer_id=X - Trainer's sessions
 * GET    /api/sessions/:id          - Single session
 * DELETE /api/sessions/:id          - Cancel session (trainer only)
 */
import express from "express";
import { SessionModel }                from "../../models/SessionModel.mjs";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";

export class APISessionsController {
  static routes = express.Router();

  static {
    this.routes.get("/",   APISessionsController.getSessions);
    this.routes.get("/:id", APISessionsController.getSessionById);
    this.routes.delete("/:id",
      APIAuthenticationController.restrict(["trainer", "admin"]),
      APISessionsController.cancelSession);
  }

  /**
   * @openapi
   * /api/sessions:
   *    get:
   *        summary: "Get all upcoming sessions (timetable)"
   *        tags: [Sessions]
   *        parameters:
   *            - name: trainer_id
   *              in: query
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
   *                                    trainerId:
   *                                        type: integer
   *                                        example: 6
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
   *                        example:
   *                            message: "Failed to load sessions from database"
   *                            errors: ["Database error"]
   */
  static async getSessions(req, res) {
    try {
      const filters = { upcoming: true };
      if (req.query.trainer_id) filters.trainerId = parseInt(req.query.trainer_id);
      const sessions = await SessionModel.listSessions(filters);
      const data = sessions.map(s => ({
        id:              s.id,
        name:            s.name,
        activityName:    s.activity_name,
        locationName:    s.location_name,
        locationAddress: s.location_address,
        trainerName:     s.trainer_name,
        trainerId:       s.trainer_id,
        date:            s.date,
        time:            s.time,
        durationMinutes: s.duration_minutes,
        maxParticipants: s.max_participants,
        bookedCount:     s.booked_count,
        description:     s.description,
      }));
      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to load sessions from database", errors: [String(error)] });
    }
  }

  /**
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
   *                                trainerId:
   *                                    type: integer
   *                                    example: 6
   *            '404':
   *                description: "Session not found"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Session not found"
   *                            errors: ["No session exists with that ID"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to load session from database"
   *                            errors: ["Database error"]
   */
  static async getSessionById(req, res) {
    try {
      const session = await SessionModel.findById(parseInt(req.params.id));
      if (!session) return res.status(404).json({ message: "Session not found", errors: ["No session exists with that ID"] });
      return res.status(200).json({
        id:              session.id,
        name:            session.name,
        activityName:    session.activity_name,
        locationName:    session.location_name,
        locationAddress: session.location_address,
        trainerName:     session.trainer_name,
        trainerId:       session.trainer_id,
        date:            session.date,
        time:            session.time,
        durationMinutes: session.duration_minutes,
        maxParticipants: session.max_participants,
        bookedCount:     session.booked_count,
        description:     session.description,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to load session from database", errors: [String(error)] });
    }
  }

  /**
   * @openapi
   * /api/sessions/{id}:
   *    delete:
   *        summary: "Cancel a trainer session"
   *        tags: [Sessions]
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
   *                description: "Session cancelled"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Session cancelled"
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
   *                description: "Forbidden - not your session"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "You can only cancel your own sessions."
   *                            errors: ["Access forbidden"]
   *            '404':
   *                description: "Session not found"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Session not found."
   *                            errors: ["No session exists with that ID"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to cancel session"
   *                            errors: ["Database error"]
   */
  static async cancelSession(req, res) {
    try {
      const sessionId = parseInt(req.params.id);
      const me        = req.authenticatedUser;
      const session   = await SessionModel.findById(sessionId);
      if (!session) return res.status(404).json({ message: "Session not found.", errors: ["No session exists with that ID"] });
      if (me.role === "trainer" && session.trainer_id !== me.id)
        return res.status(403).json({ message: "You can only cancel your own sessions.", errors: ["Access forbidden"] });
      await SessionModel.cancelSession(sessionId);
      return res.status(200).json({ message: "Session cancelled" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to cancel session", errors: [String(error)] });
    }
  }
}
