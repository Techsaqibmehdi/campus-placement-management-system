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
      enum: ["BCA", "MCA", "B.Tech", "M.Tech", "MBA"],
      default: null,
    },

    branch: {
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