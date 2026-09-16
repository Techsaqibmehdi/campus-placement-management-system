const express = require("express");

const {
  applyForDrive,
  getMyApplications,
} = require("../controllers/applicationController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("student"),
  getMyApplications
);

router.post(
  "/:driveId",
  protect,
  authorizeRoles("student"),
  applyForDrive
);

module.exports = router;