const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    course: {
      type: String,
      required: true,
      trim: true,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
    },

    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    tenthPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    twelfthPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    skills: {
      type: [String],
      default: [],
    },

    projects: {
      type: [String],
      default: [],
    },

    internships: {
      type: [String],
      default: [],
    },

    backlogs: {
      type: Number,
      default: 0,
      min: 0,
    },

    resumeUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);