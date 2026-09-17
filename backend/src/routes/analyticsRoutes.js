const express = require("express");

const {
  getPlacementAnalytics,
} = require("../controllers/analyticsController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/placement",
  protect,
  authorizeRoles("admin"),
  getPlacementAnalytics
);

module.exports = router;