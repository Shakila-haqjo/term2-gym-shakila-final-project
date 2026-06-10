/**
 * APIBookingsController.mjs
 *
 * Mirrors coffee's APIOrdersController.
 * Bookings = Orders in the gym context.
 *
 * Routes (mounted at /api/bookings):
 *   GET    /api/bookings/xml          - Export bookings XML (member only)
 *   POST   /api/bookings              - Create a booking (member only)
 *   GET    /api/bookings?member_id=X  - Member's own bookings
 *   DELETE /api/bookings/:id          - Cancel a booking
 */

import express from "express";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { BookingModel }                from "../../models/BookingModel.mjs";
import { SessionModel }                from "../../models/SessionModel.mjs";

export class APIBookingsController {
  static routes = express.Router();

  static {
    // GET /api/bookings/xml - MUST be registered BEFORE /:id to avoid conflict
    this.routes.get(
      "/xml",
      APIAuthenticationController.restrict(["member"]),
      APIBookingsController.getBookingsXML,
    );

    // POST /api/bookings - create booking (member only)
    this.routes.post(
      "/",
      APIAuthenticationController.restrict(["member"]),
      APIBookingsController.createBooking,
    );

    // GET /api/bookings?member_id=X - list member bookings
    this.routes.get(
      "/",
      APIAuthenticationController.restrict(["member", "admin"]),
      APIBookingsController.getBookings,
    );

    // DELETE /api/bookings/:id - cancel booking
    this.routes.delete(
      "/:id",
      APIAuthenticationController.restrict(["member", "admin"]),
      APIBookingsController.cancelBooking,
    );
  }

  /**
   * POST /api/bookings
   * Create a new booking. Mirrors coffee's createOrder exactly.
   */
  static async createBooking(req, res) {
    try {
      const memberId  = req.authenticatedUser.id;
      const sessionId = parseInt(req.body.sessionId);

      if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required." });
      }

      const session = await SessionModel.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found." });
      }

      // Check if already booked
      const existing = await BookingModel.findExisting(memberId, sessionId);
      if (existing) {
        if (existing.status === "confirmed") {
          return res.status(409).json({ message: "You have already booked this session." });
        }
        // Reactivate cancelled booking
        await BookingModel.reactivate(existing.id);
        return res.status(200).json({ id: existing.id, message: "Booking reactivated" });
      }

      // Check capacity
      const booked = await BookingModel.countConfirmed(sessionId);
      if (booked >= session.max_participants) {
        return res.status(409).json({ message: "Session is fully booked." });
      }

      // Check time conflict
      const conflict = await BookingModel.findUserBookingAtSameTime(
        memberId,
        session.date,
        session.time
      );
      if (conflict) {
        return res.status(409).json({ message: "You already have a booking at this time." });
      }

      const insertId = await BookingModel.createBooking(memberId, sessionId, "confirmed");
      return res.status(200).json({ id: insertId, message: "Booking created" });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to create booking",
        errors: [String(error)],
      });
    }
  }

  /**
   * GET /api/bookings?member_id=X
   * Get all bookings for a member.
   */
  static async getBookings(req, res) {
    const requestedMemberId = parseInt(req.query.member_id);
    const me = req.authenticatedUser;

    // Members can only see their own bookings
    if (me.role === "member" && me.id !== requestedMemberId) {
      return res.status(403).json({ message: "You can only view your own bookings." });
    }

    try {
      const bookings = await BookingModel.listBookings({ userId: requestedMemberId });
      const data = bookings.map((b) => ({
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
      return res.status(500).json({
        message: "Failed to load bookings from database",
        errors: [String(error)],
      });
    }
  }

  /**
   * DELETE /api/bookings/:id
   * Cancel a booking.
   */
  static async cancelBooking(req, res) {
    const bookingId = parseInt(req.params.id);
    const me        = req.authenticatedUser;

    try {
      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found." });
      }

      // Members can only cancel their own bookings
      if (me.role === "member" && booking.user_id !== me.id) {
        return res.status(403).json({ message: "You can only cancel your own bookings." });
      }

      await BookingModel.cancelBooking(bookingId);
      return res.status(200).json({ message: "Booking cancelled" });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to cancel booking",
        errors: [String(error)],
      });
    }
  }

  /**
   * GET /api/bookings/xml
   * Export member's bookings as XML 1.0.
   * Mirrors coffee's getOrdersXML exactly.
   */
  static async getBookingsXML(req, res) {
    try {
      const memberId   = req.authenticatedUser.id;
      const memberName = req.authenticatedUser.name;
      const exportDate = new Date().toISOString().split("T")[0];

      console.log("XML export for member ID:", memberId);

      const bookings = await BookingModel.query(
        `SELECT
          b.id,
          b.status,
          b.created_at,
          s.name          AS session_name,
          s.date          AS session_date,
          s.time          AS session_time,
          s.duration_minutes,
          a.name          AS activity_name,
          l.name          AS location_name,
          u.name          AS trainer_name
        FROM bookings b
        JOIN     sessions   s ON s.id = b.session_id
        LEFT JOIN activities a ON a.id = s.activity_id
        LEFT JOIN locations  l ON l.id = s.location_id
        LEFT JOIN users      u ON u.id = s.trainer_id
        WHERE b.user_id = ?
        ORDER BY s.date DESC`,
        [memberId]
      );

      console.log("Bookings found:", bookings.length);

      // Build XML 1.0 string
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += `<bookings exportDate="${exportDate}" member="${APIBookingsController.escapeXml(memberName)}">\n`;

      for (const b of bookings) {
        xml += `  <booking id="${b.id}">\n`;
        xml += `    <status>${APIBookingsController.escapeXml(String(b.status))}</status>\n`;
       xml += `    <createdAt>${b.created_at instanceof Date ? b.created_at.toISOString().split("T")[0] : b.created_at}</createdAt>\n`;
        xml += `    <session>\n`;
        xml += `      <name>${APIBookingsController.escapeXml(String(b.session_name || ""))}</name>\n`;
        xml += `      <date>${b.session_date instanceof Date ? b.session_date.toISOString().split("T")[0] : b.session_date}</date>\n`;     
        xml += `      <time>${b.session_time}</time>\n`;
        xml += `      <durationMinutes>${b.duration_minutes}</durationMinutes>\n`;
        xml += `    </session>\n`;
        xml += `    <activity>${APIBookingsController.escapeXml(String(b.activity_name || ""))}</activity>\n`;
        xml += `    <location>${APIBookingsController.escapeXml(String(b.location_name || ""))}</location>\n`;
        xml += `    <trainer>${APIBookingsController.escapeXml(String(b.trainer_name || ""))}</trainer>\n`;
        xml += `  </booking>\n`;
      }

      xml += '</bookings>\n';

      return res
        .status(200)
        .contentType("text/xml")
        .set("Content-Disposition", 'attachment; filename="my-bookings.xml"')
        .send(xml);

    } catch (error) {
      console.error("XML export error:", error);
      return res.status(500).json({
        message: "Failed to export bookings as XML",
        errors: [String(error)],
      });
    }
  }

  /**
   * Escapes special XML 1.0 characters to prevent malformed XML.
   * Defined as a static method so it is accessible within the class.
   */
  static escapeXml(str) {
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&apos;");
  }
}
