/**
 * Development Environment Configuration
 * ===========================================
 * This config is used during local development
 * Features: verbose logging, relaxed security, hot reload Support
 */

module.exports = {
  // Logging
  logging: {
    level: "debug", // Log level: error, warn, info, debug, trace
    colorize: true, // Pretty print logs with colors
    timestamp: true, // Add timestamp to logs
  },

  // Security (relaxed in dev)
  security: {
    corsOrigin: "*", // Allow all origins in dev
    rateLimitEnabled: true,
    maxRequestsPerMinute: 1000, // High limit for testing
  },

  // API Documentation
  api: {
    enableSwagger: true,
    swaggerPath: "/api-docs",
  },

  // Database
  database: {
    autoCreateIndexes: true, // Auto-create MongoDB indexes
    logQueries: true, // Log database queries
  },

  // JWT
  jwt: {
    algorithms: ["HS256"],
    issuer: "school-management-api-dev",
  },

  // Features
  features: {
    enableRateLimiting: true,
    enableCaching: true,
    enableCompression: true,
  },
};
