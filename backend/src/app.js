require("dotenv").config();
const studentRoutes = require("./routes/studentRoutes");

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const placementDriveRoutes = require("./routes/placementDriveRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const offerRoutes = require("./routes/offerRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/drives", placementDriveRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Campus Placement API is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();