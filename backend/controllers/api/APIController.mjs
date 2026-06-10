/**
 * APIController.mjs
 *
 * Master router for all /api/* endpoints.
 * Mirrors the coffee project's APIController.mjs exactly.
 *
 * Routes registered under /api/:
 *   POST   /api/authenticate       - Login
 *   DELETE /api/authenticate       - Logout
 *   POST   /api/register           - Register
 *   GET    /api/users/self         - Get current user
 *   PUT    /api/users/:id          - Update profile
 *   GET    /api/sessions           - All sessions (timetable)
 *   GET    /api/sessions/:id       - Single session
 *   POST   /api/bookings           - Create booking
 *   GET    /api/bookings           - Member's bookings
 *   DELETE /api/bookings/:id       - Cancel booking
 *   GET    /api/bookings/xml       - Export bookings XML
 *   GET    /api/blogs              - All blog posts
 *   POST   /api/blogs              - Create blog post
 *   DELETE /api/blogs/:id          - Delete blog post
 *   GET    /api/xml/sessions       - Export sessions XML
 *   GET    /api/docs               - Swagger documentation page
 */

import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

import { APIAuthenticationController } from "./APIAuthenticationController.mjs";
import { APIUsersController }          from "./APIUsersController.mjs";
import { APISessionsController }       from "./APISessionsController.mjs";
import { APIBookingsController }       from "./APIBookingsController.mjs";
import { APIBlogsController }          from "./APIBlogsController.mjs";
import { APIXMLController }            from "./APIXMLController.mjs";

// Swagger/OpenAPI spec - mirrors coffee project options exactly
const options = {
  failOnErrors: true,
  definition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "High Street Gym API",
      description: "JSON REST API for the High Street Gym web application.",
    },
    components: {
      securitySchemes: {
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "x-auth-key",
        },
      },
    },
  },
  // Scans all API controller files for @openapi JSDoc comments
  apis: ["./backend/controllers/**/*.{js,mjs,yaml}", "./backend/components.yaml"],
};

const specification = swaggerJSDoc(options);

export class APIController {
  static routes = express.Router();

  static {
    // 1. Swagger docs page - mirrors coffee project exactly
    /**
     * @openapi
     * /api/docs:
     *    get:
     *        summary: "View API documentation"
     *        tags: [Documentation]
     *        responses:
     *            '200':
     *                description: "The documentation page"
     */
    this.routes.use("/docs", swaggerUI.serve, swaggerUI.setup(specification));

    // 2. Auth key middleware - checks x-auth-key header on every /api request
    //    Mirrors coffee project: APIAuthenticationController.middleware runs first
    this.routes.use(APIAuthenticationController.middleware);

    // 3. Auth routes (login / logout / register)
    this.routes.use(APIAuthenticationController.routes);

    // 4. Feature routes - mirrors coffee project's route registration pattern
    this.routes.use("/users",    APIUsersController.routes);
    this.routes.use("/sessions", APISessionsController.routes);
    this.routes.use("/bookings", APIBookingsController.routes);
    this.routes.use("/blogs",    APIBlogsController.routes);
    this.routes.use("/xml",      APIXMLController.routes);
  }
}
