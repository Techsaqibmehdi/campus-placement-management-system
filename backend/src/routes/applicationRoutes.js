const express = require("express");

const {
  applyForDrive,
  getMyApplications,
  getRecruiterApplications,
  updateApplicationStatus,
  createOffer,
} = require("../controllers/applicationController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


router.get(
  "/recruiter",
  protect,
  authorizeRoles("recruiter"),
  getRecruiterApplications
);
router.get(
  "/",
  protect,
  authorizeRoles("student"),
  getMyApplications
);
router.patch(
  "/:applicationId/status",
  protect,
  authorizeRoles("admin", "recruiter"),
  updateApplicationStatus
);
router.post(
  "/:applicationId/offer",
  protect,
  authorizeRoles("admin", "recruiter"),
  createOffer
);
router.post(
  "/:driveId",
  protect,
  authorizeRoles("student"),
  applyForDrive
);

module.exports = router;