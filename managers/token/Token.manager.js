const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const md5 = require("md5");

/**
 * Token Manager - JWT Generation & Verification
 * ==============================================
 * Handles creation and validation of JWT tokens
 *
 * Token Types:
 * 1. Long Token: Long-lived access token (7 days)
 *    - Used for primary API authentication
 *    - Contains user identity and role information
 *    - Should be stored securely on client
 *
 * 2. Short Token: Refresh token (24 hours)
 *    - Used to obtain new access tokens
 *    - Shorter lifespan for security
 *    - Device-specific for enhanced security
 */
console.log(">>> LOADING THE CORRECT TOKEN MANAGER FILE <<<");
module.exports = class TokenManager {
  constructor({ config }) {
    this.config = config;
    // Expiry times from environment (configurable in production)
    this.longTokenExpiresIn = process.env.JWT_LONG_EXPIRY || "7d";
    this.shortTokenExpiresIn = process.env.JWT_SHORT_EXPIRY || "24h";

    // HTTP exposed methods (can be called via API)
    this.httpExposed = ["refreshToken"];
    console.log("-----------------------------------------");
    console.log("JWT CONFIG CHECK:");
    console.log("Long Secret Loaded:", !!this.config.dotEnv.LONG_TOKEN_SECRET);
    console.log(
      "Short Secret Loaded:",
      !!this.config.dotEnv.SHORT_TOKEN_SECRET,
    );
    console.log("Issuer:", this.config.jwt?.issuer);
    console.log("-----------------------------------------");
  }
  /**
   * Generate Long Token (Access Token)
   * ==================================
   * Creates a long-lived JWT for API authentication
   *
   * @param {object} payload - Token payload containing:
   *   - userId: Unique user identifier
   *   - email: User email (for communication)
   *   - role: User role (superadmin, school_admin, teacher, student)
   *
   * @returns {string} JWT token
   *
   * Flow:
   * 1. Package user data into JWT payload
   * 2. Sign with LONG_TOKEN_SECRET (from .env)
   * 3. Set expiry to 7 days
   * 4. Return signed token
   *
   * Usage in API:
   * Client sends: Authorization: Bearer <longToken>
   * Or: headers: {token: longToken}
   */
  genLongToken({ userId, email, role }) {
    // Create payload with user identity info
    // This is what gets decoded when token is verified
    const payload = {
      userId, // Unique user ID
      email, // User's email for communication
      role, // User's role for RBAC checks
      type: "access", // Token type identifier
      iat: Math.floor(Date.now() / 1000), // Issued at timestamp
    };

    console.log(
      "[genLongToken] Creating token with payload:",
      JSON.stringify(payload),
    );
    console.log("[genLongToken] Using issuer:", this.config.jwt?.issuer);

    try {
      const signedToken = jwt.sign(
        payload,
        this.config.dotEnv.LONG_TOKEN_SECRET,
        {
          expiresIn: this.longTokenExpiresIn, // 7 days by default
          algorithm: "HS256",
          issuer: this.config.jwt?.issuer || "school-management-api",
          subject: userId,
        },
      );
      console.log("[genLongToken] Token generated successfully");
      return signedToken;
    } catch (err) {
      console.error("[genLongToken] Error signing token:", err);
      return null;
    }
  }

  /**
   * Generate Short Token (Refresh Token)
   * ====================================
   * Creates a shorter-lived JWT for token refresh operations
   * Device-specific for enhanced security
   *
   * @param {object} payload - Token payload containing:
   *   - userId: User ID
   *   - deviceId: (Optional) Device identifier for device-specific sessions
   *
   * @returns {string} JWT token
   *
   * Usage Flow:
   * 1. Client receives both longToken and shortToken on login
   * 2. longToken expires in 7 days
   * 3. Before long token expires, client uses shortToken to get a new longToken
   * 4. This allows continuous session without re-entering password
   */
  genShortToken({ userId, deviceId }) {
    const payload = {
      userId,
      deviceId: deviceId || nanoid(), // Generate random device ID if not provided
      type: "refresh", // Token type identifier
      iat: Math.floor(Date.now() / 1000),
    };

    try {
      return jwt.sign(payload, this.config.dotEnv.SHORT_TOKEN_SECRET, {
        expiresIn: this.shortTokenExpiresIn, // 24 hours by default
        algorithm: "HS256",
        issuer: this.config.jwt?.issuer,
        subject: userId,
      });
    } catch (err) {
      console.error("[genShortToken] Error signing token:", err);
      return null;
    }
  }

  /**
   * Internal Token Verification Helper
   * ==================================
   * Generic method to verify any JWT token
   *
   * @param {string} token - JWT token to verify
   * @param {string} secret - Secret key used to sign the token
   *
   * @returns {object|null} Decoded token payload if valid, null if invalid
   *
   * Validations performed by jwt.verify():
   * - Signature is valid (wasn't tampered with)
   * - Token hasn't expired
   * - Issuer matches (if specified)
   * - Subject matches (if specified)
   */
  _verifyToken({ token, secret }) {
    let decoded = null;
    try {
      decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        issuer: this.config.jwt?.issuer,
      });
    } catch (err) {
      console.error("[_verifyToken] Token verification failed:", err.message);
      // Don't log full error as it might contain sensitive data
    }
    return decoded;
  }

  /**
   * Verify Long Token
   * ================
   * Validates an access token
   * Used in __token middleware to authenticate requests
   */
  verifyLongToken({ token }) {
    if (!token) return null;
    return this._verifyToken({
      token,
      secret: this.config.dotEnv.LONG_TOKEN_SECRET,
    });
  }

  /**
   * Verify Short Token
   * =================
   * Validates a refresh token
   * Used when client wants to obtain a new access token
   */
  verifyShortToken({ token }) {
    if (!token) return null;
    return this._verifyToken({
      token,
      secret: this.config.dotEnv.SHORT_TOKEN_SECRET,
    });
  }

  /**
   * Refresh Token Endpoint
   * ===================
   * Allows client to obtain a new access token using refresh token
   *
   * @param {string} __shortToken - Decoded short token from HTTP header
   * @returns {object} New access tokens
   *
   * Usage:
   * POST /api/token/refreshToken
   * Headers: {token: <shortToken>}
   */
  async refreshToken({ __shortToken }) {
    try {
      if (!__shortToken || !__shortToken.userId) {
        return {
          ok: false,
          code: 401, // Unauthorized
          errors: "Invalid or expired refresh token",
        };
      }

      // In production, verify token hasn't been blacklisted
      // blacklist = new Set() keeps track of revoked tokens

      // Generate new long token using the userId from refresh token
      // Note: In real implementation, would fetch full user data from DB
      const newLongToken = this.genLongToken({
        userId: __shortToken.userId,
        email: "user@example.com", // Would fetch from DB
        role: "student", // Would fetch from DB
      });

      return {
        ok: true,
        code: 200,
        data: {
          longToken: newLongToken,
        },
      };
    } catch (error) {
      console.error("[refreshToken] Error:", error);
      return {
        ok: false,
        code: 500,
        errors: "Failed to refresh token",
      };
    }
  }

  /**
   * [Deprecated] Legacy short token creation endpoint
   * Kept for backwards compatibility with template
   */
  v1_createShortToken({ __longToken, __device }) {
    try {
      if (!__longToken || !__longToken.userId) {
        return {
          ok: false,
          code: 400,
          errors: "Invalid long token",
        };
      }

      const shortToken = this.genShortToken({
        userId: __longToken.userId,
        deviceId: md5(__device && __device.ip ? __device.ip : ""),
      });

      return {
        ok: true,
        code: 200,
        data: { shortToken },
      };
    } catch (error) {
      console.error("[v1_createShortToken] Error:", error);
      return {
        ok: false,
        code: 500,
        errors: "Failed to create short token",
      };
    }
  }
};
