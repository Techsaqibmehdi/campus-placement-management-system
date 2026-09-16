const express = require("express");
const {
  createPlacementDrive,
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

module.exports = router;