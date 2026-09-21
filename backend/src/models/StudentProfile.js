const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      trim: true,
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    technologies: {
      type: [String],
      default: [],
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    technologies: {
      type: [String],
      default: [],
    },
    githubUrl: {
      type: String,
      trim: true,
      default: "",
    },
    liveUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const porSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      trim: true,
      required: true,
    },
    organization: {
      type: String,
      trim: true,
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    year: {
      type: Number,
      default: null,
    },
  },
  { _id: true }
);

const resumeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const socialProfilesSchema = new mongoose.Schema(
  {
    github: {
      type: String,
      trim: true,
      default: "",
    },
    linkedin: {
      type: String,
      trim: true,
      default: "",
    },
    portfolio: {
      type: String,
      trim: true,
      default: "",
    },
    leetcode: {
      type: String,
      trim: true,
      default: "",
    },
    codechef: {
      type: String,
      trim: true,
      default: "",
    },
    hackerrank: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Existing fields - kept for backward compatibility
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
      default: null,
      trim: true,
    },

    // Education
    cgpa: {
      type: Number,
      default: null,
      min: 0,
      max: 10,
    },

    tenthPercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    twelfthPercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    backlogs: {
      type: Number,
      default: 0,
      min: 0,
    },

    academicScoresLocked: {
      type: Boolean,
      default: false,
    },

    // Skills
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: function (skills) {
          return skills.length <= 20;
        },
        message: "Maximum 20 skills can be selected",
      },
    },

    // Experience
    internships: {
      type: [internshipSchema],
      default: [],
    },

    // Projects
    projects: {
      type: [projectSchema],
      default: [],
    },

    // Positions of Responsibility
    por: {
      type: [porSchema],
      default: [],
    },

    // Achievements
    achievements: {
      type: [achievementSchema],
      default: [],
    },

    // Resumes
    resumes: {
      type: [resumeSchema],
      default: [],
      validate: {
        validator: function (resumes) {
          return resumes.length <= 3;
        },
        message: "Maximum 3 resumes can be uploaded",
      },
    },

    // Social profiles
    socialProfiles: {
      type: socialProfilesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);