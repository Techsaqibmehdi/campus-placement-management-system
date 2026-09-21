const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    college: {
      type: String,
      required: true,
      default: "XYZ Group of Institutions",
    },

    course: {
      type: String,
      required: true,
      enum: ["BCA", "MCA", "B.Tech", "M.Tech", "MBA"],
    },

    branch: {
      type: String,
      default: null,
      trim: true,
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically remove pending registrations after expiry
pendingRegistrationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema
);