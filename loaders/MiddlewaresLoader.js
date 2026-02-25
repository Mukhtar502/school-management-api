const loader = require("./_common/fileLoader");

/**
 * MIDDLEWARES LOADER
 * ==================
 * Dynamically loads all middleware files from the mws/ directory
 *
 * Middleware Naming Convention:
 * - Files must end with .mw.js (e.g., __token.mw.js, __device.mw.js)
 * - Multiple middlewares can be attached to a single route
 * - Middleware names starting with __ are standard built-in middlewares
 *
 * Middleware Execution Flow:
 * 1. Manager method parameters are scanned for __ prefixed names
 * 2. If found, middleware is injected into the route handler
 * 3. Middleware executes in order they appear in parameters
 * 4. Middleware can enrich request or return early with error response
 *
 * Available Middlewares:
 * - __token: JWT token verification and user authentication
 * - __device: Device identification and tracking
 * - __params: Request body/param validation
 * - __headers: Request header processing
 * - __files: File upload handling
 * - __query: Query parameter parsing
 * - __longToken: Long-lived token verification
 * - __shortToken: Short-lived token verification
 */
module.exports = class MiddlewareLoader {
  /**
   * Constructor
   * @param {object} injectable - Dependency injection container with config, managers, etc.
   */
  constructor(injectable) {
    this.mws = {}; // Will store loaded middleware functions
    this.injectable = injectable; // Dependencies passed to middleware
  }

  /**
   * Load all middleware files
   *
   * Process:
   * 1. Use fileLoader to recursively find all .mw.js files in mws/ directory
   * 2. For each middleware file, execute it as a function (factory pattern)
   * 3. Pass injectable dependencies to initialize middleware
   * 4. Store initialized middleware in repository
   *
   * @returns {object} Repository of initialized middleware functions
   *                   Format: { __token: Function, __device: Function, ... }
   */
  load() {
    // Load all middleware modules from mws/ directory recursively
    // fileLoader returns object with middleware factory functions
    const mws = loader("./mws/**/*.mw.js");

    // Initialize each middleware by calling it with injectable dependencies
    Object.keys(mws).forEach((middlewareName) => {
      // Each middleware is a factory function that returns the actual middleware
      // Factory receives: { meta, config, managers, cache, cortex, validators, etc. }
      // Returns: Function that can be called with { req, res, next }
      mws[middlewareName] = mws[middlewareName](this.injectable);
    });

    return mws; // Ready-to-use middleware repository
  }
};
