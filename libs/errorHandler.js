/**
 * Error Handler Utility
 * =====================
 * Standardizes error responses across the application
 * Ensures consistent error message formatting for better frontend consumption
 */

module.exports = {
  /**
   * BadRequest Error (400)
   * Used for validation errors or malformed requests
   */
  badRequest(message, field = null, details = null) {
    return {
      ok: false,
      code: 400,
      errors: [
        {
          field,
          message,
          ...(details && { details }),
        },
      ],
    };
  },

  /**
   * Multiple validation errors (400)
   * @param {Array} errorArray - Array of {field, message} objects
   */
  validationErrors(errorArray) {
    return {
      ok: false,
      code: 400,
      errors: errorArray.map((err) => ({
        field: err.field || null,
        message: err.message || err,
      })),
    };
  },

  /**
   * Unauthorized Error (401)
   * Used for authentication failures
   */
  unauthorized(message = "Unauthorized. Please login to continue.") {
    return {
      ok: false,
      code: 401,
      errors: [
        {
          message,
          type: "AUTH_ERROR",
        },
      ],
    };
  },

  /**
   * Forbidden Error (403)
   * Used for authorization failures (authenticated but no permission)
   */
  forbidden(message = "You do not have permission to access this resource.") {
    return {
      ok: false,
      code: 403,
      errors: [
        {
          message,
          type: "PERMISSION_ERROR",
        },
      ],
    };
  },

  /**
   * Conflict Error (409)
   * Used for duplicate entries or conflicts
   */
  conflict(message, field = null) {
    return {
      ok: false,
      code: 409,
      errors: [
        {
          field,
          message,
          type: "CONFLICT",
        },
      ],
    };
  },

  /**
   * Not Found Error (404)
   * Used when resource doesn't exist
   */
  notFound(resource = "Resource") {
    return {
      ok: false,
      code: 404,
      errors: [
        {
          message: `${resource} not found`,
          type: "NOT_FOUND",
        },
      ],
    };
  },

  /**
   * Internal Server Error (500)
   * Used for unexpected errors
   */
  internalError(
    message = "An unexpected error occurred. Please try again.",
    errorDetails = null,
  ) {
    return {
      ok: false,
      code: 500,
      errors: [
        {
          message,
          ...(errorDetails && { details: errorDetails }),
          type: "INTERNAL_ERROR",
        },
      ],
    };
  },

  /**
   * Unprocessable Entity (422)
   * Used when the request is well-formed but contains logical errors
   */
  unprocessable(message, field = null) {
    return {
      ok: false,
      code: 422,
      errors: [
        {
          field,
          message,
          type: "UNPROCESSABLE",
        },
      ],
    };
  },

  /**
   * Helper to validate required fields
   * Returns null if all required fields are present, otherwise returns error object
   */
  validateRequired(data, requiredFields) {
    for (const field of requiredFields) {
      if (
        !data[field] ||
        (typeof data[field] === "string" && !data[field].trim())
      ) {
        return this.badRequest(
          `${this.formatFieldName(field)} is required`,
          field,
        );
      }
    }
    return null; // All required fields present
  },

  /**
   * Helper to format field names from camelCase to readable format
   * Example: firstName → First Name
   */
  formatFieldName(fieldName) {
    return fieldName
      .replace(/(?:^|.)(?=[A-Z])/g, (x) => (x === fieldName[0] ? x : " " + x))
      .replace(/^./, (x) => x.toUpperCase());
  },

  /**
   * Check if user has required role
   */
  checkRolePermission(userRole, requiredRoles) {
    if (!userRole) {
      return this.unauthorized("Authentication required");
    }
    if (!requiredRoles.includes(userRole)) {
      return this.forbidden(
        `This operation requires one of these roles: ${requiredRoles.join(", ")}`,
      );
    }
    return null; // Permission granted
  },

  /**
   * Check if user owns the resource or is admin
   */
  checkResourceOwnership(userId, resourceOwnerId, userRole) {
    if (userId !== resourceOwnerId && userRole !== "superadmin") {
      return this.forbidden("You can only access your own resources");
    }
    return null; // Access granted
  },
};
