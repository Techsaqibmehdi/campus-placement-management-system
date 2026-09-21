const mongoose = require("mongoose");

const scoreUpdateRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    currentScores: {
      cgpa: {
        type: Number,
        default: null,
      },
      tenthPercentage: {
        type: Number,
        default: null,
      },
      twelfthPercentage: {
        type: Number,
        default: null,
      },
      backlogs: {
        type: Number,
        default: 0,
      },
    },
    requestedScores: {
      cgpa: {
        type: Number,
        required: [true, "Requested CGPA is required"],
        min: 0,
        max: 10,
      },
      tenthPercentage: {
        type: Number,
        required: [true, "Requested 10th percentage is required"],
        min: 0,
        max: 100,
      },
      twelfthPercentage: {
        type: Number,
        required: [true, "Requested 12th percentage is required"],
        min: 0,
        max: 100,
      },
      backlogs: {
        type: Number,
        required: [true, "Requested backlogs count is required"],
        min: 0,
      },
    },
    reason: {
      type: String,
      required: [true, "Official reason / justification for score update is required"],
      trim: true,
    },
    proofDocumentUrl: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScoreUpdateRequest", scoreUpdateRequestSchema);

