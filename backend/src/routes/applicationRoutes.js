const express = require("express");

const {
  applyForDrive,
  getMyApplications,
  getRecruiterApplications,
  getDriveApplications,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  createOffer,
} = require("../controllers/applicationController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Recruiter applications for all company drives
router.get(
  "/recruiter",
  protect,
  authorizeRoles("recruiter", "admin"),
  getRecruiterApplications
);

// Recruiter applications for a specific drive
router.get(
  "/drive/:driveId",
  protect,
  authorizeRoles("recruiter", "admin"),
  getDriveApplications
);

// Student's own applications
router.get(
  "/",
  protect,
  authorizeRoles("student"),
  getMyApplications
);

// Status update
router.patch(
  "/bulk/status",
  protect,
  authorizeRoles("admin", "recruiter"),
  bulkUpdateApplicationStatus
);

router.patch(
  "/:applicationId/status",
  protect,
  authorizeRoles("admin", "recruiter"),
  updateApplicationStatus
);

// Offer creation
router.post(
  "/:applicationId/offer",
  protect,
  authorizeRoles("admin", "recruiter"),
  createOffer
);

// Student applies for drive
router.post(
  "/:driveId",
  protect,
  authorizeRoles("student"),
  applyForDrive
);

module.exports = router;