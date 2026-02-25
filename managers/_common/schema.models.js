const emojis = require("../../public/emojis.data.json");

module.exports = {
  id: {
    path: "id",
    type: "string",
    length: { min: 1, max: 50 },
  },
  username: {
    path: "username",
    type: "string",
    length: { min: 3, max: 20 },
    custom: "username",
  },
  password: {
    path: "password",
    type: "string",
    length: { min: 8, max: 100 },
  },
  email: {
    path: "email",
    type: "string",
    length: { min: 3, max: 100 },
  },
  title: {
    path: "title",
    type: "string",
    length: { min: 3, max: 300 },
  },
  label: {
    path: "label",
    type: "string",
    length: { min: 3, max: 100 },
  },
  shortDesc: {
    path: "desc",
    type: "string",
    length: { min: 3, max: 300 },
  },
  longDesc: {
    path: "desc",
    type: "string",
    length: { min: 3, max: 2000 },
  },
  url: {
    path: "url",
    type: "string",
    length: { min: 9, max: 300 },
  },
  emoji: {
    path: "emoji",
    type: "Array",
    items: {
      type: "string",
      length: { min: 1, max: 10 },
      oneOf: emojis.value,
    },
  },
  price: {
    path: "price",
    type: "number",
  },
  avatar: {
    path: "avatar",
    type: "string",
    length: { min: 8, max: 100 },
  },
  text: {
    type: "String",
    length: { min: 3, max: 15 },
  },
  longText: {
    type: "String",
    length: { min: 3, max: 250 },
  },
  paragraph: {
    type: "String",
    length: { min: 3, max: 10000 },
  },
  phone: {
    type: "String",
    length: 13,
  },
  email: {
    type: "String",
    regex:
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  number: {
    type: "Number",
    length: { min: 1, max: 6 },
  },
  arrayOfStrings: {
    type: "Array",
    items: {
      type: "String",
      length: { min: 3, max: 100 },
    },
  },
  obj: {
    type: "Object",
  },
  bool: {
    type: "Boolean",
  },

  // ============================================================================
  // SCHOOL MANAGEMENT SYSTEM SPECIFIC FIELDS
  // ============================================================================

  // User & Authentication Fields
  firstName: {
    path: "firstName",
    type: "string",
    length: { min: 2, max: 50 },
  },
  lastName: {
    path: "lastName",
    type: "string",
    length: { min: 2, max: 50 },
  },
  role: {
    path: "role",
    type: "string",
    oneOf: ["superadmin", "school_admin", "teacher", "student"],
  },
  status: {
    path: "status",
    type: "string",
    oneOf: ["active", "inactive", "suspended", "pending"],
  },

  // School Fields
  schoolName: {
    path: "schoolName",
    type: "string",
    required: true,
    length: { min: 3, max: 100 },
  },
  schoolAddress: {
    path: "schoolAddress",
    type: "string",
    required: true,
    length: { min: 5, max: 300 },
  },
  schoolPhone: {
    path: "schoolPhone",
    type: "string",
    required: true,
    length: { min: 10, max: 20 },
  },
  schoolEmail: {
    path: "schoolEmail",
    type: "string",
    required: true,
    regex:
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  principalName: {
    path: "principalName",
    type: "string",
    required: true,
    length: { min: 3, max: 100 },
  },
  establishedYear: {
    path: "establishedYear",
    type: "number",
  },
  schoolCode: {
    path: "schoolCode",
    type: "string",
    required: true,
    length: { min: 3, max: 20 },
  },

  // Classroom Fields
  classroomName: {
    path: "classroomName",
    type: "string",
    required: true,
    length: { min: 2, max: 50 },
  },
  gradeLevel: {
    path: "gradeLevel",
    type: "string",
    required: true,
    oneOf: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  },
  section: {
    path: "section",
    type: "string",
    required: true,
    length: { min: 1, max: 1 },
    oneOf: ["A", "B", "C", "D", "E", "F"],
  },
  capacity: {
    path: "capacity",
    type: "number",
    required: true,
  },
  currentEnrollment: {
    path: "currentEnrollment",
    type: "number",
  },
  roomNumber: {
    path: "roomNumber",
    type: "string",
    length: { min: 1, max: 10 },
  },

  // Student Fields
  studentFirstName: {
    path: "studentFirstName",
    type: "string",
    required: true,
    length: { min: 2, max: 50 },
  },
  studentLastName: {
    path: "studentLastName",
    type: "string",
    required: true,
    length: { min: 2, max: 50 },
  },
  enrollmentNumber: {
    path: "enrollmentNumber",
    type: "string",
    required: true,
    length: { min: 5, max: 20 },
  },
  studentEmail: {
    path: "studentEmail",
    type: "string",
    required: true,
    regex:
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  studentPhone: {
    path: "studentPhone",
    type: "string",
    required: true,
    length: { min: 10, max: 20 },
  },
  dateOfBirth: {
    path: "dateOfBirth",
    type: "string",
    required: true,
  },
  parentName: {
    path: "parentName",
    type: "string",
    required: true,
    length: { min: 3, max: 100 },
  },
  parentPhone: {
    path: "parentPhone",
    type: "string",
    required: true,
    length: { min: 10, max: 20 },
  },
  enrollmentDate: {
    path: "enrollmentDate",
    type: "string",
  },

  // Pagination & Query Fields
  page: {
    path: "page",
    type: "number",
  },
  limit: {
    path: "limit",
    type: "number",
  },
  sortBy: {
    path: "sortBy",
    type: "string",
  },
  searchTerm: {
    path: "searchTerm",
    type: "string",
    length: { min: 1, max: 100 },
  },
};
