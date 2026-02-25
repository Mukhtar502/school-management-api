const mongoose = require("mongoose");

/**
 * School Schema
 * ===========================================================
 * Defines MongoDB schema for school documents
 * Manages school information and configuration
 */

const schoolSchema = new mongoose.Schema(
  {
    // Unique identifiers
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "UUID for the school",
    },

    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
      description: "School name",
    },

    shortCode: {
      type: String,
      unique: true,
      uppercase: true,
      description: "School abbreviation/code (e.g., ABC)",
    },

    description: {
      type: String,
      description: "School description or mission statement",
    },

    // Contact Information
    email: {
      type: String,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      description: "School email address",
    },

    phone: {
      type: String,
      description: "Primary contact phone number",
    },

    website: {
      type: String,
      description: "School website URL",
    },

    // Location
    address: {
      type: String,
      description: "Full school address",
    },

    city: {
      type: String,
      description: "City name",
    },

    state: {
      type: String,
      description: "State/Province",
    },

    country: {
      type: String,
      description: "Country",
    },

    zipCode: {
      type: String,
      description: "Postal code",
    },

    // Principal/Leadership
    principalName: {
      type: String,
      description: "Principal or head of school name",
    },

    principalEmail: {
      type: String,
      lowercase: true,
      description: "Principal email",
    },

    // Statistics
    totalStudents: {
      type: Number,
      default: 0,
      description: "Total number of students",
    },

    totalTeachers: {
      type: Number,
      default: 0,
      description: "Total number of teachers",
    },

    totalClassrooms: {
      type: Number,
      default: 0,
      description: "Total number of classrooms",
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "closed"],
      default: "active",
      description: "School operational status",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      description: "School creation timestamp",
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      description: "Last update timestamp",
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
    collection: "schools",
    timestamps: false,
  },
);

// Index for active schools
schoolSchema.index({ status: 1, isDeleted: 1 });

// Instance method: get public profile
schoolSchema.methods.toPublic = function () {
  return this.toObject();
};

// Create and export model
module.exports = mongoose.model("School", schoolSchema);
