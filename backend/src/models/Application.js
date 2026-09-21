const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
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

    resume: {
      resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      url: {
        type: String,
        default: "",
      },
      name: {
        type: String,
        default: "",
      },
    },

    status: {
      type: String,
      enum: [
        "applied",
        "under_review",
        "shortlisted",
        "interview",
        "selected",
        "rejected",
      ],
      default: "applied",
    },

    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        comments: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ student: 1, drive: 1 }, { unique: true });
applicationSchema.index({ drive: 1, status: 1 });
applicationSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model("Application", applicationSchema);
