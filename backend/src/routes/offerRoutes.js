const express = require("express");

const {
  getMyOffers,
  updateOfferStatus,
} = require("../controllers/offerController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("student"),
  getMyOffers
);

router.patch(
  "/:offerId/status",
  protect,
  authorizeRoles("student"),
  updateOfferStatus
);

module.exports = router;