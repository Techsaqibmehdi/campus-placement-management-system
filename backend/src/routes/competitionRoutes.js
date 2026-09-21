const express = require("express");
const {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  registerForCompetition,
  getMyRegistrations,
  getCompetitionParticipants,
  updateCompetition,
  deleteCompetition,
} = require("../controllers/competitionController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// TPO / Admin exclusive creation
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createCompetition
);

// Student registered competitions (must be before /:id)
router.get(
  "/my/registrations",
  protect,
  authorizeRoles("student"),
  getMyRegistrations
);

// All authenticated users can discover competitions
router.get(
  "/",
  protect,
  getCompetitions
);

router.get(
  "/:id",
  protect,
  getCompetitionById
);

// Student register
router.post(
  "/:id/register",
  protect,
  authorizeRoles("student"),
  registerForCompetition
);

// Admin view participants
router.get(
  "/:id/participants",
  protect,
  authorizeRoles("admin"),
  getCompetitionParticipants
);

// Admin update & delete
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateCompetition
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteCompetition
);

module.exports = router;

