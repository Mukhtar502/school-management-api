/**
 * RESPONSE DISPATCHER
 * ===================
 * Standardizes all API response formats across the entire application
 *
 * Ensures consistency in:
 * - HTTP status codes
 * - Response JSON structure
 * - Error message formatting
 * - Timestamp tracking
 *
 * Standard Response Format:
 * {
 *   "ok": true/false,
 *   "code": 200 (HTTP status),
 *   "data": { ... } (response payload),
 *   "timestamp": "2026-02-25T12:00:00.000Z",
 *   "errors": [ { "message": "...", "field": "..." } ], (optional)
 *   "message": "..." (optional)
 * }
 *
 * This ensures clients can reliably parse responses regardless of endpoint
 */
module.exports = class ResponseDispatcher {
  constructor() {
    this.key = "responseDispatcher";
  }

  /**
   * Dispatch a standardized response to the HTTP response object
   *
   * @param {object} res - Express response object
   * @param {object} params - Response parameters object
   *   @param {boolean} ok - Success indicator (true/false)
   *   @param {number} code - HTTP status code (optional, auto-determined if not provided)
   *   @param {object} data - Response data/payload (optional)
   *   @param {string|array|object} errors - Error details (optional)
   *   @param {string} message - Human-readable message (optional)
   *   @param {string} msg - Alias for message (optional)
   *
   * Status Code Logic:
   * - 200: Success (ok === true)
   * - 400: Client error default (ok === false, no code provided)
   * - Custom: Use provided code parameter
   *
   * Error Normalization:
   * - String errors → { message: string }
   * - Array errors → Map each to consistent format
   * - Object errors → Pass through as-is for field-level errors
   *
   * Example Responses:
   * Success:
   * {
   *   "ok": true,
   *   "code": 200,
   *   "data": { "user": { "id": "123", "email": "user@test.com" } },
   *   "timestamp": "2026-02-25T12:00:00.000Z"
   * }
   *
   * Error with validation failures:
   * {
   *   "ok": false,
   *   "code": 400,
   *   "errors": [
   *     { "field": "email", "message": "Invalid email format" },
   *     { "field": "password", "message": "Must be at least 8 characters" }
   *   ],
   *   "timestamp": "2026-02-25T12:00:00.000Z"
   * }
   *
   * Authentication error:
   * {
   *   "ok": false,
   *   "code": 401,
   *   "errors": [{ "message": "Invalid token" }],
   *   "timestamp": "2026-02-25T12:00:00.000Z"
   * }
   */
  dispatch(res, { ok, data, code, errors, message, msg }) {
    // STEP 1: DETERMINE HTTP STATUS CODE
    // ==================================
    let statusCode = code ? code : ok == true ? 200 : 400;
    // Logic: If code provided, use it. Otherwise: true→200, false→400

    // STEP 2: NORMALIZE ERRORS TO CONSISTENT FORMAT
    // ==============================================
    // Clients expect errors to always be an array of error objects
    let errorArray = [];
    if (errors) {
      if (typeof errors === "string") {
        // Single string error → wrap in error object
        errorArray = [{ message: errors }];
      } else if (Array.isArray(errors)) {
        // Array of errors → normalize each element
        errorArray = errors.map((e) => {
          if (typeof e === "string") {
            return { message: e };
          }
          // If already an object (with field, message, etc.), keep as-is
          return e;
        });
      } else if (typeof errors === "object") {
        // Object error → wrap in array
        errorArray = [errors];
      }
    }

    // STEP 3: BUILD RESPONSE OBJECT
    // =============================
    const responseObj = {
      ok: ok || false, // Success indicator
      code: statusCode, // HTTP status code
      data: data || {}, // Response payload (empty object if none)
      timestamp: new Date().toISOString(), // ISO 8601 timestamp
    };

    // STEP 4: ADD ERRORS IF PRESENT
    // ==============================
    // Only include errors array if there are actual errors
    // Reduces response size on successful requests
    if (errorArray.length > 0) {
      responseObj.errors = errorArray;
    }

    // STEP 5: ADD MESSAGE IF PROVIDED
    // ================================
    // Optional success/error message for user display
    const finalMessage = msg || message || (ok ? null : "Request failed");
    if (finalMessage !== null) {
      responseObj.message = finalMessage;
    }

    // STEP 6: SEND HTTP RESPONSE
    // ==========================
    // Send response with appropriate status code and JSON body
    return res.status(statusCode).send(responseObj);
  }
};
