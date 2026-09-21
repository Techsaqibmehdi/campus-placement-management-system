require("dotenv").config();
// Auto-reloaded with updated Razorpay credentials
const studentRoutes = require("./routes/studentRoutes");

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const placementDriveRoutes = require("./routes/placementDriveRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const offerRoutes = require("./routes/offerRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const competitionRoutes = require("./routes/competitionRoutes");
const workshopRoutes = require("./routes/workshopRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/resumes");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const offerLettersDir = path.join(__dirname, "../uploads/offer_letters");
if (!fs.existsSync(offerLettersDir)) {
  fs.mkdirSync(offerLettersDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files statically as fallback
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/drives", placementDriveRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Campus Placement API is running",
  });
});

// Multer and general API error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Resume file size must not exceed 10MB." });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message || "An unexpected error occurred." });
  }
  next();
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();