/**
 * Token Middleware (__token.mw)
 * ===============================
 * Validates JWT token from request headers
 * Extracts and injects user data into the request
 *
 * How it works:
 * 1. Checks for token in request headers (Authorization header or custom token header)
 * 2. Verifies token signature and expiry
 * 3. If valid: decodes token, extracts user info, passes to next middleware
 * 4. If invalid: returns 401 Unauthorized error
 *
 * Token location (in order of precedence):
 * - Authorization: Bearer <token> (standard)
 * - headers.token (custom)
 * - Query parameter ?token=<token> (not recommended for production)
 *
 * Injected data (passed as __token parameter to endpoint):
 * {
 *   userId: 'user-id',
 *   email: 'user@example.com',
 *   role: 'school_admin',
 *   schoolId: 'school-id',
 *   iat: timestamp,
 *   exp: timestamp
 * }
 */
module.exports = ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    try {
      // STEP 1: EXTRACT TOKEN FROM REQUEST
      // ==================================
      let token = null;

      // Try Authorization header first (standard HTTP auth)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }

      // Try custom token header
      if (!token && req.headers.token) {
        token = req.headers.token;
      }

      // Try query parameter (less secure, but sometimes needed)
      if (!token && req.query && req.query.token) {
        token = req.query.token;
      }

      // STEP 2: VERIFY TOKEN IS PRESENT
      // ==============================
      if (!token) {
        console.log("[__token.mw] Token required but not found in request");
        return managers.responseDispatcher.dispatch(res, {
          ok: false,
          code: 401,
          errors: "Authentication required. Please provide a valid token.",
        });
      }

      // STEP 3: VERIFY TOKEN SIGNATURE & EXPIRY
      // =======================================
      let decoded = null;

      try {
        // Verify and decode token
        // This checks:
        // - Token signature is valid (wasn't tampered with)
        // - Token hasn't expired
        // - Token was issued by correct issuer
        decoded = managers.token.verifyLongToken({ token: token });

        // If verification failed
        if (!decoded) {
          console.log(
            "[__token.mw] Token verification failed - decoding returned null",
          );
          return managers.responseDispatcher.dispatch(res, {
            ok: false,
            code: 401,
            errors: "Invalid or expired token",
          });
        }
      } catch (err) {
        // JWT library threw an error (likely expired or invalid signature)
        console.error("[__token.mw] Token verification error:", err.message);
        console.log("[__token.mw] Token type:", err.name);

        // Determine specific error type for client
        let errorMessage = "Invalid or expired token";

        if (err.name === "TokenExpiredError") {
          errorMessage = "Your token has expired. Please log in again.";
        } else if (err.name === "JsonWebTokenError") {
          errorMessage = "Invalid token signature";
        } else if (err.name === "NotBeforeError") {
          errorMessage = "Token not yet valid";
        }

        return managers.responseDispatcher.dispatch(res, {
          ok: false,
          code: 401,
          errors: errorMessage,
        });
      }

      // STEP 4: INJECT DECODED TOKEN INTO REQUEST
      // ========================================
      // The decoded token object is passed as __token parameter
      // to any endpoint that has __token in its parameter list
      //
      // Decoded object typically contains:
      // - userId: User's unique identifier
      // - email: User's email address
      // - role: User's role (superadmin, school_admin, teacher, student)
      // - schoolId: (Optional) User's school ID if applicable
      // - iat: Issued-at timestamp
      // - exp: Expiration timestamp

      console.log(
        "[__token.mw] Token verified successfully for user:",
        decoded.userId,
      );

      // STEP 5: PASS TO NEXT MIDDLEWARE
      // ===============================
      // Next middleware receives the decoded token data
      next(decoded);
    } catch (error) {
      // Unexpected error (should not happen with proper JWT library)
      console.error("[__token.mw] Unexpected error:", error);
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 500,
        errors: "Authentication service error",
      });
    }
  };
};
