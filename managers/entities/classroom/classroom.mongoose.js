const mongoose = require("mongoose");

/**
 * Classroom Schema
 * ===========================================================
 * Defines MongoDB schema for classroom documents
 * Manages classroom information and enrollment
 */

const classroomSchema = new mongoose.Schema(
  {
    // Unique identifiers
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "UUID for the classroom",
    },

    // Association
    schoolId: {
      type: String,
      required: true,
      index: true,
      description: "School ID this classroom belongs to",
    },

    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
      description: "Classroom name (e.g., 10-A, Grade 5 Blue)",
    },

    section: {
      type: String,
      description: "Classroom section/division",
    },

    gradeLevel: {
      type: String,
      description: "Grade level (e.g., 10, 11, 12)",
    },

    // Assignment
    teacherId: {
      type: String,
      description: "Primary teacher ID",
    },

    teacherName: {
      type: String,
      description: "Primary teacher name (denormalized)",
    },

    // Capacity & Enrollment
    capacity: {
      type: Number,
      default: 30,
      min: 1,
      description: "Maximum capacity of classroom",
    },

    enrolledCount: {
      type: Number,
      default: 0,
      description: "Current number of enrolled students",
    },

    enrolledStudents: {
      type: [String],
      default: [],
      description: "Array of enrolled student IDs",
    },

    // Academic
    academicYear: {
      type: String,
      description: "Academic year (e.g., 2024-2025)",
    },

    curriculum: {
      type: String,
      description: "Curriculum type (e.g., CBSE, ICSE)",
    },

    // Schedule
    startTime: {
      type: String,
      description: "Class start time (HH:MM format)",
    },

    endTime: {
      type: String,
      description: "Class end time (HH:MM format)",
    },

    daysOfWeek: {
      type: [String],
      description: "Days classroom meets (Mon, Tue, etc.)",
    },

    // Location
    roomNumber: {
      type: String,
      description: "Physical room number/location",
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
      description: "Classroom status",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      description: "Classroom creation timestamp",
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
    collection: "classrooms",
    timestamps: false,
  },
);

// Index for school classrooms
classroomSchema.index({ schoolId: 1, status: 1, isDeleted: 1 });

// Instance method: check if enrollment available
classroomSchema.methods.hasAvailableSpot = function () {
  return this.enrolledCount < this.capacity;
};

// Instance method: enroll student
classroomSchema.methods.enrollStudent = function (studentId) {
  if (this.enrolledStudents.includes(studentId)) {
    return false; // Already enrolled
  }
  if (!this.hasAvailableSpot()) {
    return false; // No capacity
  }
  this.enrolledStudents.push(studentId);
  this.enrolledCount++;
  return true;
};

// Instance method: unenroll student
classroomSchema.methods.unenrollStudent = function (studentId) {
  const index = this.enrolledStudents.indexOf(studentId);
  if (index === -1) {
    return false; // Not enrolled
  }
  this.enrolledStudents.splice(index, 1);
  this.enrolledCount--;
  return true;
};

// Create and export model
module.exports = mongoose.model("Classroom", classroomSchema);
