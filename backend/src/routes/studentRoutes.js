const express = require("express");

const {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
} = require("../controllers/studentController");


const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

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

router.post(
  "/resume",
  protect,
  authorizeRoles("student"),
  upload.single("resume"),
  uploadResume
);
module.exports = router;