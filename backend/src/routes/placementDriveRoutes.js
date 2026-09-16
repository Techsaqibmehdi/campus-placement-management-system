const express = require("express");
const {
  createPlacementDrive,
  getPlacementDrives,
} = require("../controllers/placementDriveController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createPlacementDrive
);
router.get(
  "/",
  protect,
  authorizeRoles("student"),
  getPlacementDrives
);

module.exports = router;