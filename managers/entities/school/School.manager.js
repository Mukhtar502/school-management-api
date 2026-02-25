/**
 * School Manager - School CRUD Operations
 * ======================================
 * Manages all school-related operations
 * Only accessible by Superadmin (RBAC enforced)
 * Schools are the top-level organizational unit
 *
 * Responsibilities:
 * - Create new schools
 * - Update school information
 * - Retrieve school details
 * - List all schools with pagination
 * - Retrieve school statistics
 * - Soft delete schools (status = inactive)
 */

module.exports = class School {
  constructor({ utils, cache, config, validators, managers, mongomodels }) {
    this.config = config;
    this.cache = cache;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.responseDispatcher = managers.responseDispatcher;

    // Database collection name
    this.schoolsCollection = "schools";

    /**
     * HTTP EXPOSED ENDPOINTS
     * =====================
     * Methods that can be called via HTTP API
     * Format: 'httpMethod=methodName' or just 'methodName' (defaults to POST)
     */
    this.httpExposed = [
      "post=createSchool", // POST /api/school/createSchool
      "post=updateSchool", // POST /api/school/updateSchool
      "get=getSchoolById", // GET /api/school/getSchoolById
      "get=listSchools", // GET /api/school/listSchools
      "post=deleteSchool", // POST /api/school/deleteSchool
      "get=getSchoolStats", // GET /api/school/getSchoolStats
    ];
  }

  /**
   * Create School
   * =============
   * RBAC: Only superadmin
   * Creates a new school entry in the system
   *
   * @param {string} schoolName - School name
   * @param {string} schoolAddress - Physical address
   * @param {string} schoolPhone - Contact phone
   * @param {string} schoolEmail - School email
   * @param {string} principalName - Principal's name
   * @param {string} schoolCode - Unique school code
   * @param {number} establishedYear - Year established
   * @param {object} __token - JWT token from middleware (RBAC check)
   */
  async createSchool({
    schoolName,
    schoolAddress,
    schoolPhone,
    schoolEmail,
    principalName,
    schoolCode,
    establishedYear,
    __token,
  }) {
    try {
      // STEP 1: AUTHENTICATE & AUTHORIZE
      // ================================
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      // RBAC: Only superadmin can create schools
      if (__token.role !== "superadmin") {
        return {
          ok: false,
          code: 403,
          errors: "Only superadmin can create schools",
        };
      }

      // STEP 2: CHECK FOR UNDEFINED/NULL REQUIRED FIELDS
      // ================================================
      if (!schoolName)
        return { ok: false, code: 400, errors: "schoolName is required" };
      if (!schoolAddress)
        return { ok: false, code: 400, errors: "schoolAddress is required" };
      if (!schoolPhone)
        return { ok: false, code: 400, errors: "schoolPhone is required" };
      if (!schoolEmail)
        return { ok: false, code: 400, errors: "schoolEmail is required" };
      if (!principalName)
        return { ok: false, code: 400, errors: "principalName is required" };
      if (!schoolCode)
        return { ok: false, code: 400, errors: "schoolCode is required" };

      // STEP 3: VALIDATE INPUT
      // =====================
      let validation = await this.validators.school.createSchool({
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        principalName,
        schoolCode,
        establishedYear,
      });

      if (validation) {
        return { ok: false, code: 400, errors: validation };
      }

      // STEP 3: CHECK UNIQUENESS
      // =======================
      // School code must be unique for identification
      const existingSchool = await this._findSchoolByCode(schoolCode);
      if (existingSchool) {
        return {
          ok: false,
          code: 409,
          errors: "School code already exists. Please use a different code.",
        };
      }

      // STEP 4: CREATE SCHOOL OBJECT
      // ============================
      const schoolId = require("uuid").v4();
      const schoolData = {
        id: schoolId,
        name: schoolName,
        shortCode: schoolCode,
        address: schoolAddress,
        phone: schoolPhone,
        email: schoolEmail,
        principalName: principalName,
        totalClassrooms: 0,
        totalStudents: 0,
        totalTeachers: 0,
        status: "active",
      };

      // STEP 5: SAVE TO DATABASE (MONGODB)
      // ==================================
      const savedSchool = await this.mongomodels.school.create(schoolData);

      // STEP 6: RETURN SUCCESS
      // ====================
      return {
        school: {
          id: savedSchool.id,
          name: savedSchool.name,
          shortCode: savedSchool.shortCode,
          address: savedSchool.address,
          phone: savedSchool.phone,
          email: savedSchool.email,
          principalName: savedSchool.principalName,
          status: savedSchool.status,
        },
      };
    } catch (error) {
      console.error("[createSchool] Error:", error);
      return { ok: false, code: 500, errors: "Failed to create school" };
    }
  }

  /**
   * Update School
   * =============
   * RBAC: Only superadmin
   * Updates school information
   */
  async updateSchool({
    id,
    schoolName,
    schoolAddress,
    schoolPhone,
    schoolEmail,
    principalName,
    establishedYear,
    __token,
  }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      if (__token.role !== "superadmin") {
        return {
          ok: false,
          code: 403,
          errors: "Only superadmin can update schools",
        };
      }

      // Validate input
      let validation = await this.validators.school.updateSchool({
        id,
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        principalName,
        establishedYear,
      });

      if (validation) {
        return { ok: false, code: 400, errors: validation };
      }

      // Find existing school
      const school = await this._findSchoolById(id);
      if (!school) {
        return { ok: false, code: 404, errors: "School not found" };
      }

      // Update fields
      const updateData = {};
      if (schoolName) updateData.name = schoolName;
      if (schoolAddress) updateData.address = schoolAddress;
      if (schoolPhone) updateData.phone = schoolPhone;
      if (schoolEmail) updateData.email = schoolEmail;
      if (principalName) updateData.principalName = principalName;
      if (establishedYear) updateData.establishedYear = establishedYear;

      // Update in MongoDB
      const updatedSchool = await this.mongomodels.school.findOneAndUpdate(
        { id: id, isDeleted: false },
        updateData,
        { new: true },
      );

      return {
        school: {
          id: updatedSchool.id,
          name: updatedSchool.name,
          shortCode: updatedSchool.shortCode,
          address: updatedSchool.address,
          phone: updatedSchool.phone,
          email: updatedSchool.email,
          principalName: updatedSchool.principalName,
          status: updatedSchool.status,
        },
      };
    } catch (error) {
      console.error("[updateSchool] Error:", error);
      return { ok: false, code: 500, errors: "Failed to update school" };
    }
  }

  /**
   * Get School By ID
   * ================
   * RBAC: Superadmin can get any school
   *       School admin can get their own school
   */
  async getSchoolById({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const school = await this._findSchoolById(id);
      if (!school) {
        return { ok: false, code: 404, errors: "School not found" };
      }

      return {
        school: {
          id: school.id,
          name: school.name,
          shortCode: school.shortCode,
          address: school.address,
          phone: school.phone,
          email: school.email,
          principalName: school.principalName,
          status: school.status,
        },
      };
    } catch (error) {
      console.error("[getSchoolById] Error:", error);
      return { ok: false, code: 500, errors: "Failed to fetch school" };
    }
  }

  /**
   * List Schools
   * ============
   * RBAC: Only superadmin
   * Gets all schools with pagination and filtering
   */
  async listSchools({ page = 1, limit = 20, searchTerm, status, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      if (__token.role !== "superadmin") {
        return {
          ok: false,
          code: 403,
          errors: "Only superadmin can list schools",
        };
      }

      // Pagination logic
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const maxLimit = 100;
      const actualLimit = Math.min(parseInt(limit), maxLimit);

      // Build query filter
      const filter = { isDeleted: false };
      if (status) filter.status = status;
      if (searchTerm) {
        filter.$or = [
          { name: { $regex: searchTerm, $options: "i" } },
          { shortCode: { $regex: searchTerm, $options: "i" } },
        ];
      }

      // Query MongoDB
      const schools = await this.mongomodels.school
        .find(filter)
        .skip(skip)
        .limit(actualLimit)
        .lean();

      const total = await this.mongomodels.school.countDocuments(filter);

      return {
        schools: schools.map((s) => ({
          id: s.id,
          name: s.name,
          shortCode: s.shortCode,
          email: s.email,
          phone: s.phone,
          status: s.status,
        })),
        pagination: {
          page: parseInt(page),
          limit: actualLimit,
          total: total,
          pages: Math.ceil(total / actualLimit),
        },
      };
    } catch (error) {
      console.error("[listSchools] Error:", error);
      return { ok: false, code: 500, errors: "Failed to list schools" };
    }
  }

  /**
   * Delete School (Soft Delete)
   * ===========================
   * RBAC: Only superadmin
   * Sets school status to inactive instead of hard delete
   */
  async deleteSchool({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      if (__token.role !== "superadmin") {
        return {
          ok: false,
          code: 403,
          errors: "Only superadmin can delete schools",
        };
      }

      const school = await this._findSchoolById(id);
      if (!school) {
        return { ok: false, code: 404, errors: "School not found" };
      }

      // Soft delete: set isDeleted flag
      await this.mongomodels.school.findOneAndUpdate(
        { id: id },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );

      return {
        message: "School deactivated successfully",
      };
    } catch (error) {
      console.error("[deleteSchool] Error:", error);
      return { ok: false, code: 500, errors: "Failed to delete school" };
    }
  }

  /**
   * Get School Statistics
   * =====================
   * RBAC: Superadmin
   * Returns statistics about the school
   */
  async getSchoolStats({ id, __token }) {
    try {
      if (!__token) {
        return { ok: false, code: 401, errors: "Authentication required" };
      }

      const school = await this._findSchoolById(id);
      if (!school) {
        return { ok: false, code: 404, errors: "School not found" };
      }

      // Get real statistics from MongoDB
      const totalClassrooms = await this.mongomodels.classroom.countDocuments({
        schoolId: id,
        isDeleted: false,
      });
      const totalStudents = await this.mongomodels.student.countDocuments({
        schoolId: id,
        isDeleted: false,
      });
      const totalTeachers = await this.mongomodels.user.countDocuments({
        schoolId: id,
        role: "teacher",
        isDeleted: false,
      });

      const stats = {
        schoolId: id,
        schoolName: school.name,
        totalClassrooms,
        totalStudents,
        totalTeachers,
        averageStudentsPerClass:
          totalClassrooms > 0 ? Math.round(totalStudents / totalClassrooms) : 0,
        status: school.status,
      };

      return {
        statistics: stats,
      };
    } catch (error) {
      console.error("[getSchoolStats] Error:", error);
      return {
        ok: false,
        code: 500,
        errors: "Failed to get school statistics",
      };
    }
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  async _findSchoolById(id) {
    try {
      return await this.mongomodels.school.findOne({
        id: id,
        isDeleted: false,
      });
    } catch (error) {
      console.error("[_findSchoolById] Error:", error);
      return null;
    }
  }

  async _findSchoolByCode(code) {
    try {
      return await this.mongomodels.school.findOne({
        shortCode: code,
        isDeleted: false,
      });
    } catch (error) {
      console.error("[_findSchoolByCode] Error:", error);
      return null;
    }
  }

  _sanitizeSchool(school) {
    // Remove sensitive fields before sending to client
    if (!school) return null;
    return {
      id: school.id,
      name: school.name,
      address: school.address,
      phone: school.phone,
      email: school.email,
      principalName: school.principalName,
      code: school.code,
      establishedYear: school.establishedYear,
      status: school.status,
      statistics: school.statistics,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };
  }

  _generateId() {
    // For MongoDB: new ObjectId()
    // For simple UUID: uuid()
    return require("uuid").v4();
  }
};
