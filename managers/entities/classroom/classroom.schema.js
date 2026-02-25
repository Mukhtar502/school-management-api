/**
 * Classroom Entity Validation Schemas
 * ========================================
 * Defines validation rules for classroom operations
 * CRUD operations for classroom management
 *
 * Explanation:
 * - Only school admins can manage classrooms in their school
 * - Each classroom belongs to one school
 * - Classrooms have a capacity limit (resource management)
 * - Students are enrolled to classrooms
 * - Grade level and section determine classroom identity
 */

module.exports = {
  /**
   * Create Classroom
   * Used for: School admin creating a new classroom
   * Fields required:
   * - schoolId: ID of the school (from token/session)
   * - name: Display name (e.g., "10-A" or "Class 10A")
   * - gradeLevel: Academic grade (1-12)
   * - section: Class section (A, B, C, D, E, F)
   * - capacity: Maximum students allowed in this classroom
   * - roomNumber: Physical room/building number
   */
  createClassroom: {
    schoolId: "id", // School ID (from authenticated user's school)
    classroomName: "classroomName", // Name like "10-A Grade" (2-50 chars)
    gradeLevel: "gradeLevel", // Academic grade: 1, 2, 3... 12
    section: "section", // Section: A, B, C, D, E, or F
    capacity: "capacity", // Max students capacity
    roomNumber: "roomNumber", // Physical room number (1-10 chars)
  },

  /**
   * Update Classroom
   * Used for: School admin updating classroom information
   * Allows partial updates
   * Note: Cannot change gradeLevel/section (would require data migration)
   */
  updateClassroom: {
    id: "id", // Classroom ID to update
    classroomName: "classroomName", // Can update display name
    capacity: "capacity", // Can update capacity
    roomNumber: "roomNumber", // Can update room number
  },

  /**
   * Get Classroom By ID
   * Used for: Retrieving details of a specific classroom
   * RBAC:
   * - Superadmin: Can get any classroom
   * - School admin: Can only get classrooms in their school
   * - Teacher/Student: Can get classrooms they're assigned to
   */
  getClassroomById: {
    id: "id", // Classroom ID
  },

  /**
   * List Classrooms
   * Used for: Getting all classrooms in a school with pagination
   * RBAC:
   * - Superadmin: Gets all classrooms from all schools
   * - School admin: Gets only classrooms from their school
   */
  listClassrooms: {
    schoolId: "id", // Optional: filter by school (required for school admin)
    page: "page", // Pagination: page number
    limit: "limit", // Pagination: items per page
    gradeLevel: "gradeLevel", // Optional: filter by grade
    searchTerm: "searchTerm", // Optional: search by name
  },

  /**
   * Delete Classroom
   * Used for: School admin deleting a classroom (soft delete)
   * Important:
   * - Cannot delete if classroom has enrolled students
   * - Sets status to inactive
   * - Preserves historical enrollment data
   */
  deleteClassroom: {
    id: "id", // Classroom ID to delete
  },

  /**
   * Get Classroom Enrollment
   * Used for: Getting list of students enrolled in a classroom
   * Returns:
   * - List of student IDs/names
   * - Current enrollment count
   * - Capacity remaining
   */
  getClassroomEnrollment: {
    id: "id", // Classroom ID
    page: "page", // Optional pagination
    limit: "limit",
  },

  /**
   * Check Classroom Availability
   * Used for: Before enrolling a student, check if space available
   * Returns: current enrollment, capacity, available seats
   */
  checkClassroomAvailability: {
    id: "id", // Classroom ID
  },
};
