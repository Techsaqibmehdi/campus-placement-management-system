const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshopStatus,
  getWorkshopParticipants,
  registerFreeWorkshop,
  createWorkshopOrder,
  verifyWorkshopPayment,
} = require("../controllers/workshopController");

// Public / Student / Admin Workshops Directory
router.get("/", protect, getAllWorkshops);
router.get("/:id", protect, getWorkshopById);

// Admin Management Endpoints
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createWorkshop
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateWorkshopStatus
);

router.get(
  "/:id/participants",
  protect,
  authorizeRoles("admin"),
  getWorkshopParticipants
);

// Student Registration Endpoints
router.post(
  "/:id/register-free",
  protect,
  authorizeRoles("student"),
  registerFreeWorkshop
);

router.post(
  "/:id/create-order",
  protect,
  authorizeRoles("student"),
  createWorkshopOrder
);

router.post(
  "/:id/verify-payment",
  protect,
  authorizeRoles("student"),
  verifyWorkshopPayment
);

module.exports = router;
