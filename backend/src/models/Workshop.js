const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    course: {
      type: String,
      trim: true,
      default: "",
    },
    branch: {
      type: String,
      trim: true,
      default: "",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ["free", "completed", "pending"],
      default: "free",
    },
    paymentId: {
      type: String,
      trim: true,
      default: "",
    },
    orderId: {
      type: String,
      trim: true,
      default: "",
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const workshopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    instructor: {
      type: String,
      required: true,
      trim: true,
      default: "Industry Expert",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    duration: {
      type: String,
      trim: true,
      default: "3 Days",
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

    mode: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online",
    },

    venue: {
      type: String,
      trim: true,
      default: "Virtual Platform / Online Meet",
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      default: 50,
    },

    seatsBooked: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["open", "closed", "completed", "cancelled"],
      default: "open",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    participants: [participantSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual for available seats
workshopSchema.virtual("availableSeats").get(function () {
  return Math.max(0, this.totalSeats - this.seatsBooked);
});

module.exports = mongoose.model("Workshop", workshopSchema);

