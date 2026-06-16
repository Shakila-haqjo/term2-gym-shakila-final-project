/**
 * APIXMLController.mjs
 * GET /api/xml/sessions - trainer sessions export with DTD and copyright tag
 */
import express from "express";
import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { SessionModel }                from "../../models/SessionModel.mjs";

export class APIXMLController {
  static routes = express.Router();

  static {
    this.routes.get("/sessions",
      APIAuthenticationController.restrict(["trainer", "admin"]),
      APIXMLController.exportSessions);
  }

  /**
   * @openapi
   * /api/xml/sessions:
   *    get:
   *        summary: "Export trainer sessions as XML 1.0 with DTD and copyright tag"
   *        tags: [XML]
   *        security:
   *            - ApiKey: []
   *        responses:
   *            '200':
   *                description: "XML export of trainer sessions with DTD and copyright"
   *                content:
   *                    text/xml:
   *                        schema:
   *                            type: string
   *                        example: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<copyright>Copyright (c) 2026 High Street Gym. All rights reserved.</copyright>\n<!DOCTYPE sessions [\n  <!ELEMENT sessions (copyright, session*)>\n  <!ATTLIST sessions exportDate CDATA #REQUIRED trainer CDATA #REQUIRED>\n  <!ELEMENT session (name, activity, location, date, time, durationMinutes, maxParticipants, bookedCount, description)>\n  <!ATTLIST session id CDATA #REQUIRED>\n  <!ELEMENT name (#PCDATA)>\n  <!ELEMENT activity (#PCDATA)>\n  <!ELEMENT location (#PCDATA)>\n  <!ELEMENT date (#PCDATA)>\n  <!ELEMENT time (#PCDATA)>\n  <!ELEMENT durationMinutes (#PCDATA)>\n  <!ELEMENT maxParticipants (#PCDATA)>\n  <!ELEMENT bookedCount (#PCDATA)>\n  <!ELEMENT description (#PCDATA)>\n]>\n<sessions exportDate=\"2026-06-16\" trainer=\"Sarah Johnson\">\n  <session id=\"1\">\n    <name>Morning Yoga</name>\n    <activity>Yoga</activity>\n    <location>Studio A</location>\n    <date>2026-06-19</date>\n    <time>09:00:00</time>\n    <durationMinutes>60</durationMinutes>\n    <maxParticipants>20</maxParticipants>\n    <bookedCount>5</bookedCount>\n    <description>Relaxing morning yoga</description>\n  </session>\n</sessions>"
   *            '401':
   *                description: "Not authenticated"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Not authenticated"
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Please authenticate to access this resource"]
   *            '403':
   *                description: "Forbidden - not a trainer"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Access forbidden"
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Only trainers can export sessions"]
   *            '500':
   *                description: "Server error"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: "Failed to export sessions as XML"
   *                                errors:
   *                                    type: array
   *                                    items:
   *                                        type: string
   *                                    example: ["Database error"]
   */
  static async exportSessions(req, res) {
    try {
      const trainerId  = req.authenticatedUser.id;
      const sessions   = await SessionModel.listSessions({ trainerId });
      const exportDate = new Date().toISOString().split("T")[0];
      const year       = new Date().getFullYear();

      // XML 1.0 with DTD — copyright as XML tag (not comment)
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml    += `<!DOCTYPE sessions [\n`;
      xml    += `  <!ELEMENT sessions (copyright, session*)>\n`;
      xml    += `  <!ATTLIST sessions exportDate CDATA #REQUIRED trainer CDATA #REQUIRED>\n`;
      xml    += `  <!ELEMENT copyright (#PCDATA)>\n`;
      xml    += `  <!ELEMENT session (name, activity, location, date, time, durationMinutes, maxParticipants, bookedCount, description)>\n`;
      xml    += `  <!ATTLIST session id CDATA #REQUIRED>\n`;
      xml    += `  <!ELEMENT name (#PCDATA)>\n`;
      xml    += `  <!ELEMENT activity (#PCDATA)>\n`;
      xml    += `  <!ELEMENT location (#PCDATA)>\n`;
      xml    += `  <!ELEMENT date (#PCDATA)>\n`;
      xml    += `  <!ELEMENT time (#PCDATA)>\n`;
      xml    += `  <!ELEMENT durationMinutes (#PCDATA)>\n`;
      xml    += `  <!ELEMENT maxParticipants (#PCDATA)>\n`;
      xml    += `  <!ELEMENT bookedCount (#PCDATA)>\n`;
      xml    += `  <!ELEMENT description (#PCDATA)>\n`;
      xml    += `]>\n`;
      xml    += `<sessions exportDate="${exportDate}" trainer="${APIXMLController.escapeXml(req.authenticatedUser.name)}">\n`;
      xml    += `  <copyright>Copyright (c) ${year} High Street Gym. All rights reserved.</copyright>\n`;

      for (const s of sessions) {
        const d = s.date instanceof Date
          ? s.date.toISOString().split("T")[0]
          : String(s.date).split("T")[0];
        xml += `  <session id="${s.id}">\n`;
        xml += `    <name>${APIXMLController.escapeXml(s.name || "")}</name>\n`;
        xml += `    <activity>${APIXMLController.escapeXml(s.activity_name || "")}</activity>\n`;
        xml += `    <location>${APIXMLController.escapeXml(s.location_name || "")}</location>\n`;
        xml += `    <date>${d}</date>\n`;
        xml += `    <time>${s.time}</time>\n`;
        xml += `    <durationMinutes>${s.duration_minutes}</durationMinutes>\n`;
        xml += `    <maxParticipants>${s.max_participants}</maxParticipants>\n`;
        xml += `    <bookedCount>${s.booked_count}</bookedCount>\n`;
        xml += `    <description>${APIXMLController.escapeXml(s.description || "")}</description>\n`;
        xml += `  </session>\n`;
      }
      xml += `</sessions>\n`;

      return res.status(200).contentType("text/xml")
        .set("Content-Disposition", 'attachment; filename="my-sessions.xml"')
        .send(xml);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to export sessions as XML", errors: [String(error)] });
    }
  }

  static escapeXml(str) {
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&apos;");
  }
}
