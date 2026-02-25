/**
 * School Entity Validation Schemas
 * ========================================
 * Defines validation rules for school operations
 * CRUD operations for school management
 *
 * Explanation:
 * - Only superadmin can perform school operations (RBAC enforced in manager)
 * - Schools are the top-level organizational unit
 * - Each school has multiple classrooms
 * - School admins are assigned to manage specific schools
 */

module.exports = {
  /**
   * Create School
   * Used for: Superadmin creating a new school
   * Fields required:
   * - name: School name (e.g., "St. Joseph's High School")
   * - address: Full school address
   * - phone: Contact phone number
   * - email: School email
   * - principalName: Name of school principal
   * - code: Unique school identifier (e.g., "SJH001")
   * - establishedYear: Year school was established
   */
  createSchool: {
    schoolName: "schoolName", // Name of the school (3-100 chars)
    schoolAddress: "schoolAddress", // Physical address (5-300 chars)
    schoolPhone: "schoolPhone", // Contact phone (10-20 digits)
    schoolEmail: "schoolEmail", // School email address
    principalName: "principalName", // Principal's full name
    schoolCode: "schoolCode", // Unique code (3-20 chars) - used for identification
    establishedYear: "establishedYear", // Year established
  },

  /**
   * Update School
   * Used for: Superadmin updating school information
   * Allows partial updates - only provided fields are updated
   */
  updateSchool: {
    id: "id", // School ID (from URL or params)
    schoolName: "schoolName",
    schoolAddress: "schoolAddress",
    schoolPhone: "schoolPhone",
    schoolEmail: "schoolEmail",
    principalName: "principalName",
    establishedYear: "establishedYear",
  },

  /**
   * Get School By ID
   * Used for: Retrieving details of a specific school
   * RBAC:
   * - Superadmin: Can get any school
   * - School admin: Can only get their own school
   */
  getSchoolById: {
    id: "id", // School ID to retrieve
  },

  /**
   * List Schools
   * Used for: Getting all schools with pagination and filtering
   * RBAC:
   * - Superadmin: Gets all schools
   * - School admin: Cannot access this endpoint
   */
  listSchools: {
    page: "page", // Pagination: page number
    limit: "limit", // Pagination: items per page
    sortBy: "sortBy", // Optional: sort field (e.g., "name", "code")
    searchTerm: "searchTerm", // Optional: search by name or code
    status: "status", // Optional: filter by active/inactive
  },

  /**
   * Delete School
   * Used for: Superadmin deleting a school (soft delete)
   * Important: Sets status to inactive instead of hard delete
   * Preserves historical data for audit purposes
   */
  deleteSchool: {
    id: "id", // School ID to delete
  },

  /**
   * Get School Statistics
   * Used for: Superadmin viewing school statistics
   * Returns: number of classrooms, students, teachers, etc.
   */
  getSchoolStats: {
    id: "id", // School ID
  },
};
