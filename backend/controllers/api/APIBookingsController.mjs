/**
 * APIBookingsController.mjs
 * POST   /api/bookings              - Create booking (member)
 * GET    /api/bookings?member_id=X  - List member bookings
 * DELETE /api/bookings/:id          - Cancel booking
 * GET    /api/bookings/xml          - Export bookings XML
 */
import express from "express";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { BookingModel }                from "../../models/BookingModel.mjs";
import { SessionModel }                from "../../models/SessionModel.mjs";

export class APIBookingsController {
  static routes = express.Router();

  static {
    // XML before /:id to avoid conflict
    this.routes.get("/xml",
      APIAuthenticationController.restrict(["member"]),
      APIBookingsController.getBookingsXML);

    this.routes.post("/",
      APIAuthenticationController.restrict(["member"]),
      APIBookingsController.createBooking);

    this.routes.get("/",
      APIAuthenticationController.restrict(["member", "admin"]),
      APIBookingsController.getBookings);

    this.routes.delete("/:id",
      APIAuthenticationController.restrict(["member", "admin"]),
      APIBookingsController.cancelBooking);
  }

  /**
   * @openapi
   * /api/bookings:
   *    post:
   *        summary: "Create a new booking"
   *        tags: [Bookings]
   *        security:
   *            - ApiKey: []
   *        requestBody:
   *            required: true
   *            content:
   *                application/json:
   *                    schema:
   *                        type: object
   *                        required:
   *                            - sessionId
   *                        properties:
   *                            sessionId:
   *                                type: integer
   *                                example: 1
   *        responses:
   *            '200':
   *                description: "Booking created"
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
   *                                    example: "Booking created"
   *            '400':
   *                description: "Missing sessionId"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "sessionId is required."
   *                            errors: ["Provide a valid session ID"]
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
   *                description: "Forbidden - not a member"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Access forbidden"
   *                            errors: ["Only members can create bookings"]
   *            '404':
   *                description: "Session not found"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Session not found."
   *                            errors: ["No session exists with that ID"]
   *            '409':
   *                description: "Conflict - already booked or session full"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "You have already booked this session."
   *                            errors: ["Duplicate booking or session at capacity"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to create booking"
   *                            errors: ["Database error"]
   */
  static async createBooking(req, res) {
    try {
      const memberId  = req.authenticatedUser.id;
      const sessionId = parseInt(req.body.sessionId);

      if (!sessionId) return res.status(400).json({ message: "sessionId is required.", errors: ["Provide a valid session ID"] });

      const session = await SessionModel.findById(sessionId);
      if (!session) return res.status(404).json({ message: "Session not found.", errors: ["No session exists with that ID"] });

      const existing = await BookingModel.findExisting(memberId, sessionId);
      if (existing) {
        if (existing.status === "confirmed")
          return res.status(409).json({ message: "You have already booked this session.", errors: ["Duplicate booking"] });
        await BookingModel.reactivate(existing.id);
        return res.status(200).json({ id: existing.id, message: "Booking reactivated" });
      }

      const booked = await BookingModel.countConfirmed(sessionId);
      if (booked >= session.max_participants)
        return res.status(409).json({ message: "Session is fully booked.", errors: ["Session at capacity"] });

      const conflict = await BookingModel.findUserBookingAtSameTime(memberId, session.date, session.time);
      if (conflict)
        return res.status(409).json({ message: "You already have a booking at this time.", errors: ["Time conflict"] });

      const insertId = await BookingModel.createBooking(memberId, sessionId, "confirmed");
      return res.status(200).json({ id: insertId, message: "Booking created" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to create booking", errors: [String(error)] });
    }
  }

  /**
   * @openapi
   * /api/bookings:
   *    get:
   *        summary: "Get member's bookings"
   *        tags: [Bookings]
   *        security:
   *            - ApiKey: []
   *        parameters:
   *            - name: member_id
   *              in: query
   *              required: true
   *              schema:
   *                  type: integer
   *                  example: 3
   *        responses:
   *            '200':
   *                description: "List of bookings"
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
   *                                    status:
   *                                        type: string
   *                                        example: "confirmed"
   *                                    sessionName:
   *                                        type: string
   *                                        example: "Morning Yoga"
   *                                    activityName:
   *                                        type: string
   *                                        example: "Yoga"
   *                                    sessionDate:
   *                                        type: string
   *                                        format: date
   *                                        example: "2026-06-15"
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
   *                description: "Forbidden - wrong member"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "You can only view your own bookings."
   *                            errors: ["Access forbidden"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to load bookings from database"
   *                            errors: ["Database error"]
   */
  static async getBookings(req, res) {
    const requestedMemberId = parseInt(req.query.member_id);
    const me = req.authenticatedUser;
    if (me.role === "member" && me.id !== requestedMemberId)
      return res.status(403).json({ message: "You can only view your own bookings.", errors: ["Access forbidden"] });
    try {
      const bookings = await BookingModel.listBookings({ userId: requestedMemberId });
      const data = bookings.map(b => ({
        id:              b.id,
        status:          b.status,
        createdAt:       b.created_at,
        sessionId:       b.session_id,
        sessionName:     b.session_name,
        sessionDate:     b.session_date,
        sessionTime:     b.session_time,
        activityName:    b.activity_name,
        locationName:    b.location_name,
        trainerName:     b.trainer_name,
        durationMinutes: b.duration_minutes,
      }));
      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to load bookings from database", errors: [String(error)] });
    }
  }

  /**
   * @openapi
   * /api/bookings/{id}:
   *    delete:
   *        summary: "Cancel a booking"
   *        tags: [Bookings]
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
   *                description: "Booking cancelled"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Booking cancelled"
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
   *                description: "Forbidden - not your booking"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "You can only cancel your own bookings."
   *                            errors: ["Access forbidden"]
   *            '404':
   *                description: "Booking not found"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Booking not found."
   *                            errors: ["No booking with that ID exists"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   *                        example:
   *                            message: "Failed to cancel booking"
   *                            errors: ["Database error"]
   */
  static async cancelBooking(req, res) {
    const bookingId = parseInt(req.params.id);
    const me        = req.authenticatedUser;
    try {
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found.", errors: ["No booking with that ID exists"] });
      if (me.role === "member" && booking.user_id !== me.id)
        return res.status(403).json({ message: "You can only cancel your own bookings.", errors: ["Access forbidden"] });
      await BookingModel.cancelBooking(bookingId);
      return res.status(200).json({ message: "Booking cancelled" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to cancel booking", errors: [String(error)] });
    }
  }

  /**
   * @openapi
   * /api/bookings/xml:
   *    get:
   *        summary: "Export member bookings as XML 1.0 with DTD"
   *        tags: [Bookings]
   *        security:
   *            - ApiKey: []
   *        responses:
   *            '200':
   *                description: "XML export of bookings with DTD and activity data"
   *                content:
   *                    text/xml:
   *                        schema:
   *                            type: string
   *                            example: "<?xml version='1.0'?><bookings>...</bookings>"
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
   *                            message: "Failed to export bookings as XML"
   *                            errors: ["Database error"]
   */
  static async getBookingsXML(req, res) {
    try {
      const memberId   = req.authenticatedUser.id;
      const memberName = req.authenticatedUser.name;
      const exportDate = new Date().toISOString().split("T")[0];

      const bookings = await BookingModel.query(
        `SELECT b.id, b.status, b.created_at,
          s.name AS session_name, s.date AS session_date,
          s.time AS session_time, s.duration_minutes,
          a.name AS activity_name, l.name AS location_name,
          u.name AS trainer_name
         FROM bookings b
         JOIN sessions s ON s.id = b.session_id
         LEFT JOIN activities a ON a.id = s.activity_id
         LEFT JOIN locations l ON l.id = s.location_id
         LEFT JOIN users u ON u.id = s.trainer_id
         WHERE b.user_id = ?
         ORDER BY s.date DESC`,
        [memberId]
      );

      // XML 1.0 with DTD (per feedback)
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml    += `<!-- Copyright (c) ${new Date().getFullYear()} High Street Gym. All rights reserved. -->\n`;
      xml    += `<!DOCTYPE bookings [\n`;
      xml    += `  <!ELEMENT bookings (booking*)>\n`;
      xml    += `  <!ATTLIST bookings exportDate CDATA #REQUIRED member CDATA #REQUIRED>\n`;
      xml    += `  <!ELEMENT booking (status, createdAt, session, activity, location, trainer)>\n`;
      xml    += `  <!ATTLIST booking id CDATA #REQUIRED>\n`;
      xml    += `  <!ELEMENT status (#PCDATA)>\n`;
      xml    += `  <!ELEMENT createdAt (#PCDATA)>\n`;
      xml    += `  <!ELEMENT session (name, date, time, durationMinutes)>\n`;
      xml    += `  <!ELEMENT name (#PCDATA)>\n`;
      xml    += `  <!ELEMENT date (#PCDATA)>\n`;
      xml    += `  <!ELEMENT time (#PCDATA)>\n`;
      xml    += `  <!ELEMENT durationMinutes (#PCDATA)>\n`;
      xml    += `  <!ELEMENT activity (#PCDATA)>\n`;
      xml    += `  <!ELEMENT location (#PCDATA)>\n`;
      xml    += `  <!ELEMENT trainer (#PCDATA)>\n`;
      xml    += `]>\n`;
      xml    += `<bookings exportDate="${exportDate}" member="${APIBookingsController.escapeXml(memberName)}">\n`;

      for (const b of bookings) {
        const d = b.session_date instanceof Date
          ? b.session_date.toISOString().split("T")[0]
          : String(b.session_date).split("T")[0];
        const ca = b.created_at instanceof Date
          ? b.created_at.toISOString().split("T")[0]
          : String(b.created_at).split("T")[0];
        xml += `  <booking id="${b.id}">\n`;
        xml += `    <status>${APIBookingsController.escapeXml(String(b.status))}</status>\n`;
        xml += `    <createdAt>${ca}</createdAt>\n`;
        xml += `    <session>\n`;
        xml += `      <name>${APIBookingsController.escapeXml(String(b.session_name||""))}</name>\n`;
        xml += `      <date>${d}</date>\n`;
        xml += `      <time>${b.session_time}</time>\n`;
        xml += `      <durationMinutes>${b.duration_minutes}</durationMinutes>\n`;
        xml += `    </session>\n`;
        xml += `    <activity>${APIBookingsController.escapeXml(String(b.activity_name||""))}</activity>\n`;
        xml += `    <location>${APIBookingsController.escapeXml(String(b.location_name||""))}</location>\n`;
        xml += `    <trainer>${APIBookingsController.escapeXml(String(b.trainer_name||""))}</trainer>\n`;
        xml += `  </booking>\n`;
      }
      xml += `</bookings>\n`;

      return res.status(200).contentType("text/xml")
        .set("Content-Disposition", 'attachment; filename="my-bookings.xml"')
        .send(xml);
    } catch (error) {
      console.error("XML export error:", error);
      return res.status(500).json({ message: "Failed to export bookings as XML", errors: [String(error)] });
    }
  }

  static escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
}
