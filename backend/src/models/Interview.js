const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },

    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementDrive",
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    mode: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },

    meetingLink: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

    feedback: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ student: 1, scheduledAt: 1 });
interviewSchema.index({ company: 1, scheduledAt: 1 });
interviewSchema.index({ application: 1, status: 1 });

module.exports = mongoose.model("Interview", interviewSchema);