/**
 * Production Environment Configuration
 * ===========================================
 * This config is used in production deployment
 * Focus: Security, Performance, Monitoring
 */

module.exports = {
  // Logging (minimal to save resources)
  logging: {
    level: "error", // Only log errors in production
    colorize: false, // Plain text for log aggregation services
    timestamp: true,
  },

  // Security (strict in production)
  security: {
    corsOrigin: process.env.ALLOWED_ORIGINS || "https://yourdomain.com",
    rateLimitEnabled: true,
    maxRequestsPerMinute: 60, // Strict rate limiting
    enableHelmet: true, // Security headers (HSTS, X-Frame-Options, etc.)
    enableHSTS: true, // Force HTTPS
  },

  // API Documentation
  api: {
    enableSwagger: false, // Disable docs in production
    swaggerPath: "/api-docs",
  },

  // Database
  database: {
    autoCreateIndexes: false, // Indexes pre-created in production
    logQueries: false,
    connectionPoolSize: 50,
  },

  // JWT
  jwt: {
    algorithms: ["HS256"],
    issuer: "school-management-api",
  },

  // Features
  features: {
    enableRateLimiting: true,
    enableCaching: true,
    enableCompression: true,
    cacheExpiration: 3600, // 1 hour cache
  },
};
