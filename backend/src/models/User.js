const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "recruiter", "admin"],
      default: "student",
    },

    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },

    // Student registration details
    college: {
      type: String,
      trim: true,
      default: null,
    },

    rollNumber: {
      type: String,
      trim: true,
      default: null,
    },

    course: {
      type: String,
      trim: true,
      default: null,
    },

    branch: {
      type: String,
      trim: true,
      default: null,
    },

    // Recruiter registration details
    companyName: {
      type: String,
      trim: true,
      default: null,
    },

    companyWebsite: {
      type: String,
      trim: true,
      default: null,
    },

    designation: {
      type: String,
      trim: true,
      default: null,
    },

    contactNumber: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);