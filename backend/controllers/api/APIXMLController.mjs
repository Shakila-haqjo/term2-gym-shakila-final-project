/**
 * APIXMLController.mjs
 *
 * XML export for trainer sessions.
 * Member bookings XML is handled in APIBookingsController GET /bookings/xml
 *
 * Routes (mounted at /api/xml):
 *   GET /api/xml/sessions  - Export trainer's sessions as XML 1.0
 */

import express from "express";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { SessionModel } from "../../models/SessionModel.mjs";

export class APIXMLController {
  static routes = express.Router();

  static {
    /**
     * GET /api/xml/sessions - trainer's sessions export
     */
    this.routes.get(
      "/sessions",
      APIAuthenticationController.restrict(["trainer", "admin"]),
      this.exportSessions,
    );
  }

  /**
   * GET /api/xml/sessions
   * Exports the authenticated trainer's sessions as XML 1.0.
   *
   * @openapi
   * /api/xml/sessions:
   *    get:
   *        summary: "Export trainer's sessions as XML 1.0"
   *        tags: [XML]
   *        security:
   *            - ApiKey: []
   *        responses:
   *            '200':
   *                description: "XML export of sessions"
   *                content:
   *                    text/xml:
   *                        schema:
   *                            type: string
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/Error"
   */
  static async exportSessions(req, res) {
    try {
      const trainerId  = req.authenticatedUser.id;
      const sessions   = await SessionModel.listSessions({ trainerId });
      const exportDate = new Date().toISOString().split("T")[0];

      // XML 1.0 - NOTE: only exporting, NOT importing
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml    += `<sessions exportDate="${exportDate}" trainer="${escapeXml(req.authenticatedUser.name)}">\n`;

      for (const s of sessions) {
        xml += `  <session id="${s.id}">\n`;
        xml += `    <name>${escapeXml(s.name)}</name>\n`;
        xml += `    <activity>${escapeXml(s.activity_name || "")}</activity>\n`;
        xml += `    <location>${escapeXml(s.location_name || "")}</location>\n`;
        xml += `    <date>${s.date}</date>\n`;
        xml += `    <time>${s.time}</time>\n`;
        xml += `    <durationMinutes>${s.duration_minutes}</durationMinutes>\n`;
        xml += `    <maxParticipants>${s.max_participants}</maxParticipants>\n`;
        xml += `    <bookedCount>${s.booked_count}</bookedCount>\n`;
        xml += `    <description>${escapeXml(s.description || "")}</description>\n`;
        xml += `  </session>\n`;
      }

      xml += `</sessions>\n`;

      res
        .status(200)
        .contentType("text/xml")
        .set("Content-Disposition", 'attachment; filename="my-sessions.xml"')
        .send(xml);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to export sessions as XML",
        errors: [String(error)],
      });
    }
  }
}

// XML 1.0 special character escaping
function escapeXml(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
}
