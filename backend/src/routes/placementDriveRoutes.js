const express = require("express");
const {
  createPlacementDrive,
  getPlacementDrives,
  getDriveById,
  getMyDrives,
  updatePlacementDrive,
  updateDriveStatus,
  getDriveEligibility,
  getPendingApprovalDrives,
  approvePlacementDrive,
  rejectPlacementDrive,
} = require("../controllers/placementDriveController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Recruiter & Admin drive creation
router.post(
  "/",
  protect,
  authorizeRoles("admin", "recruiter"),
  createPlacementDrive
);

// Admin: view pending approval drives
router.get(
  "/pending-approval",
  protect,
  authorizeRoles("admin"),
  getPendingApprovalDrives
);

// Admin: approve or reject drive
router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  approvePlacementDrive
);

router.patch(
  "/:id/reject",
  protect,
  authorizeRoles("admin"),
  rejectPlacementDrive
);

// Recruiter & Admin company drives
router.get(
  "/my-drives",
  protect,
  authorizeRoles("recruiter", "admin"),
  getMyDrives
);

// Student & all authenticated users can discover open/approved drives
router.get(
  "/",
  protect,
  getPlacementDrives
);

// Specific drive details
router.get(
  "/:id",
  protect,
  getDriveById
);

// Student diagnostic eligibility check for specific drive
router.get(
  "/:id/eligibility",
  protect,
  authorizeRoles("student"),
  getDriveEligibility
);

// Update drive details & status
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "recruiter"),
  updatePlacementDrive
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "recruiter"),
  updateDriveStatus
);

module.exports = router;