const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "academic_discrepancy",
        "drive_eligibility",
        "interview_clash",
        "offer_query",
        "technical_issue",
        "other",
      ],
      default: "academic_discrepancy",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementDrive",
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
      index: true,
    },
    adminResponse: {
      type: String,
      default: "",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);

