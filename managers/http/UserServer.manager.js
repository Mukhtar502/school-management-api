const http = require("http");
const express = require("express");
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerDocs = require("../../swagger.js");
const app = express();

/**
 * HTTP USER SERVER
 * ================
 * Sets up Express HTTP server and routes for the API
 *
 * Configuration:
 * - CORS enabled for cross-origin requests
 * - JSON body parser for request payloads
 * - Static file serving from public/
 * - Swagger API documentation at /api-docs
 *
 * Route Pattern:
 * Single unified endpoint: /api/:moduleName/:fnName
 * Examples:
 * - POST /api/user/registerUser
 * - POST /api/school/createSchool
 * - GET /api/school/getSchoolById?id=123
 *
 * All routes are handled by the userApi.mw middleware (API handler)
 */
module.exports = class UserServer {
  /**
   * Constructor - Initialize HTTP server with dependencies
   * @param {object} config - Application configuration
   * @param {object} managers - Loaded managers (apiHandler, etc.)
   */
  constructor({ config, managers }) {
    this.config = config;
    this.userApi = managers.userApi; // API handler that processes routes
  }

  /**
   * Register Express middleware
   * @param {object} args - Express middleware to register
   */
  use(args) {
    app.use(args);
  }

  /**
   * Start HTTP server and configure routes
   *
   * Server Setup Steps:
   * 1. Enable CORS to allow cross-origin requests
   * 2. Parse JSON and URL-encoded request bodies
   * 3. Serve static files from public/ directory
   * 4. Setup Swagger API documentation
   * 5. Register error handler middleware
   * 6. Register main API route handler
   * 7. Start listening on configured port
   */
  run() {
    // STEP 1: ENABLE CROSS-ORIGIN REQUESTS
    // ====================================
    // Allow requests from any origin (configurable for production)
    // Frontend running on different domain can make API calls
    app.use(cors({ origin: "*" }));

    // STEP 2: PARSE REQUEST BODIES
    // =============================
    // Parse JSON body (Content-Type: application/json)
    app.use(express.json());

    // Parse URL-encoded body (Content-Type: application/x-www-form-urlencoded)
    app.use(express.urlencoded({ extended: true }));

    // STEP 3: SERVE STATIC FILES
    // ============================
    // Static files in public/ directory accessible at /static
    // Examples: /static/countries.data.json, /static/emojis.data.json
    app.use("/static", express.static("public"));

    // STEP 4: SETUP SWAGGER API DOCUMENTATION
    // =======================================
    // Interactive API documentation at /api-docs
    // Users can test endpoints directly from Swagger UI
    app.use(
      "/api-docs",
      swaggerUI.serve,
      swaggerUI.setup(swaggerDocs, {
        swaggerOptions: {
          url: "/api-docs-json",
        },
      }),
    );

    // Endpoint to serve Swagger JSON spec to the UI
    app.get("/api-docs-json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerDocs);
    });

    // STEP 5: ERROR HANDLER MIDDLEWARE
    // ================================
    // Catches any unhandled errors and returns 500 response
    // Should be registered BEFORE main route handlers
    app.use((err, req, res, next) => {
      console.error("[UserServer] Unhandled error:", err.stack);
      res.status(500).send({
        ok: false,
        code: 500,
        errors: "Something broke!",
      });
    });

    // STEP 6: MAIN API ROUTE HANDLER
    // ==============================
    // Single unified endpoint for all API calls
    // Pattern: /api/:moduleName/:fnName
    //
    // The userApi.mw middleware:
    // 1. Extracts moduleName and fnName from URL
    // 2. Looks up the manager method
    // 3. Extracts request body/query parameters
    // 4. Injects middleware results (__token, __device, etc.)
    // 5. Calls the manager method with all parameters
    // 6. Returns standardized response
    app.all("/api/:moduleName/:fnName", this.userApi.mw);

    // STEP 7: START HTTP SERVER
    // =========================
    let server = http.createServer(app);
    server.listen(this.config.dotEnv.USER_PORT, () => {
      console.log("━".repeat(80));
      console.log(
        `\n✓ ${(this.config.dotEnv.SERVICE_NAME || "API").toUpperCase()} is running`,
      );
      console.log(
        `  📍 Host: http://localhost:${this.config.dotEnv.USER_PORT}`,
      );
      console.log(
        `  🔧 Environment: ${this.config.dotEnv.NODE_ENV || "production"}`,
      );
      console.log(`  ⏰ Started at: ${new Date().toLocaleString()}`);
      console.log("\n  📚 API Documentation: http://localhost:5111/api-docs");
      console.log("\n  Ready to accept requests...\n");
      console.log("━".repeat(80) + "\n");
    });

    server.on("error", (err) => {
      console.error("❌ Server error:", err.message);
      if (err.code === "EADDRINUSE") {
        console.error(
          `   Port ${this.config.dotEnv.USER_PORT} is already in use. Please use a different port or kill the process using this port.`,
        );
      }
      process.exit(1);
    });
  }
};
