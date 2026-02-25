const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * User Schema
 * ===========================================================
 * Defines MongoDB schema for user documents
 * Handles authentication, profile, and account management
 */

const userSchema = new mongoose.Schema(
  {
    // Unique identifiers
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "UUID for the user",
    },

    // Authentication
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_-]+$/,
      description: "Unique username for login",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      description: "User email address",
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      description: "Bcrypt hashed password (never exposed)",
    },

    // Profile
    firstName: {
      type: String,
      required: true,
      trim: true,
      description: "User's first name",
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      description: "User's last name",
    },

    // Role and Status
    role: {
      type: String,
      enum: ["superadmin", "school_admin", "teacher", "student"],
      default: "student",
      description: "User role for RBAC",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      description: "Account status",
    },

    // School Association (for school_admin, teacher, student)
    schoolId: {
      type: String,
      description: "School ID if user is bound to a school",
    },

    // Tracking
    createdAt: {
      type: Date,
      default: Date.now,
      description: "Account creation timestamp",
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      description: "Last profile update timestamp",
    },

    lastLogin: {
      type: Date,
      description: "Last successful login timestamp",
    },

    // Audit
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
      description: "Soft delete flag",
    },

    deletedAt: {
      type: Date,
      description: "Soft delete timestamp",
    },
  },
  {
    collection: "users",
    timestamps: false,
  },
);

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: get public profile (without sensitive fields)
userSchema.methods.toPublic = function () {
  const { password, ...publicUser } = this.toObject();
  return publicUser;
};

// Create and export model
module.exports = mongoose.model("User", userSchema);
