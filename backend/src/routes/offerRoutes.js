const express = require("express");

const {
  getMyOffers,
  getRecruiterOffers,
  updateOfferStatus,
  getOfferLetterPdf,
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

router.get(
  "/recruiter",
  protect,
  authorizeRoles("recruiter"),
  getRecruiterOffers
);

router.get(
  "/:offerId/pdf",
  protect,
  authorizeRoles("student", "recruiter", "admin"),
  getOfferLetterPdf
);

router.patch(
  "/:offerId/status",
  protect,
  authorizeRoles("student"),
  updateOfferStatus
);

module.exports = router;