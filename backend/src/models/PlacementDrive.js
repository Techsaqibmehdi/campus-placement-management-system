const mongoose = require("mongoose");

const placementDriveSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    package: {
      type: Number,
      required: true,
      min: 0,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    minimumCgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    eligibleBranches: {
      type: [String],
      default: [],
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    minimumTenthPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    minimumTwelfthPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    maximumBacklogs: {
      type: Number,
      default: 0,
      min: 0,
    },

    applicationDeadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PlacementDrive", placementDriveSchema);