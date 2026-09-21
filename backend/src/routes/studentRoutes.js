const express = require("express");

const {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
  deleteResume,
  setPrimaryResume,
  getAllStudentsForAdmin,
  toggleStudentStatus,
  updateStudentByAdmin,
  submitScoreUpdateRequest,
  getMyScoreUpdateRequests,
  getAllScoreRequestsForAdmin,
  approveScoreRequest,
  rejectScoreRequest,
} = require("../controllers/studentController");


const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/profile",
  protect,
  authorizeRoles("student"),
  createStudentProfile
);
router.get(
  "/profile",
  protect,
  authorizeRoles("student"),
  getStudentProfile
);

router.put(
  "/profile",
  protect,
  authorizeRoles("student"),
  updateStudentProfile
);

router.post(
  "/resume",
  protect,
  authorizeRoles("student"),
  upload.single("resume"),
  uploadResume
);

router.delete(
  "/resume/:resumeId",
  protect,
  deleteResume
);

router.patch(
  "/resume/:resumeId/primary",
  protect,
  setPrimaryResume
);

// Student Academic Score Update Requests
router.post(
  "/score-update-request",
  protect,
  authorizeRoles("student"),
  submitScoreUpdateRequest
);

router.get(
  "/score-update-requests",
  protect,
  authorizeRoles("student"),
  getMyScoreUpdateRequests
);

// Admin Student Management
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllStudentsForAdmin
);

router.patch(
  "/:userId/status",
  protect,
  authorizeRoles("admin"),
  toggleStudentStatus
);

router.put(
  "/:userId/admin-update",
  protect,
  authorizeRoles("admin"),
  updateStudentByAdmin
);

// Admin Academic Score Requests Approval Queue
router.get(
  "/admin/score-update-requests",
  protect,
  authorizeRoles("admin"),
  getAllScoreRequestsForAdmin
);

router.put(
  "/admin/score-update-requests/:requestId/approve",
  protect,
  authorizeRoles("admin"),
  approveScoreRequest
);

router.put(
  "/admin/score-update-requests/:requestId/reject",
  protect,
  authorizeRoles("admin"),
  rejectScoreRequest
);

module.exports = router;