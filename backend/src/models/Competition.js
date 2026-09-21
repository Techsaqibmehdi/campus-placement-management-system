const mongoose = require("mongoose");

const competitionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      trim: true,
      default: "Coding Contest",
    },

    organizer: {
      type: String,
      trim: true,
      default: "Campus TPO Placement Cell",
    },

    mode: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online",
    },

    venue: {
      type: String,
      trim: true,
      default: "Virtual Arena / Online Platform",
    },

    contestUrl: {
      type: String,
      trim: true,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    registrationDeadline: {
      type: Date,
      required: true,
    },

    teamSize: {
      type: String,
      default: "Individual",
    },

    maxTeamSize: {
      type: Number,
      default: 1,
    },

    prizes: {
      type: String,
      trim: true,
      default: "Cash Prize & Certificates of Excellence",
    },

    isOpenToAll: {
      type: Boolean,
      default: true,
    },

    eligibleCourses: {
      type: [String],
      default: [],
    },

    eligibleBranches: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },

    participants: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "StudentProfile",
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

competitionSchema.index({ status: 1, startDate: 1 });
competitionSchema.index({ "participants.user": 1 });

module.exports = mongoose.model("Competition", competitionSchema);

