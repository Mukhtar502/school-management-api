const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const errorHandler = require("../../../libs/errorHandler");

/**
 * User Manager - Authentication & User Management
 * ================================================
 * Handles all user-related operations:
 * - User registration (createUserAccount)
 * - User login authentication (loginUser)
 * - User profile management (updateUserProfile)
 * - Role-based access control (RBAC)
 *
 * This manager is exposed via HTTP endpoints through the httpExposed array
 * Each method can have middleware specified in the method name (e.g., __token for auth)
 */
module.exports = class User {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
  } = {}) {
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.responseDispatcher = managers.responseDispatcher;
    this.usersCollection = "users";

    /**
     * HTTP EXPOSED ENDPOINTS
     * =====================
     * Format: 'methodName' or 'httpMethod=methodName'
     * Default is POST if not specified
     *
     * Examples:
     * - 'registerUser' → POST /api/user/registerUser
     * - 'get=loginUser' → GET /api/user/loginUser (not typical, but possible)
     *
     * Methods here are the ONLY ones accessible via HTTP
     */
    this.httpExposed = [
      "registerUser", // POST - User registration/signup
      "loginUser", // POST - User login authentication
      "get=getUserById", // GET - Get user details by ID
      "post=updateUserProfile", // POST - Update own profile
      "post=changePassword", // POST - Change password
      "post=logoutUser", // POST - Logout (blacklist token)
    ];
  }

  /**
   * Register User (Sign Up)
   * ======================
   * Creates a new user account with validated data
   *
   * Parameters from request body:
   * @param {string} username - Unique username (3-20 chars)
   * @param {string} email - User email (must be unique)
   * @param {string} password - Password (min 8 chars) - will be hashed
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @param {string} role - User role (superadmin, school_admin, teacher, student)
   */
  async registerUser({
    username,
    email,
    password,
    firstName,
    lastName,
    role = "student",
  }) {
    try {
      // STEP 0: VALIDATE REQUIRED FIELDS
      // ================================
      const requiredFields = { username, email, password, firstName, lastName };
      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value || (typeof value === "string" && !value.trim())) {
          return {
            ok: false,
            code: 400,
            errors: [
              {
                field,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
              },
            ],
          };
        }
      }

      // STEP 1: VALIDATE INPUT
      // =====================
      let validation = await this.validators.user.registerUser({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
      });

      // If validation failed, return detailed error response
      if (validation) {
        const errorArray = Array.isArray(validation)
          ? validation.map((err) => ({
              message: err.message || err,
              field: err.field,
            }))
          : [
              {
                message: validation.message || validation,
              },
            ];
        return {
          ok: false,
          code: 400,
          errors: errorArray,
        };
      }

      // STEP 2: CHECK IF USER EXISTS
      // ============================
      const existingUser = await this._findUserByEmail(email);
      if (existingUser) {
        return {
          ok: false,
          code: 409,
          errors: [
            {
              field: "email",
              message:
                "This email is already registered. Please use a different email or login to your existing account.",
            },
          ],
        };
      }

      const existingUsername = await this._findUserByUsername(username);
      if (existingUsername) {
        return {
          ok: false,
          code: 409,
          errors: [
            {
              field: "username",
              message:
                "This username is already taken. Please choose a different username.",
            },
          ],
        };
      }

      // STEP 3: HASH PASSWORD
      // ====================
      // Password will be hashed by Mongoose pre-save middleware
      const hashedPassword = await bcrypt.hash(password, 10);

      // STEP 4: CREATE USER OBJECT
      // =========================
      const userId = uuidv4();
      const newUser = {
        id: userId,
        username,
        email,
        password: hashedPassword, // Mongoose expects "password" field
        firstName,
        lastName,
        role,
        status: "active",
      };

      // STEP 5: SAVE TO DATABASE (MONGODB)
      // ==================================
      const savedUser = await this.mongomodels.user.create(newUser);

      // STEP 6: GENERATE JWT TOKENS
      // ===========================
      const longToken = this.tokenManager.genLongToken({
        userId: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      });

      const shortToken = this.tokenManager.genShortToken({
        userId: savedUser.id,
      });

      // STEP 7: CACHE THE TOKEN (REDIS)
      // =======================================================
      await this.cache.key.set({
        key: `user:${userId}:token`,
        data: JSON.stringify({ longToken, shortToken }),
        ttl: 7 * 24 * 60 * 60,
      });

      // STEP 8: RETURN SUCCESS RESPONSE
      // ===============================
      return {
        user: {
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          status: savedUser.status,
        },
        accessToken: longToken,
      };
    } catch (error) {
      console.error("[registerUser] Error:", error);
      return {
        ok: false,
        code: 500,
        errors: [
          {
            message:
              "An unexpected error occurred during registration. Please try again.",
            details: error.message,
          },
        ],
      };
    }
  }

  /**
   * Login User
   * ==========
   * Authenticates user with username and password
   * Returns JWT tokens on success
   *
   * Parameters from request body:
   * @param {string} username - User's username
   * @param {string} password - User's password (plain text, will be bcrypt compared)
   */
  async loginUser({ username, password }) {
    try {
      // Validate required fields
      if (!username || !password) {
        return {
          ok: false,
          code: 400,
          errors: [
            {
              field: username ? "password" : "username",
              message: `${username ? "Password" : "Username"} is required`,
            },
          ],
        };
      }

      // STEP 1: VALIDATE INPUT
      // =====================
      let validation = await this.validators.user.loginUser({
        username,
        password,
      });

      if (validation) {
        return {
          ok: false,
          code: 400,
          errors: Array.isArray(validation)
            ? validation.map((err) => ({
                message: err.message || err,
              }))
            : [{ message: validation }],
        };
      }

      // STEP 2: FIND USER BY USERNAME
      // ============================
      const user = await this._findUserByUsername(username);
      if (!user) {
        return {
          ok: false,
          code: 401,
          errors: [
            {
              message: "Invalid username or password",
            },
          ],
        };
      }

      // STEP 3: VERIFY PASSWORD
      // ======================
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return {
          ok: false,
          code: 401,
          errors: [
            {
              message: "Invalid username or password",
            },
          ],
        };
      }

      // STEP 4: CHECK USER STATUS
      // ========================
      if (user.status !== "active") {
        return {
          ok: false,
          code: 403,
          errors: [
            {
              message: `Your account is currently ${user.status}. Please contact the administrator for assistance.`,
            },
          ],
        };
      }

      // STEP 5: GENERATE JWT TOKENS
      // ===========================
      const longToken = this.tokenManager.genLongToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const shortToken = this.tokenManager.genShortToken({
        userId: user.id,
      });

      // STEP 6: UPDATE LAST LOGIN
      // =========================
      user.lastLogin = new Date().toISOString();
      await this._updateUser(user.id, { lastLogin: user.lastLogin });

      // STEP 7: CACHE TOKEN
      // ==================
      await this.cache.key.set({
        key: `user:${user.id}:token`,
        data: JSON.stringify({ longToken, shortToken }),
        ttl: 7 * 24 * 60 * 60,
      });

      // STEP 8: RETURN SUCCESS RESPONSE
      // ===============================
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken: longToken,
      };
    } catch (error) {
      console.error("[loginUser] Error:", error);
      return {
        ok: false,
        code: 500,
        errors: [
          {
            message: "An error occurred during login. Please try again.",
            details: error.message,
          },
        ],
      };
    }
  }

  /**
   * Get User By ID
   * ==============
   * Retrieves user details by ID
   * Requires token authentication
   *
   * @param {string} id - User ID to retrieve
   * @param {object} __token - User's JWT token (injected by middleware)
   */
  async getUserById({ id, __token }) {
    try {
      // Validate authentication
      const authCheck = errorHandler.validateRequired({ id }, ["id"]);
      if (authCheck) return authCheck;

      if (!__token) {
        return errorHandler.unauthorized(
          "Authentication required. Please login.",
        );
      }

      // Authorization check
      const accessCheck = errorHandler.checkResourceOwnership(
        __token.userId,
        id,
        __token.role,
      );
      if (accessCheck) return accessCheck;

      // Fetch user from database
      const user = await this._findUserById(id);
      if (!user) {
        return errorHandler.notFound("User");
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      console.error("[getUserById] Error:", error);
      return errorHandler.internalError("Failed to fetch user", error.message);
    }
  }

  /**
   * Update User Profile
   * ===================
   * Updates user's profile information
   * Users can update their own, admins can update others
   *
   * @param {string} id - User ID to update
   * @param {string} firstName - New first name
   * @param {string} lastName - New last name
   * @param {string} email - New email
   * @param {object} __token - User's JWT token
   */
  async updateUserProfile({ id, firstName, lastName, email, __token }) {
    try {
      if (!__token) {
        return errorHandler.unauthorized(
          "Authentication required to update profile",
        );
      }

      // Authorization check
      const accessCheck = errorHandler.checkResourceOwnership(
        __token.userId,
        id,
        __token.role,
      );
      if (accessCheck) return accessCheck;

      // Validate updated fields
      let validation = await this.validators.user.updateUserProfile({
        id,
        firstName,
        lastName,
        email,
      });

      if (validation) {
        const validationErrors = Array.isArray(validation)
          ? validation.map((err) => ({ message: err }))
          : [{ message: validation }];
        return errorHandler.validationErrors(validationErrors);
      }

      // Check if new email is unique (if changed)
      if (email) {
        const existingUser = await this._findUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return errorHandler.conflict("This email is already in use", "email");
        }
      }

      // Update user in database
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      updateData.updatedAt = new Date().toISOString();

      const updatedUser = await this._updateUser(id, updateData);
      if (!updatedUser) {
        return errorHandler.notFound("User");
      }

      return {
        user: updatedUser,
      };
    } catch (error) {
      console.error("[updateUserProfile] Error:", error);
      return errorHandler.internalError(
        "Failed to update profile",
        error.message,
      );
    }
  }

  /**
   * Change Password
   * ===============
   * Allows user to change their password
   * Requires current password verification
   */
  async changePassword({ id, currentPassword, newPassword, __token }) {
    try {
      // Validate required fields
      const requiredCheck = errorHandler.validateRequired(
        { id, currentPassword, newPassword },
        ["id", "currentPassword", "newPassword"],
      );
      if (requiredCheck) return requiredCheck;

      if (!__token) {
        return errorHandler.unauthorized(
          "Authentication required to change password",
        );
      }

      // Users can only change their own password
      if (__token.userId !== id) {
        return errorHandler.forbidden("You can only change your own password");
      }

      // Get user to verify current password
      const user = await this._findUserById(id);
      if (!user) {
        return errorHandler.notFound("User");
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );
      if (!passwordMatch) {
        return errorHandler.badRequest(
          "Current password is incorrect",
          "currentPassword",
        );
      }

      // Validate new password
      let validation = await this.validators.user.changePassword({
        id,
        currentPassword,
        newPassword,
      });

      if (validation) {
        const validationErrors = Array.isArray(validation)
          ? validation.map((err) => ({ message: err }))
          : [{ message: validation }];
        return errorHandler.validationErrors(validationErrors);
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this._updateUser(id, {
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString(),
      });

      return {
        message: "Password changed successfully",
      };
    } catch (error) {
      console.error("[changePassword] Error:", error);
      return errorHandler.internalError(
        "Failed to change password",
        error.message,
      );
    }
  }

  /**
   * Logout User
   * ===========
   * Invalidates user's JWT tokens
   * In practice, this blacklists the token
   */
  async logoutUser({ __token }) {
    try {
      if (!__token) {
        return errorHandler.unauthorized("Please login before logout");
      }

      // Invalidate tokens by removing from cache
      await this.cache.key.delete({ key: `user:${__token.userId}:token` });

      return {
        message: "You have been logged out successfully",
      };
    } catch (error) {
      console.error("[logoutUser] Error:", error);
      return errorHandler.internalError("Logout failed", error.message);
    }
  }

  // ========================================================================
  // PRIVATE HELPER METHODS (not exposed via HTTP)
  // ========================================================================

  /**
   * Find user by email
   * Used internally for checking email uniqueness and login
   */
  async _findUserByEmail(email) {
    try {
      return await this.mongomodels.user.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
      });
    } catch (error) {
      console.error("[_findUserByEmail] Error:", error);
      return null;
    }
  }

  /**
   * Find user by username
   * Used internally for login and username uniqueness check
   */
  async _findUserByUsername(username) {
    try {
      return await this.mongomodels.user.findOne({
        username: username.toLowerCase(),
        isDeleted: false,
      });
    } catch (error) {
      console.error("[_findUserByUsername] Error:", error);
      return null;
    }
  }

  /**
   * Find user by ID
   */
  async _findUserById(id) {
    try {
      return await this.mongomodels.user.findOne({
        id: id,
        isDeleted: false,
      });
    } catch (error) {
      console.error("[_findUserById] Error:", error);
      return null;
    }
  }

  /**
   * Update user data
   */
  async _updateUser(id, updateData) {
    try {
      return await this.mongomodels.user.findOneAndUpdate(
        { id: id, isDeleted: false },
        { ...updateData, updatedAt: new Date() },
        { new: true },
      );
    } catch (error) {
      console.error("[_updateUser] Error:", error);
      return null;
    }
  }
};
