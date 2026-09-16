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

    status: {
      type: String,
      enum: [
        "applied",
        "shortlisted",
        "rejected",
        "selected",
      ],
      default: "applied",
    },
  },
  {
    timestamps: true,
  }
);
applicationSchema.index(
  { student: 1, drive: 1 },
  { unique: true }
);
module.exports = mongoose.model("Application", applicationSchema);