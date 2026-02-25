/**
 * Student Entity Validation Schemas
 * ========================================
 * Defines validation rules for student operations
 * CRUD operations and enrollment management
 *
 * Explanation:
 * - Only school admins can manage students in their school
 * - Students are enrolled to specific classrooms
 * - Each student has unique enrollmentNumber (within school)
 * - Students can be transferred between classrooms
 * - Parent/Guardian contact info is captured
 */

module.exports = {
  /**
   * Create Student
   * Used for: School admin enrolling a new student
   * Fields required:
   * - firstName, lastName: Student's name
   * - enrollmentNumber: Unique ID within the school
   * - email, phone: Contact information
   * - dateOfBirth: For age tracking
   * - parentName, parentPhone: Parent/guardian info
   * - classroomId: Classroom to enroll into
   */
  createStudent: {
    schoolId: "id", // School ID (from authenticated user)
    studentFirstName: "studentFirstName", // Student first name (2-50 chars)
    studentLastName: "studentLastName", // Student last name (2-50 chars)
    enrollmentNumber: "enrollmentNumber", // Unique ID like "STU20240001"
    studentEmail: "studentEmail", // Student email (optional but validated)
    studentPhone: "studentPhone", // Student contact phone
    dateOfBirth: "dateOfBirth", // Format: YYYY-MM-DD
    parentName: "parentName", // Parent/guardian full name
    parentPhone: "parentPhone", // Parent emergency contact
    classroomId: "id", // Classroom ID to enroll into
    enrollmentDate: "enrollmentDate", // Format: YYYY-MM-DD
  },

  /**
   * Update Student Profile
   * Used for: School admin updating student information
   * Can update personal details but not enrollment number
   * Note: enrollmentNumber is immutable (primary key)
   */
  updateStudent: {
    id: "id", // Student ID to update
    studentFirstName: "studentFirstName",
    studentLastName: "studentLastName",
    studentEmail: "studentEmail",
    studentPhone: "studentPhone",
    dateOfBirth: "dateOfBirth",
    parentName: "parentName",
    parentPhone: "parentPhone",
  },

  /**
   * Get Student By ID
   * Used for: Retrieving student details
   * RBAC:
   * - Superadmin: Can get any student
   * - School admin: Can only get students in their school
   * - Student: Can get their own profile
   * - Teacher: Can get students in their classroom
   */
  getStudentById: {
    id: "id", // Student ID
  },

  /**
   * List Students
   * Used for: Getting all students with pagination and filtering
   * RBAC:
   * - Superadmin: Gets all students from all schools
   * - School admin: Gets students from their school only
   * - Teacher: Gets students in their classroom only
   */
  listStudents: {
    schoolId: "id", // Optional: filter by school
    classroomId: "id", // Optional: filter by classroom
    page: "page", // Pagination: page number
    limit: "limit", // Pagination: items per page
    gradeLevel: "gradeLevel", // Optional: filter by grade
    searchTerm: "searchTerm", // Optional: search by name/enrollment number
    status: "status", // Optional: active, suspended, withdrawn
  },

  /**
   * Transfer Student
   * Used for: School admin moving a student to a different classroom
   * Important:
   * - Can only transfer within same school
   * - Must verify target classroom has capacity
   * - Maintains historical enrollment records
   * Example: Moving student from Class 10-A to Class 10-B
   */
  transferStudent: {
    id: "id", // Student ID to transfer
    fromClassroomId: "id", // Current classroom
    toClassroomId: "id", // Target classroom (must be same school)
    transferDate: "enrollmentDate", // Date of transfer
    reason: "longText", // Reason for transfer (optional)
  },

  /**
   * Get Student Enrollment History
   * Used for: Retrieving all enrollment history for a student
   * Returns: All classrooms student has been in, transfer dates
   */
  getStudentHistory: {
    id: "id", // Student ID
  },

  /**
   * Suspend Student
   * Used for: School admin suspending a student
   * Action: Sets student status to 'suspended'
   */
  suspendStudent: {
    id: "id", // Student ID
    reason: "longText", // Reason for suspension
  },

  /**
   * Withdraw Student
   * Used for: Formally withdrawing a student from school
   * Action: Sets student status to 'withdrawn'
   * Note: Can still view records, but not enrolled
   */
  withdrawStudent: {
    id: "id", // Student ID
    withdrawalDate: "enrollmentDate", // Date of withdrawal
    reason: "longText", // Reason for withdrawal
  },

  /**
   * Get Student By Enrollment Number
   * Used for: Finding student using their enrollment number
   * Returns: Student details if found in user's school
   */
  getStudentByEnrollmentNumber: {
    schoolId: "id", // School to search in
    enrollmentNumber: "enrollmentNumber", // Student enrollment number
  },
};
