const mongoose = require("mongoose");

/**
 * Student Schema
 * ===========================================================
 * Defines MongoDB schema for student documents
 * Manages student information and enrollment
 */

const studentSchema = new mongoose.Schema(
  {
    // Unique identifiers
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "UUID for the student",
    },

    userId: {
      type: String,
      required: true,
      index: true,
      description: "Associated user ID for login",
    },

    // Association
    schoolId: {
      type: String,
      required: true,
      index: true,
      description: "School ID student attends",
    },

    // Basic Information
    firstName: {
      type: String,
      required: true,
      trim: true,
      description: "Student's first name",
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      description: "Student's last name",
    },

    email: {
      type: String,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      description: "Student email",
    },

    // Personal
    dateOfBirth: {
      type: Date,
      description: "Student's date of birth",
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      description: "Student's gender",
    },

    phone: {
      type: String,
      description: "Student's contact number",
    },

    // Education
    rollNumber: {
      type: String,
      description: "Student roll number",
    },

    admissionNumber: {
      type: String,
      unique: true,
      description: "Unique admission number",
    },

    admissionDate: {
      type: Date,
      description: "Date of admission",
    },

    // Current Enrollment
    currentClassroomId: {
      type: String,
      description: "Currently enrolled classroom ID",
    },

    currentGradeLevel: {
      type: String,
      description: "Current grade level",
    },

    enrollmentStatus: {
      type: String,
      enum: ["active", "suspended", "withdrawn"],
      default: "active",
      description: "Enrollment status",
    },

    // Address
    address: {
      type: String,
      description: "Student's home address",
    },

    city: {
      type: String,
      description: "City",
    },

    state: {
      type: String,
      description: "State/Province",
    },

    zipCode: {
      type: String,
      description: "Postal code",
    },

    // Parent/Guardian Information
    parentName: {
      type: String,
      description: "Parent/Guardian name",
    },

    parentEmail: {
      type: String,
      lowercase: true,
      description: "Parent/Guardian email",
    },

    parentPhone: {
      type: String,
      description: "Parent/Guardian phone",
    },

    parentRelation: {
      type: String,
      description: "Relation to student (Mother, Father, Guardian, etc.)",
    },

    // Academic Information
    academicYear: {
      type: String,
      description: "Current academic year",
    },

    previousSchool: {
      type: String,
      description: "Previously studied school",
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "graduated"],
      default: "active",
      description: "Student status",
    },

    // Enrollment History
    enrollmentHistory: {
      type: [
        {
          classroomId: String,
          gradeLevel: String,
          enrollmentDate: Date,
          withdrawalDate: Date,
        },
      ],
      description: "History of classroom enrollments",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      description: "Record creation timestamp",
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
    collection: "students",
    timestamps: false,
  },
);

// Index for school students
studentSchema.index({ schoolId: 1, status: 1, isDeleted: 1 });
studentSchema.index({ currentClassroomId: 1 });

// Instance method: transfer student to new classroom
studentSchema.methods.transferToClassroom = function (
  newClassroomId,
  newGradeLevel,
) {
  // Add to enrollment history
  if (this.currentClassroomId) {
    this.enrollmentHistory.push({
      classroomId: this.currentClassroomId,
      gradeLevel: this.currentGradeLevel,
      enrollmentDate: new Date(
        this.enrollmentHistory[this.enrollmentHistory.length - 1]
          ?.enrollmentDate || Date.now(),
      ),
      withdrawalDate: new Date(),
    });
  }
  // Update current classroom
  this.currentClassroomId = newClassroomId;
  this.currentGradeLevel = newGradeLevel;
  this.updatedAt = new Date();
};

// Instance method: get full name
studentSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Create and export model
module.exports = mongoose.model("Student", studentSchema);
