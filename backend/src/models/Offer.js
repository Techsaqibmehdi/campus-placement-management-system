const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementDrive",
      required: true,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },

    package: {
      type: Number,
      required: true,
      min: 0,
    },

    joiningDate: {
      type: Date,
    },

    offerDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "accepted", "declined"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Offer", offerSchema);