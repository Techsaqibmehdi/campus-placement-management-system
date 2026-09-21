const express = require("express");
const {
  createTicket,
  getMyTickets,
  getAllTicketsForAdmin,
  resolveTicket,
} = require("../controllers/ticketController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Student endpoints
router.post("/", protect, authorizeRoles("student"), createTicket);
router.get("/my-tickets", protect, authorizeRoles("student"), getMyTickets);

// Admin endpoints
router.get("/admin", protect, authorizeRoles("admin"), getAllTicketsForAdmin);
router.patch("/:id/resolve", protect, authorizeRoles("admin"), resolveTicket);

module.exports = router;

