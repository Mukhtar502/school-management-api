/**
 * User Entity Validation Schemas
 * ========================================
 * Defines validation rules for user operations
 * Includes: Registration, Login, Profile Updates
 *
 * Explanation of each schema:
 * - Each key is a field name from the request
 * - Values reference field definitions in schema.models.js
 * - The Pineapple validator validates input against these rules
 */

module.exports = {
  /**
   * Register User
   * Used for: New user registration (superadmin, school admin, etc.)
   * Requirements:
   * - username: 3-20 chars, alphanumeric
   * - email: valid email format
   * - password: min 8 chars (hashed before storage)
   * - firstName, lastName: names
   * - role: one of the predefined roles
   */
  registerUser: {
    username: "username", // Custom validator: username pattern
    email: "email", // Email regex validation
    password: "password", // Min 8 chars for security
    firstName: "firstName", // User's first name
    lastName: "lastName", // User's last name
    role: "role", // Must be superadmin, school_admin, teacher, or student
  },

  /**
   * Login User
   * Used for: User authentication
   * Requirements: Only username and password are needed
   * Password is compared against bcrypt hash in stored in DB
   */
  loginUser: {
    username: "username",
    password: "password",
  },

  /**
   * Update User Profile
   * Used for: Users updating their own information
   * ID is required to identify which user to update
   */
  updateUserProfile: {
    id: "id", // User ID (from URL params or token)
    firstName: "firstName",
    lastName: "lastName",
    email: "email",
  },

  /**
   * Update User Role
   * Used for: Superadmin assigning/changing user roles
   * Only superadmin can perform this action (enforced in manager)
   */
  updateUserRole: {
    id: "id",
    role: "role", // superadmin | school_admin | teacher | student
  },

  /**
   * Change Password
   * Used for: User self-service password change
   * Requires: Current password (verified) + new password
   */
  changePassword: {
    id: "id",
    currentPassword: "password",
    newPassword: "password",
  },

  /**
   * Get User By ID
   * Used for: Retrieving single user details
   * RBAC: User can get their own, Admin can get school users
   */
  getUserById: {
    id: "id",
  },

  /**
   * List Users
   * Used for: Getting all users (with pagination and filtering)
   * RBAC: Superadmin sees all, School admin sees school users
   */
  listUsers: {
    page: "page",
    limit: "limit",
    role: "role", // Optional filter by role
    status: "status", // Optional filter by status
    searchTerm: "searchTerm", // Optional search by name/email
  },

  /**
   * Deactivate User
   * Used for: Superadmin deactivating users
   * Soft delete - sets status to 'inactive' instead of deleting
   */
  deactivateUser: {
    id: "id",
  },
};
