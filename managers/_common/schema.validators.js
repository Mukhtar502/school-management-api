/**
 * CUSTOM VALIDATORS
 * =================
 * Custom validation logic for specific fields that need more complex rules
 * These validators are called by the Pineapple validator engine
 *
 * Each validator:
 * - Takes field data as parameter
 * - Returns null if validation passes
 * - Returns error string if validation fails
 *
 * These are used in addition to schema.models.js field definitions
 * which provide simple rules (type, length, pattern, enum, etc.)
 *
 * Validation Flow:
 * 1. Schema.models.js basic validation (type, length, regex)
 * 2. Custom validators (complex business logic)
 * 3. Manager-level checks (database uniqueness, foreign keys)
 */

module.exports = {
  /**
   * Username Validator
   * ==================
   * Validates username format and constraints
   *
   * Rules:
   * - Must be a string
   * - Length: 3-20 characters
   * - Can only contain: letters, numbers, underscores, hyphens
   * - Cannot have spaces or special characters
   *
   * Examples:
   * ✓ "john_doe"
   * ✓ "admin123"
   * ✓ "smith-2024"
   * ✗ "ab" (too short)
   * ✗ "very_long_username_here" (too long)
   * ✗ "john doe" (space)
   * ✗ "john@mail" (special char @)
   */
  username: (data) => {
    // TYPE CHECK: Must be a string
    if (!data || typeof data !== "string") {
      return `Username must be a string`;
    }

    // LENGTH CHECK: Minimum 3 characters
    if (data.trim().length < 3) {
      return `Username must be at least 3 characters long`;
    }

    // LENGTH CHECK: Maximum 20 characters
    if (data.trim().length > 20) {
      return `Username must not exceed 20 characters`;
    }

    // CHARACTER CHECK: Only alphanumeric, underscore, hyphen
    // Regex explanation: ^[a-zA-Z0-9_-]+$
    // ^ = start of string
    // [a-zA-Z0-9_-]+ = one or more of: a-z, A-Z, 0-9, underscore, hyphen
    // $ = end of string
    if (!/^[a-zA-Z0-9_-]+$/.test(data)) {
      return `Username can only contain letters, numbers, underscores, and hyphens`;
    }

    // All validations passed
    return null;
  },
};
