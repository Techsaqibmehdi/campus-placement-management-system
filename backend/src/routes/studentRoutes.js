const express = require("express");
const {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} = require("../controllers/studentController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/profile",
  protect,
  authorizeRoles("student"),
  createStudentProfile
);
router.get(
  "/profile",
  protect,
  authorizeRoles("student"),
  getStudentProfile
);

router.put(
  "/profile",
  protect,
  authorizeRoles("student"),
  updateStudentProfile
);
module.exports = router;