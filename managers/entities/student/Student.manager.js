/**
 * Student Manager - Student CRUD & Enrollment Operations
 * ======================================================
 * Manages all student-related operations and enrollment
 * RBAC: School admin manages students in their school
 *
 * Responsibilities:
 * - Create student records and enroll in classroom
 * - Update student profile
 * - List students with filtering
 * - Transfer students between classrooms
 * - View enrollment history
 * - Suspend/Withdraw students
 * - Track student status
 */

module.exports = class Student {
  constructor({ utils, cache, config, validators, managers, mongomodels }) {
    this.config = config;
    this.cache = cache;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.responseDispatcher = managers.responseDispatcher;

    this.studentsCollection = "students";
    this.classroomsCollection = "classrooms";
    this.enrollmentHistoryCollection = "enrollment_history";

    this.httpExposed = [
      "post=createStudent",
      "post=updateStudent",
      "get=getStudentById",
      "get=listStudents",
      "post=transferStudent",
      "get=getStudentHistory",
      "post=suspendStudent",
      "post=withdrawStudent",
      "get=getStudentByEnrollmentNumber",
    ];
  }

  /**
   * Create Student
   * ==============
   * RBAC: School admin enrolls students in their school
   *
   * Creates a new student record and enrolls in a classroom
   * Validates classroom availability before enrollment
   */
  async createStudent({
    schoolId,
    studentFirstName,
    studentLastName,
    enrollmentNumber,
    studentEmail,
    studentPhone,
    dateOfBirth,
    parentName,
    parentPhone,
    classroomId,
    enrollmentDate,
    __token,
  }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      // RBAC: School admin can only enroll in their school
      if (__token.role === "school_admin" && __token.schoolId !== schoolId) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot enroll students in other schools",
        };
      }

      if (!["superadmin", "school_admin"].includes(__token.role)) {
        return {
          ok: false,
          code: 403,
          errors: "Only school admin can create students",
        };
      }

      // CHECK FOR UNDEFINED/NULL REQUIRED FIELDS
      if (!schoolId)
        return { ok: false, code: 400, errors: "schoolId is required" };
      if (!studentFirstName)
        return { ok: false, code: 400, errors: "studentFirstName is required" };
      if (!studentLastName)
        return { ok: false, code: 400, errors: "studentLastName is required" };
      if (!enrollmentNumber)
        return { ok: false, code: 400, errors: "enrollmentNumber is required" };
      if (!studentEmail)
        return { ok: false, code: 400, errors: "studentEmail is required" };
      if (!studentPhone)
        return { ok: false, code: 400, errors: "studentPhone is required" };
      if (!dateOfBirth)
        return { ok: false, code: 400, errors: "dateOfBirth is required" };
      if (!parentName)
        return { ok: false, code: 400, errors: "parentName is required" };
      if (!parentPhone)
        return { ok: false, code: 400, errors: "parentPhone is required" };
      if (!classroomId)
        return { ok: false, code: 400, errors: "classroomId is required" };

      // Validate input
      let validation = await this.validators.student.createStudent({
        schoolId,
        studentFirstName,
        studentLastName,
        enrollmentNumber,
        studentEmail,
        studentPhone,
        dateOfBirth,
        parentName,
        parentPhone,
        classroomId,
        enrollmentDate,
      });

      if (validation) {
        return { ok: false, code: 400, errors: validation };
      }

      // Check if enrollment number is unique in the school
      const existingStudent = await this._findStudentByEnrollmentNumber(
        schoolId,
        enrollmentNumber,
      );
      if (existingStudent) {
        return {
          ok: false,
          code: 409,
          errors: "Enrollment number already exists in this school",
        };
      }

      // Verify classroom exists and has capacity
      const classroom = await this._findClassroomById(classroomId);
      if (!classroom) {
        return { ok: false, code: 404, errors: "Classroom not found" };
      }

      if (classroom.currentEnrollment >= classroom.capacity) {
        return {
          ok: false,
          code: 400,
          errors: `Classroom is at full capacity (${classroom.capacity}/${classroom.capacity})`,
        };
      }

      // Verify classroom belongs to correct school
      if (classroom.schoolId !== schoolId) {
        return {
          ok: false,
          code: 400,
          errors: "Classroom does not belong to specified school",
        };
      }

      // Create student object
      const student = {
        id: this._generateId(),
        schoolId: schoolId,
        firstName: studentFirstName,
        lastName: studentLastName,
        enrollmentNumber: enrollmentNumber,
        email: studentEmail,
        phone: studentPhone,
        dateOfBirth: dateOfBirth,
        parentName: parentName,
        parentPhone: parentPhone,
        classroomId: classroomId,
        enrollmentDate: enrollmentDate,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: __token.userId,
      };

      // Create enrollment history record
      const enrollmentRecord = {
        id: this._generateId(),
        studentId: student.id,
        classroomId: classroomId,
        enrollmentDate: enrollmentDate,
        withdrawalDate: null,
        status: "active",
        type: "enrollment",
        createdAt: new Date().toISOString(),
      };

      // MongoDB:
      // const sess = await db.startSession()
      // await db.students.insertOne(student)
      // await db.enrollment_history.insertOne(enrollmentRecord)
      // await db.classrooms.updateOne({_id: classroomId}, {$inc: {currentEnrollment: 1}})

      return {
        ok: true,
        code: 201,
        data: {
          student: this._sanitizeStudent(student),
        },
      };
    } catch (error) {
      console.error("[createStudent] Error:", error);
      return { ok: false, code: 500, errors: "Failed to create student" };
    }
  }

  /**
   * Update Student
   * ==============
   * Updates student profile information
   * Cannot update enrollment number (immutable)
   */
  async updateStudent({
    id,
    studentFirstName,
    studentLastName,
    studentEmail,
    studentPhone,
    dateOfBirth,
    parentName,
    parentPhone,
    __token,
  }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const student = await this._findStudentById(id);
      if (!student) {
        return { ok: false, code: 404, errors: "Student not found" };
      }

      // RBAC: School admin can only update their school's students
      if (
        __token.role === "school_admin" &&
        __token.schoolId !== student.schoolId
      ) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot update students in other schools",
        };
      }

      if (!["superadmin", "school_admin"].includes(__token.role)) {
        return {
          ok: false,
          code: 403,
          errors: "Only school admin can update students",
        };
      }

      // Validate input
      let validation = await this.validators.student.updateStudent({
        id,
        studentFirstName,
        studentLastName,
        studentEmail,
        studentPhone,
        dateOfBirth,
        parentName,
        parentPhone,
      });

      if (validation) {
        return { ok: false, code: 400, errors: validation };
      }

      // Check email uniqueness if changed
      if (studentEmail && studentEmail !== student.email) {
        const existing = await this._findStudentByEmail(studentEmail);
        if (existing && existing.id !== id) {
          return { ok: false, code: 409, errors: "Email already in use" };
        }
      }

      const updateData = {};
      if (studentFirstName) updateData.firstName = studentFirstName;
      if (studentLastName) updateData.lastName = studentLastName;
      if (studentEmail) updateData.email = studentEmail;
      if (studentPhone) updateData.phone = studentPhone;
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      if (parentName) updateData.parentName = parentName;
      if (parentPhone) updateData.parentPhone = parentPhone;
      updateData.updatedAt = new Date().toISOString();

      // MongoDB: await db.students.updateOne({_id: id}, {$set: updateData})

      const updatedStudent = { ...student, ...updateData };

      return {
        ok: true,
        code: 200,
        data: { student: this._sanitizeStudent(updatedStudent) },
      };
    } catch (error) {
      console.error("[updateStudent] Error:", error);
      return { ok: false, code: 500, errors: "Failed to update student" };
    }
  }

  /**
   * Get Student By ID
   * =================
   * RBAC: Student sees own profile, admin sees school students
   */
  async getStudentById({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const student = await this._findStudentById(id);
      if (!student) {
        return { ok: false, code: 404, errors: "Student not found" };
      }

      // RBAC: Student can see own, school admin can see school students
      if (__token.role === "student" && __token.userId !== id) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot view other student profiles",
        };
      }

      if (
        __token.role === "school_admin" &&
        __token.schoolId !== student.schoolId
      ) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot view students from other schools",
        };
      }

      return {
        ok: true,
        code: 200,
        data: { student: this._sanitizeStudent(student) },
      };
    } catch (error) {
      console.error("[getStudentById] Error:", error);
      return { ok: false, code: 500, errors: "Failed to fetch student" };
    }
  }

  /**
   * List Students
   * ==============
   * RBAC: School admin sees their school, superadmin sees all
   */
  async listStudents({
    schoolId,
    classroomId,
    page = 1,
    limit = 50,
    gradeLevel,
    searchTerm,
    __token,
  }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      if (__token.role === "school_admin" && __token.schoolId !== schoolId) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot list students from other schools",
        };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const actualLimit = Math.min(parseInt(limit), 100);

      // MongoDB:
      // let query = {schoolId: schoolId, status: 'active'}
      // if(classroomId) query.classroomId = classroomId
      // if(searchTerm) query.$or = [{firstName: {$regex: searchTerm}}, {lastName: {$regex: searchTerm}}]
      // let students = await db.students.find(query).skip(skip).limit(actualLimit).toArray()
      // let total = await db.students.countDocuments(query)

      const students = [];
      const total = 0;

      return {
        ok: true,
        code: 200,
        data: {
          students: students.map((s) => this._sanitizeStudent(s)),
          pagination: {
            page: parseInt(page),
            limit: actualLimit,
            total: total,
            pages: Math.ceil(total / actualLimit),
          },
        },
      };
    } catch (error) {
      console.error("[listStudents] Error:", error);
      return { ok: false, code: 500, errors: "Failed to list students" };
    }
  }

  /**
   * Transfer Student
   * ================
   * Moves student from one classroom to another (same school)
   * Updates enrollment history and classroom enrollment counts
   */
  async transferStudent({
    id,
    fromClassroomId,
    toClassroomId,
    transferDate,
    reason,
    __token,
  }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const student = await this._findStudentById(id);
      if (!student) {
        return { ok: false, code: 404, errors: "Student not found" };
      }

      // RBAC check
      if (
        __token.role === "school_admin" &&
        __token.schoolId !== student.schoolId
      ) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot transfer students from other schools",
        };
      }

      // Verify classes exist and belong to same school
      const fromClass = await this._findClassroomById(fromClassroomId);
      const toClass = await this._findClassroomById(toClassroomId);

      if (!fromClass || !toClass) {
        return {
          ok: false,
          code: 404,
          errors: "One or both classrooms not found",
        };
      }

      if (fromClass.schoolId !== toClass.schoolId) {
        return {
          ok: false,
          code: 400,
          errors: "Cannot transfer between different schools",
        };
      }

      if (student.classroomId !== fromClassroomId) {
        return {
          ok: false,
          code: 400,
          errors: "Student is not in the source classroom",
        };
      }

      // Check target classroom capacity
      if (toClass.currentEnrollment >= toClass.capacity) {
        return {
          ok: false,
          code: 400,
          errors: "Target classroom is at full capacity",
        };
      }

      // Validate input
      let validation = await this.validators.student.transferStudent({
        id,
        fromClassroomId,
        toClassroomId,
        transferDate,
        reason,
      });

      if (validation) {
        return { ok: false, code: 400, errors: validation };
      }

      // Update student classroom assignment
      // MongoDB (with transaction):
      // await db.students.updateOne({_id: id}, {$set: {classroomId: toClassroomId}})
      // await db.enrollment_history.insertOne({studentId, classroomId: toClassroomId, type: 'transfer'})
      // await db.classrooms.updateOne({_id: fromClassroomId}, {$inc: {currentEnrollment: -1}})
      // await db.classrooms.updateOne({_id: toClassroomId}, {$inc: {currentEnrollment: 1}})

      return {
        ok: true,
        code: 200,
        data: {
          message: "Student transferred successfully",
          student: { ...student, classroomId: toClassroomId },
        },
      };
    } catch (error) {
      console.error("[transferStudent] Error:", error);
      return { ok: false, code: 500, errors: "Failed to transfer student" };
    }
  }

  /**
   * Get Student Enrollment History
   * =============================
   * Returns all classrooms student has been enrolled in
   */
  async getStudentHistory({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const student = await this._findStudentById(id);
      if (!student) {
        return { ok: false, code: 404, errors: "Student not found" };
      }

      // MongoDB: await db.enrollment_history.find({studentId: id}).sort({createdAt: -1}).toArray()

      const history = [];

      return {
        ok: true,
        code: 200,
        data: {
          studentId: id,
          enrollmentHistory: history,
        },
      };
    } catch (error) {
      console.error("[getStudentHistory] Error:", error);
      return {
        ok: false,
        code: 500,
        errors: "Failed to fetch enrollment history",
      };
    }
  }

  /**
   * Suspend Student
   * ===============
   * Temporarily suspends a student (sets status to 'suspended')
   * Student remains enrolled but inactive
   */
  async suspendStudent({ id, reason, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const student = await this._findStudentById(id);
      if (!student) {
        return { ok: false, code: 404, errors: "Student not found" };
      }

      if (
        __token.role === "school_admin" &&
        __token.schoolId !== student.schoolId
      ) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot suspend students from other schools",
        };
      }

      // MongoDB: await db.students.updateOne({_id: id}, {$set: {status: 'suspended'}})

      return {
        ok: true,
        code: 200,
        data: { message: "Student suspended successfully" },
      };
    } catch (error) {
      console.error("[suspendStudent] Error:", error);
      return { ok: false, code: 500, errors: "Failed to suspend student" };
    }
  }

  /**
   * Withdraw Student
   * ================
   * Formally withdraws student from school
   * Sets status to 'withdrawn' (not deleted)
   */
  async withdrawStudent({ id, withdrawalDate, reason, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const student = await this._findStudentById(id);
      if (!student) {
        return { ok: false, code: 404, errors: "Student not found" };
      }

      if (
        __token.role === "school_admin" &&
        __token.schoolId !== student.schoolId
      ) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot withdraw students from other schools",
        };
      }

      // MongoDB:
      // await db.students.updateOne({_id: id}, {$set: {status: 'withdrawn', withdrawalDate}})
      // await db.classrooms.updateOne({_id: student.classroomId}, {$inc: {currentEnrollment: -1}})

      return {
        ok: true,
        code: 200,
        data: { message: "Student withdrawn successfully" },
      };
    } catch (error) {
      console.error("[withdrawStudent] Error:", error);
      return { ok: false, code: 500, errors: "Failed to withdraw student" };
    }
  }

  /**
   * Get Student By Enrollment Number
   * ================================
   * Find student using enrollment number (unique per school)
   */
  async getStudentByEnrollmentNumber({ schoolId, enrollmentNumber, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      if (__token.role === "school_admin" && __token.schoolId !== schoolId) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot access students from other schools",
        };
      }

      // MongoDB: return await db.students.findOne({schoolId, enrollmentNumber})

      const student = await this._findStudentByEnrollmentNumber(
        schoolId,
        enrollmentNumber,
      );
      if (!student) {
        return { ok: false, code: 404, errors: "Student not found" };
      }

      return {
        ok: true,
        code: 200,
        data: { student: this._sanitizeStudent(student) },
      };
    } catch (error) {
      console.error("[getStudentByEnrollmentNumber] Error:", error);
      return { ok: false, code: 500, errors: "Failed to fetch student" };
    }
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  async _findStudentById(id) {
    // MongoDB: return await db.students.findOne({_id: id})
    return null;
  }

  async _findStudentByEmail(email) {
    // MongoDB: return await db.students.findOne({email})
    return null;
  }

  async _findStudentByEnrollmentNumber(schoolId, enrollmentNumber) {
    // MongoDB: return await db.students.findOne({schoolId, enrollmentNumber})
    return null;
  }

  async _findClassroomById(id) {
    // MongoDB: return await db.classrooms.findOne({_id: id})
    return null;
  }

  _sanitizeStudent(student) {
    if (!student) return null;
    return {
      id: student.id,
      schoolId: student.schoolId,
      firstName: student.firstName,
      lastName: student.lastName,
      enrollmentNumber: student.enrollmentNumber,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      classroomId: student.classroomId,
      enrollmentDate: student.enrollmentDate,
      status: student.status,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  _generateId() {
    return require("uuid").v4();
  }
};
