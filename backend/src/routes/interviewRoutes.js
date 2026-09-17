const express = require("express");

const {
  scheduleInterview,
  getMyInterviews,
  updateInterviewStatus,
  getRecruiterInterviews,
} = require("../controllers/interviewController");


const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/:applicationId",
  protect,
  authorizeRoles("admin", "recruiter"),
  scheduleInterview
);

router.get(
  "/",
  protect,
  authorizeRoles("student"),
  getMyInterviews
);
router.get(
  "/recruiter",
  protect,
  authorizeRoles("recruiter"),
  getRecruiterInterviews
);

router.patch(
  "/:interviewId/status",
  protect,
  authorizeRoles("admin", "recruiter"),
  updateInterviewStatus
);

module.exports = router;