/**
 * Classroom Manager - Classroom CRUD Operations
 * =============================================
 * Manages all classroom-related operations
 * RBAC: School admins manage classrooms in their school
 *
 * Responsibilities:
 * - Create classrooms in a school
 * - Update classroom information
 * - Retrieve classroom details with enrollment info
 * - List classrooms with filtering by grade/school
 * - Check classroom availability before student enrollment
 * - Retrieve student enrollment list
 * - Soft delete classrooms
 */

module.exports = class Classroom {
  constructor({ utils, cache, config, validators, managers, mongomodels }) {
    this.config = config;
    this.cache = cache;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.responseDispatcher = managers.responseDispatcher;

    this.classroomsCollection = "classrooms";
    this.studentsCollection = "students";

    this.httpExposed = [
      "post=createClassroom",
      "post=updateClassroom",
      "get=getClassroomById",
      "get=listClassrooms",
      "post=deleteClassroom",
      "get=getClassroomEnrollment",
      "get=checkClassroomAvailability",
    ];
  }

  /**
   * Create Classroom
   * ===============
   * RBAC: School admin can create classrooms in their school
   *
   * Creates a new classroom entity
   * Each classroom has unique grade+section combination per school
   */
  async createClassroom({
    schoolId,
    classroomName,
    gradeLevel,
    section,
    capacity,
    roomNumber,
    __token,
  }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      // RBAC: Only school_admin (for their school) or superadmin
      if (__token.role === "school_admin" && __token.schoolId !== schoolId) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot create classrooms in other schools",
        };
      }

      if (!["superadmin", "school_admin"].includes(__token.role)) {
        return {
          ok: false,
          code: 403,
          errors: "Only school admin can create classrooms",
        };
      }

      // CHECK FOR UNDEFINED/NULL REQUIRED FIELDS
      if (!schoolId)
        return { ok: false, code: 400, errors: "schoolId is required" };
      if (!classroomName)
        return { ok: false, code: 400, errors: "classroomName is required" };
      if (!gradeLevel)
        return { ok: false, code: 400, errors: "gradeLevel is required" };
      if (!section)
        return { ok: false, code: 400, errors: "section is required" };
      if (!capacity)
        return { ok: false, code: 400, errors: "capacity is required" };

      // Validate input
      let validation = await this.validators.classroom.createClassroom({
        schoolId,
        classroomName,
        gradeLevel,
        section,
        capacity,
        roomNumber,
      });

      if (validation) {
        return { ok: false, code: 400, errors: validation };
      }

      // Capacity must be positive
      if (capacity <= 0) {
        return {
          ok: false,
          code: 400,
          errors: "Capacity must be greater than 0",
        };
      }

      // Check if classroom already exists (same grade and section in school)
      const existing = await this._findClassroomByGradeAndSection(
        schoolId,
        gradeLevel,
        section,
      );
      if (existing) {
        return {
          ok: false,
          code: 409,
          errors: `Classroom Grade ${gradeLevel}-${section} already exists in this school`,
        };
      }

      // Create classroom object
      const classroomId = require("uuid").v4();
      const classroomData = {
        id: classroomId,
        schoolId: schoolId,
        name: classroomName,
        gradeLevel: gradeLevel,
        section: section,
        capacity: capacity,
        enrolledCount: 0,
        enrolledStudents: [],
        roomNumber: roomNumber,
        status: "active",
      };

      // Save to MongoDB
      const savedClassroom =
        await this.mongomodels.classroom.create(classroomData);

      return {
        classroom: {
          id: savedClassroom.id,
          name: savedClassroom.name,
          gradeLevel: savedClassroom.gradeLevel,
          section: savedClassroom.section,
          capacity: savedClassroom.capacity,
          enrolledCount: savedClassroom.enrolledCount,
          roomNumber: savedClassroom.roomNumber,
          status: savedClassroom.status,
        },
      };
    } catch (error) {
      console.error("[createClassroom] Error:", error);
      return { ok: false, code: 500, errors: "Failed to create classroom" };
    }
  }

  /**
   * Update Classroom
   * ===============
   * Updates classroom information
   * Cannot change grade/section (immutable for data integrity)
   */
  async updateClassroom({ id, classroomName, capacity, roomNumber, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const classroom = await this._findClassroomById(id);
      if (!classroom) {
        return { ok: false, code: 404, errors: "Classroom not found" };
      }

      // RBAC: School admin can only update their own school's classrooms
      if (
        __token.role === "school_admin" &&
        __token.schoolId !== classroom.schoolId
      ) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot update classrooms in other schools",
        };
      }

      if (!["superadmin", "school_admin"].includes(__token.role)) {
        return {
          ok: false,
          code: 403,
          errors: "Only school admin can update classrooms",
        };
      }

      // Validate input
      let validation = await this.validators.classroom.updateClassroom({
        id,
        classroomName,
        capacity,
        roomNumber,
      });

      if (validation) {
        return { ok: false, code: 400, errors: validation };
      }

      // If capacity is being reduced, ensure it's not below current enrollment
      if (capacity && capacity < classroom.enrolledCount) {
        return {
          ok: false,
          code: 400,
          errors: `Cannot reduce capacity below current enrollment (${classroom.enrolledCount})`,
        };
      }

      const updateData = {};
      if (classroomName) updateData.name = classroomName;
      if (capacity) updateData.capacity = capacity;
      if (roomNumber) updateData.roomNumber = roomNumber;

      // Update in MongoDB
      const updatedClassroom =
        await this.mongomodels.classroom.findOneAndUpdate(
          { id: id, isDeleted: false },
          updateData,
          { new: true },
        );

      return {
        classroom: {
          id: updatedClassroom.id,
          name: updatedClassroom.name,
          gradeLevel: updatedClassroom.gradeLevel,
          section: updatedClassroom.section,
          capacity: updatedClassroom.capacity,
          enrolledCount: updatedClassroom.enrolledCount,
          status: updatedClassroom.status,
        },
      };
    } catch (error) {
      console.error("[updateClassroom] Error:", error);
      return { ok: false, code: 500, errors: "Failed to update classroom" };
    }
  }

  /**
   * Get Classroom By ID
   * ===================
   * Retrieves detailed classroom information
   */
  async getClassroomById({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const classroom = await this._findClassroomById(id);
      if (!classroom) {
        return { ok: false, code: 404, errors: "Classroom not found" };
      }

      return {
        classroom: {
          id: classroom.id,
          name: classroom.name,
          gradeLevel: classroom.gradeLevel,
          section: classroom.section,
          capacity: classroom.capacity,
          enrolledCount: classroom.enrolledCount,
          enrolledStudents: classroom.enrolledStudents,
          roomNumber: classroom.roomNumber,
          status: classroom.status,
        },
      };
    } catch (error) {
      console.error("[getClassroomById] Error:", error);
      return { ok: false, code: 500, errors: "Failed to fetch classroom" };
    }
  }

  /**
   * List Classrooms
   * ===============
   * RBAC: School admin sees only their school's classrooms
   *       Superadmin sees all classrooms
   */
  async listClassrooms({
    schoolId,
    page = 1,
    limit = 20,
    gradeLevel,
    __token,
  }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      // RBAC: School admin can only list their own school
      if (__token.role === "school_admin" && __token.schoolId !== schoolId) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot list classrooms in other schools",
        };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const actualLimit = Math.min(parseInt(limit), 100);

      // Build query filter
      const filter = { schoolId, isDeleted: false };
      if (gradeLevel) filter.gradeLevel = gradeLevel;

      // Query MongoDB
      const classrooms = await this.mongomodels.classroom
        .find(filter)
        .skip(skip)
        .limit(actualLimit)
        .lean();

      const total = await this.mongomodels.classroom.countDocuments(filter);

      return {
        classrooms: classrooms.map((c) => ({
          id: c.id,
          name: c.name,
          gradeLevel: c.gradeLevel,
          section: c.section,
          capacity: c.capacity,
          enrolledCount: c.enrolledCount,
          status: c.status,
        })),
        pagination: {
          page: parseInt(page),
          limit: actualLimit,
          total: total,
          pages: Math.ceil(total / actualLimit),
        },
      };
    } catch (error) {
      console.error("[listClassrooms] Error:", error);
      return { ok: false, code: 500, errors: "Failed to list classrooms" };
    }
  }

  /**
   * Delete Classroom (Soft Delete)
   * =============================
   *Sets status to inactive
   * Cannot delete if has enrolled students
   */
  async deleteClassroom({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const classroom = await this._findClassroomById(id);
      if (!classroom) {
        return { ok: false, code: 404, errors: "Classroom not found" };
      }

      // RBAC check
      if (
        __token.role === "school_admin" &&
        __token.schoolId !== classroom.schoolId
      ) {
        return {
          ok: false,
          code: 403,
          errors: "Cannot delete classrooms in other schools",
        };
      }

      // Check if classroom has students
      if (classroom.enrolledCount > 0) {
        return {
          ok: false,
          code: 400,
          errors: `Cannot delete classroom with enrolled students (${classroom.enrolledCount})`,
        };
      }

      // Soft delete
      await this.mongomodels.classroom.findOneAndUpdate(
        { id: id },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );

      return {
        message: "Classroom deleted successfully",
      };
    } catch (error) {
      console.error("[deleteClassroom] Error:", error);
      return { ok: false, code: 500, errors: "Failed to delete classroom" };
    }
  }

  /**
   * Get Classroom Enrollment
   * =======================
   * Returns list of students enrolled in the classroom
   */
  async getClassroomEnrollment({ id, page = 1, limit = 50, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const classroom = await this._findClassroomById(id);
      if (!classroom) {
        return { ok: false, code: 404, errors: "Classroom not found" };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const actualLimit = Math.min(parseInt(limit), 100);

      // MongoDB:
      // let students = await db.students.find({classroomId: id, status: 'active'})
      //     .skip(skip).limit(actualLimit).toArray()
      // let total = await db.students.countDocuments({classroomId: id, status: 'active'})

      const students = [];
      const total = 0;

      return {
        ok: true,
        code: 200,
        data: {
          classroomId: id,
          classroomName: classroom.name,
          enrolledStudents: students,
          totalEnrolled: total,
          capacity: classroom.capacity,
          availableSeats: classroom.capacity - total,
          pagination: {
            page: parseInt(page),
            limit: actualLimit,
            total: total,
            pages: Math.ceil(total / actualLimit),
          },
        },
      };
    } catch (error) {
      console.error("[getClassroomEnrollment] Error:", error);
      return {
        ok: false,
        code: 500,
        errors: "Failed to get classroom enrollment",
      };
    }
  }

  /**
   * Check Classroom Availability
   * =============================
   * Checks if classroom has available seats
   * Used before enrolling a student
   */
  async checkClassroomAvailability({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const classroom = await this._findClassroomById(id);
      if (!classroom) {
        return { ok: false, code: 404, errors: "Classroom not found" };
      }

      const available = classroom.capacity - classroom.enrolledCount;
      const hasAvailability = available > 0;

      return {
        classroomId: id,
        capacity: classroom.capacity,
        enrolledCount: classroom.enrolledCount,
        availableSeats: available,
        hasAvailability: hasAvailability,
        enrollmentPercentage: Math.round(
          (classroom.enrolledCount / classroom.capacity) * 100,
        ),
      };
    } catch (error) {
      console.error("[checkClassroomAvailability] Error:", error);
      return { ok: false, code: 500, errors: "Failed to check availability" };
    }
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  async _findClassroomById(id) {
    try {
      return await this.mongomodels.classroom.findOne({
        id: id,
        isDeleted: false,
      });
    } catch (error) {
      console.error("[_findClassroomById] Error:", error);
      return null;
    }
  }

  async _findClassroomByGradeAndSection(schoolId, gradeLevel, section) {
    try {
      return await this.mongomodels.classroom.findOne({
        schoolId,
        gradeLevel,
        section,
        isDeleted: false,
      });
    } catch (error) {
      console.error("[_findClassroomByGradeAndSection] Error:", error);
      return null;
    }
  }

  _sanitizeClassroom(classroom) {
    if (!classroom) return null;
    return {
      id: classroom.id,
      schoolId: classroom.schoolId,
      name: classroom.name,
      gradeLevel: classroom.gradeLevel,
      section: classroom.section,
      capacity: classroom.capacity,
      currentEnrollment: classroom.currentEnrollment,
      roomNumber: classroom.roomNumber,
      status: classroom.status,
      createdAt: classroom.createdAt,
      updatedAt: classroom.updatedAt,
    };
  }

  _generateId() {
    return require("uuid").v4();
  }
};
