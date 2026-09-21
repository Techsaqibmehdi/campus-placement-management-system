const mongoose = require("mongoose");

const placementDriveSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },

    opportunityType: {
      type: String,
      enum: ["placement_drive", "internship", "hackathon", "event"],
      default: "placement_drive",
    },

    // Specific to Internships
    duration: {
      type: String,
      trim: true,
      default: null,
    },

    stipend: {
      type: String,
      trim: true,
      default: null,
    },

    // Specific to Company Hackathons
    theme: {
      type: String,
      trim: true,
      default: null,
    },

    teamSize: {
      type: String,
      trim: true,
      default: null,
    },

    prizePool: {
      type: String,
      trim: true,
      default: null,
    },

    // Specific to Company Events
    eventType: {
      type: String,
      trim: true,
      default: null,
    },

    description: {
      type: String,
      trim: true,
    },

    employmentType: {
      type: String,
      enum: ["Full Time", "Internship", "Internship + PPO"],
      default: "Full Time",
    },

    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },

    package: {
      type: Number,
      default: 0,
      min: 0,
    },

    category: {
      type: String,
      enum: ["Regular", "Dream", "Super Dream"],
      default: null,
    },

    baseSalary: {
      type: Number,
      default: null,
      min: 0,
    },

    variableSalary: {
      type: Number,
      default: null,
      min: 0,
    },

    location: {
      type: String,
      default: "Delhi-NCR / XYZ Campus",
      trim: true,
    },

    // Eligibility Criteria
    isOpenToAll: {
      type: Boolean,
      default: false,
    },

    minimumCgpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    allowedCourses: {
      type: [String],
      default: [],
    },

    eligibleBranches: {
      type: [String],
      default: [],
    },

    passingYears: {
      type: [Number],
      default: [],
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    minimumTenthPercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    minimumTwelfthPercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    maximumBacklogs: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Selection process & Deadlines
    selectionRounds: {
      type: [String],
      default: ["Resume Screening", "Technical Interview", "HR Interview"],
    },

    maxApplications: {
      type: Number,
      default: null,
    },

    applicationDeadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "pending_approval", "open", "closed", "cancelled"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

placementDriveSchema.pre("save", function () {
  if (!this.category) {
    const pkg = Number(this.package) || 0;
    if (pkg >= 10) this.category = "Super Dream";
    else if (pkg >= 6) this.category = "Dream";
    else this.category = "Regular";
  }
});

placementDriveSchema.index({ company: 1, status: 1 });
placementDriveSchema.index({ applicationDeadline: 1, status: 1 });

module.exports = mongoose.model("PlacementDrive", placementDriveSchema);
