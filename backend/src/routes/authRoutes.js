const express = require("express");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  registerUser,
  registerRecruiter,
  loginUser,
  verifyOTP,
  verifyRegistrationOTP,
  resendRegistrationOTP,
  forgotPassword,
  resetPassword,
  getPendingRecruiters,
  approveRecruiter,
  rejectRecruiter,
} = require("../controllers/authController");
const { sendOTPEmail } = require("../services/emailService");
const { createAndSendOTP } = require("../services/otpService");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/register-recruiter", registerRecruiter);
router.get("/recruiters/pending", protect, authorizeRoles("admin"), getPendingRecruiters);
router.patch("/recruiters/:id/approve", protect, authorizeRoles("admin"), approveRecruiter);
router.patch("/recruiters/:id/reject", protect, authorizeRoles("admin"), rejectRecruiter);
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    await createAndSendOTP(email, "Test User");

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("OTP error:", error);

    res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post(
  "/verify-registration-otp",
  verifyRegistrationOTP
);
router.post(
  "/resend-registration-otp",
  resendRegistrationOTP
);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "You can access this protected route",
    user: req.user,
  });
});

router.get(
  "/admin-test",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({
      message: "Welcome Admin",
      user: req.user,
    });
  }
);

module.exports = router;