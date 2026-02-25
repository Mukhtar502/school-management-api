const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "School Management System API",
      version: "1.0.0",
      description:
        "Complete REST API for managing schools, classrooms, students, and user authentication with role-based access control (RBAC).",
      contact: {
        name: "Assessment Project",
        url: "http://localhost:5111",
      },
    },
    servers: [
      {
        url: "http://localhost:5111",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token from login or registration",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            code: { type: "integer" },
            data: { type: "object" },
            errors: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", description: "User UUID" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            role: {
              type: "string",
              enum: ["superadmin", "school_admin", "teacher", "student"],
            },
            status: { type: "string", enum: ["active", "inactive"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        School: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            shortCode: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string", format: "email" },
            principalName: { type: "string" },
            status: { type: "string", enum: ["active", "inactive"] },
            totalStudents: { type: "integer" },
            totalClassrooms: { type: "integer" },
            totalTeachers: { type: "integer" },
          },
        },
        Classroom: {
          type: "object",
          properties: {
            id: { type: "string" },
            schoolId: { type: "string" },
            name: { type: "string" },
            gradeLevel: { type: "string" },
            section: { type: "string" },
            capacity: { type: "integer" },
            enrolledCount: { type: "integer" },
            roomNumber: { type: "string" },
            status: { type: "string", enum: ["active", "inactive"] },
          },
        },
        Student: {
          type: "object",
          properties: {
            id: { type: "string" },
            schoolId: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            enrollmentNumber: { type: "string" },
            dateOfBirth: { type: "string", format: "date" },
            parentName: { type: "string" },
            parentPhone: { type: "string" },
            status: {
              type: "string",
              enum: ["active", "suspended", "withdrawn"],
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: {
      // ========================
      // AUTHENTICATION ENDPOINTS
      // ========================
      "/api/user/registerUser": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string", minLength: 3, maxLength: 20 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    role: {
                      type: "string",
                      enum: [
                        "superadmin",
                        "school_admin",
                        "teacher",
                        "student",
                      ],
                    },
                  },
                  required: [
                    "username",
                    "email",
                    "password",
                    "firstName",
                    "lastName",
                    "role",
                  ],
                },
              },
            },
          },
          responses: {
            200: {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      code: { type: "integer" },
                      data: {
                        type: "object",
                        properties: {
                          user: { $ref: "#/components/schemas/User" },
                          accessToken: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: "Validation error" },
            409: { description: "Email or username already exists" },
          },
        },
      },

      "/api/user/loginUser": {
        post: {
          tags: ["Authentication"],
          summary: "Login user and get JWT token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["username", "password"],
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful, returns JWT token" },
            401: { description: "Invalid credentials" },
          },
        },
      },

      // ========================
      // SCHOOL ENDPOINTS
      // ========================
      "/api/school/createSchool": {
        post: {
          tags: ["Schools"],
          summary: "Create a new school (superadmin only)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    schoolName: { type: "string" },
                    schoolAddress: { type: "string" },
                    schoolPhone: { type: "string" },
                    schoolEmail: { type: "string", format: "email" },
                    principalName: { type: "string" },
                    schoolCode: { type: "string" },
                    establishedYear: { type: "integer" },
                  },
                  required: [
                    "schoolName",
                    "schoolAddress",
                    "schoolPhone",
                    "schoolEmail",
                    "principalName",
                    "schoolCode",
                  ],
                },
              },
            },
          },
          responses: {
            200: {
              description: "School created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      code: { type: "integer" },
                      data: {
                        type: "object",
                        properties: {
                          school: { $ref: "#/components/schemas/School" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: "Validation error" },
            403: { description: "Forbidden - superadmin only" },
            409: { description: "School code already exists" },
          },
        },
      },

      "/api/school/updateSchool": {
        post: {
          tags: ["Schools"],
          summary: "Update school information (superadmin only)",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "School ID to update",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    schoolName: { type: "string" },
                    schoolAddress: { type: "string" },
                    schoolPhone: { type: "string" },
                    schoolEmail: { type: "string", format: "email" },
                    principalName: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "School updated successfully" },
            400: { description: "Validation error" },
            403: { description: "Forbidden - superadmin only" },
            404: { description: "School not found" },
          },
        },
      },

      "/api/school/getSchoolById": {
        get: {
          tags: ["Schools"],
          summary: "Get school details by ID",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "School ID",
            },
          ],
          responses: {
            200: {
              description: "School details retrieved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      code: { type: "integer" },
                      data: {
                        type: "object",
                        properties: {
                          school: { $ref: "#/components/schemas/School" },
                        },
                      },
                    },
                  },
                },
              },
            },
            404: { description: "School not found" },
          },
        },
      },

      "/api/school/listSchools": {
        get: {
          tags: ["Schools"],
          summary: "List all schools with pagination (superadmin only)",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
              description: "Items per page",
            },
            {
              name: "searchTerm",
              in: "query",
              schema: { type: "string" },
              description: "Search by name or code",
            },
          ],
          responses: {
            200: {
              description: "List of schools",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      code: { type: "integer" },
                      data: {
                        type: "object",
                        properties: {
                          schools: {
                            type: "array",
                            items: { $ref: "#/components/schemas/School" },
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              page: { type: "integer" },
                              limit: { type: "integer" },
                              total: { type: "integer" },
                              pages: { type: "integer" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            403: { description: "Forbidden - superadmin only" },
          },
        },
      },

      "/api/school/deleteSchool": {
        post: {
          tags: ["Schools"],
          summary: "Delete/deactivate a school (superadmin only, soft delete)",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "School ID to delete",
            },
          ],
          responses: {
            200: { description: "School deleted successfully" },
            403: { description: "Forbidden - superadmin only" },
            404: { description: "School not found" },
          },
        },
      },

      "/api/school/getSchoolStats": {
        get: {
          tags: ["Schools"],
          summary: "Get school statistics (superadmin only)",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "School ID",
            },
          ],
          responses: {
            200: {
              description: "School statistics",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      code: { type: "integer" },
                      data: {
                        type: "object",
                        properties: {
                          statistics: {
                            type: "object",
                            properties: {
                              schoolId: { type: "string" },
                              schoolName: { type: "string" },
                              totalClassrooms: { type: "integer" },
                              totalStudents: { type: "integer" },
                              totalTeachers: { type: "integer" },
                              averageStudentsPerClass: { type: "number" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            404: { description: "School not found" },
          },
        },
      },

      // ========================
      // CLASSROOM ENDPOINTS
      // ========================
      "/api/classroom/createClassroom": {
        post: {
          tags: ["Classrooms"],
          summary: "Create a new classroom (school admin or superadmin)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    schoolId: { type: "string" },
                    classroomName: { type: "string" },
                    gradeLevel: {
                      type: "string",
                      enum: [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "11",
                        "12",
                      ],
                    },
                    section: {
                      type: "string",
                      enum: ["A", "B", "C", "D", "E", "F"],
                    },
                    capacity: { type: "integer" },
                    roomNumber: { type: "string" },
                  },
                  required: [
                    "schoolId",
                    "classroomName",
                    "gradeLevel",
                    "section",
                    "capacity",
                  ],
                },
              },
            },
          },
          responses: {
            200: { description: "Classroom created successfully" },
            400: {
              description: "Validation error or classroom already exists",
            },
            403: { description: "Forbidden" },
          },
        },
      },

      "/api/classroom/updateClassroom": {
        post: {
          tags: ["Classrooms"],
          summary: "Update classroom information",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Classroom ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    classroomName: { type: "string" },
                    capacity: { type: "integer" },
                    roomNumber: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Classroom updated successfully" },
            400: { description: "Validation error or capacity too low" },
            404: { description: "Classroom not found" },
          },
        },
      },

      "/api/classroom/getClassroomById": {
        get: {
          tags: ["Classrooms"],
          summary: "Get classroom details",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Classroom ID",
            },
          ],
          responses: {
            200: { description: "Classroom details" },
            404: { description: "Classroom not found" },
          },
        },
      },

      "/api/classroom/listClassrooms": {
        get: {
          tags: ["Classrooms"],
          summary: "List classrooms for a school",
          parameters: [
            {
              name: "schoolId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "School ID",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
              description: "Items per page",
            },
          ],
          responses: {
            200: { description: "List of classrooms" },
            400: { description: "Invalid school ID" },
          },
        },
      },

      "/api/classroom/deleteClassroom": {
        post: {
          tags: ["Classrooms"],
          summary: "Delete/deactivate classroom (soft delete)",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Classroom ID",
            },
          ],
          responses: {
            200: { description: "Classroom deleted successfully" },
            400: { description: "Cannot delete - has enrolled students" },
            404: { description: "Classroom not found" },
          },
        },
      },

      "/api/classroom/checkClassroomAvailability": {
        get: {
          tags: ["Classrooms"],
          summary: "Check available seats in classroom",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Classroom ID",
            },
          ],
          responses: {
            200: {
              description: "Classroom availability",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      code: { type: "integer" },
                      data: {
                        type: "object",
                        properties: {
                          classroomId: { type: "string" },
                          capacity: { type: "integer" },
                          enrolledCount: { type: "integer" },
                          availableSeats: { type: "integer" },
                          hasAvailability: { type: "boolean" },
                          enrollmentPercentage: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
            404: { description: "Classroom not found" },
          },
        },
      },

      "/api/classroom/getClassroomEnrollment": {
        get: {
          tags: ["Classrooms"],
          summary: "Get list of enrolled students in classroom",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Classroom ID",
            },
          ],
          responses: {
            200: { description: "List of enrolled students" },
            404: { description: "Classroom not found" },
          },
        },
      },

      // ========================
      // STUDENT ENDPOINTS
      // ========================
      "/api/student/createStudent": {
        post: {
          tags: ["Students"],
          summary: "Create new student and enroll in classroom",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    schoolId: { type: "string" },
                    studentFirstName: { type: "string" },
                    studentLastName: { type: "string" },
                    enrollmentNumber: { type: "string" },
                    studentEmail: { type: "string", format: "email" },
                    dateOfBirth: { type: "string", format: "date" },
                    parentName: { type: "string" },
                    parentPhone: { type: "string" },
                    studentPhone: { type: "string" },
                    classroomId: { type: "string" },
                    enrollmentDate: { type: "string", format: "date" },
                  },
                  required: [
                    "schoolId",
                    "studentFirstName",
                    "studentLastName",
                    "enrollmentNumber",
                    "studentEmail",
                    "dateOfBirth",
                    "parentName",
                    "parentPhone",
                    "classroomId",
                  ],
                },
              },
            },
          },
          responses: {
            200: { description: "Student created and enrolled successfully" },
            400: { description: "Validation error or classroom full" },
            409: { description: "Enrollment number already exists" },
          },
        },
      },

      "/api/student/updateStudent": {
        post: {
          tags: ["Students"],
          summary: "Update student profile",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Student ID",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    studentFirstName: { type: "string" },
                    studentLastName: { type: "string" },
                    studentEmail: { type: "string", format: "email" },
                    studentPhone: { type: "string" },
                    parentName: { type: "string" },
                    parentPhone: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Student updated successfully" },
            400: { description: "Validation error" },
            404: { description: "Student not found" },
          },
        },
      },

      "/api/student/getStudentById": {
        get: {
          tags: ["Students"],
          summary: "Get student details",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Student ID",
            },
          ],
          responses: {
            200: { description: "Student details" },
            404: { description: "Student not found" },
          },
        },
      },

      "/api/student/listStudents": {
        get: {
          tags: ["Students"],
          summary: "List students in a school",
          parameters: [
            {
              name: "schoolId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "School ID",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
              description: "Items per page",
            },
          ],
          responses: {
            200: { description: "List of students" },
            400: { description: "Invalid school ID" },
          },
        },
      },

      "/api/student/transferStudent": {
        post: {
          tags: ["Students"],
          summary: "Transfer student to different classroom",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    studentId: { type: "string" },
                    newClassroomId: { type: "string" },
                    transferDate: { type: "string", format: "date" },
                  },
                  required: ["studentId", "newClassroomId"],
                },
              },
            },
          },
          responses: {
            200: { description: "Student transferred successfully" },
            400: { description: "Validation error or classroom full" },
            404: { description: "Student or classroom not found" },
          },
        },
      },

      "/api/student/getStudentHistory": {
        get: {
          tags: ["Students"],
          summary: "Get student enrollment history",
          parameters: [
            {
              name: "studentId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Student ID",
            },
          ],
          responses: {
            200: { description: "Student enrollment history" },
            404: { description: "Student not found" },
          },
        },
      },

      "/api/student/suspendStudent": {
        post: {
          tags: ["Students"],
          summary: "Suspend student from attending classes",
          parameters: [
            {
              name: "studentId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Student ID",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Student suspended successfully" },
            404: { description: "Student not found" },
          },
        },
      },

      "/api/student/withdrawStudent": {
        post: {
          tags: ["Students"],
          summary: "Withdraw student from school",
          parameters: [
            {
              name: "studentId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Student ID",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    withdrawalDate: { type: "string", format: "date" },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Student withdrawn successfully" },
            404: { description: "Student not found" },
          },
        },
      },

      "/api/student/getStudentByEnrollmentNumber": {
        get: {
          tags: ["Students"],
          summary: "Get student by enrollment number",
          parameters: [
            {
              name: "enrollmentNumber",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Student enrollment number",
            },
            {
              name: "schoolId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "School ID",
            },
          ],
          responses: {
            200: { description: "Student details" },
            404: { description: "Student not found" },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
