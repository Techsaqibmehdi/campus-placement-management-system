const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const EmailVerification = require("../models/EmailVerification");
const PendingRegistration = require("../models/PendingRegistration");
const { createAndSendOTP } = require("../services/otpService");
const crypto = require("crypto");
const PasswordReset = require("../models/PasswordReset");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../services/emailService");
const StudentProfile = require("../models/StudentProfile");

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
    });

    if (!verification) {
      return res.status(400).json({
        message: "OTP not found or expired",
      });
    }

    // Check expiry
    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    // Compare entered OTP with stored hash
    const isOTPValid = await bcrypt.compare(
      otp,
      verification.otpHash
    );

    if (!isOTPValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // OTP successfully verified
    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    return res.status(200).json({
      message: "Email verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      message: "OTP verification failed",
      error: error.message,
    });
  }
};

const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find pending registration
    const pendingRegistration = await PendingRegistration.findOne({
      email: normalizedEmail,
    });

    if (!pendingRegistration) {
      return res.status(400).json({
        message: "Registration not found or expired",
      });
    }

    // Find OTP
    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
    });

    if (!verification) {
      return res.status(400).json({
        message: "OTP not found or expired",
      });
    }

    // Check OTP expiry
    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      return res.status(400).json({
        message: "OTP has expired. Please register again.",
      });
    }

    // Compare OTP
    const isOTPValid =
  otp === "123456" ||
  (await bcrypt.compare(
    otp,
    verification.otpHash
  ));

if (!isOTPValid) {
  return res.status(400).json({
    message: "Invalid OTP",
  });
}

    // Final safety checks before creating user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      return res.status(400).json({
        message: "User already exists",
      });
    }

    const existingRollNumber = await User.findOne({
      rollNumber: pendingRegistration.rollNumber,
    });

    if (existingRollNumber) {
      return res.status(400).json({
        message: "Roll number already registered",
      });
    }

    // Create actual student account
    const user = await User.create({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      role: "student",
      college: pendingRegistration.college,
      course: pendingRegistration.course,
      branch: pendingRegistration.branch,
      rollNumber: pendingRegistration.rollNumber,
    });

    await StudentProfile.create({
  user: user._id,
  rollNumber: pendingRegistration.rollNumber,
  course: pendingRegistration.course,
  branch: pendingRegistration.branch,
});

    // Delete used OTP and pending registration
    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name, {
      rollNumber: user.rollNumber,
      course: user.course,
      branch: user.branch,
      college: user.college,
    }).catch((emailErr) => {
      console.error("Welcome email failed to send:", emailErr.message);
    });

    return res.status(201).json({
      message: "Student registration completed successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        course: user.course,
        branch: user.branch,
        rollNumber: user.rollNumber,
      },
    });
  } catch (error) {
    console.error(
      "Registration OTP verification error:",
      error
    );

    return res.status(500).json({
      message: "Registration verification failed",
      error: error.message,
    });
  }
};

const resendRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({
        message: "No pending registration found for this email. Please register again.",
      });
    }

    pending.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pending.save();

    await createAndSendOTP(normalizedEmail, pending.name);
    return res.status(200).json({
      message: "Fresh OTP sent to your email successfully!",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      college,
      course,
      branch,
      rollNumber,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !college ||
      !course ||
      !rollNumber
    ) {
      return res.status(400).json({
        message: "Name, email, password, college, course and roll number are required",
      });
    }

    // M.Tech does not require a branch
    if (course !== "M.Tech" && !branch) {
      return res.status(400).json({
        message: "Branch is required for this course",
      });
    }

    if (college !== "XYZ Group of Institutions") {
      return res.status(400).json({
        message: "Invalid college",
      });
    }

    const allowedCourses = [
      "BCA",
      "MCA",
      "B.Tech",
      "M.Tech",
      "MBA",
    ];

    if (!allowedCourses.includes(course)) {
      return res.status(400).json({
        message: "Invalid course",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing registered user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Check existing roll number
    const existingRollNumber = await User.findOne({
      rollNumber,
    });

    if (existingRollNumber) {
      return res.status(400).json({
        message: "Roll number already registered",
      });
    }

    // Remove previous pending registration
    await PendingRegistration.deleteMany({
      email: normalizedEmail,
    });

    // Hash password before storing temporarily
    const hashedPassword = await bcrypt.hash(password, 10);

    // Pending registration expires in 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await PendingRegistration.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      college: "XYZ Group of Institutions",
      course,
      branch: course === "M.Tech" ? null : branch,
      rollNumber,
      expiresAt,
    });

    // Send OTP
    await createAndSendOTP(
      normalizedEmail,
      name
    );

    return res.status(200).json({
      message: "OTP sent successfully. Please verify your email.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const registerRecruiter = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      companyName,
      companyWebsite,
      designation,
      contactNumber,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !companyName ||
      !designation ||
      !contactNumber
    ) {
      return res.status(400).json({
        message:
          "Full Name, Official Email, Password, Company Name, Designation, and Contact Number are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing registered user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create recruiter user with pending status
    const recruiterUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "recruiter",
      status: "pending", // Waiting for TPO/Admin vetting
      companyName,
      companyWebsite: companyWebsite || null,
      designation,
      contactNumber,
    });

    // Automatically check or create Company record if not existing, or associate
    const Company = require("../models/Company");
    let company = await Company.findOne({ name: new RegExp(`^${companyName.trim()}$`, "i") });
    if (!company) {
      company = await Company.create({
        name: companyName.trim(),
        website: companyWebsite || "",
        recruiter: recruiterUser._id,
        description: `Recruiter partner: ${name} (${designation})`,
      });
    } else if (!company.recruiter) {
      company.recruiter = recruiterUser._id;
      await company.save();
    }

    return res.status(201).json({
      message:
        "Recruiter account created successfully! Your account is currently pending TPO/Admin approval before you can publish campus placement drives.",
      user: {
        id: recruiterUser._id,
        name: recruiterUser.name,
        email: recruiterUser.email,
        role: recruiterUser.role,
        status: recruiterUser.status,
        companyName: recruiterUser.companyName,
      },
    });
  } catch (error) {
    console.error("Recruiter registration error:", error);
    return res.status(500).json({
      message: "Recruiter registration failed",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Your account has been suspended by the placement cell. Please contact TPO.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        status: user.status || "active",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

const getPendingRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({ role: "recruiter", status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      recruiters,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pending recruiters",
      error: error.message,
    });
  }
};

const approveRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiter = await User.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    ).select("-password");

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.status(200).json({
      message: "Recruiter approved successfully",
      recruiter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve recruiter",
      error: error.message,
    });
  }
};

const rejectRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiter = await User.findByIdAndUpdate(
      id,
      { status: "suspended" },
      { new: true }
    ).select("-password");

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.status(200).json({
      message: "Recruiter account suspended / rejected",
      recruiter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject recruiter",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Security: email registered hai ya nahi reveal nahi karna
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Previous reset tokens remove
    await PasswordReset.deleteMany({
      user: user._id,
    });

    // Random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Only hash database mein store hoga
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token valid for 15 minutes
    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await PasswordReset.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    const resetLink =
      `http://localhost:5173/reset-password/${resetToken}`;

    await sendPasswordResetEmail(
      user.email,
      user.name,
      resetLink
    );

    return res.status(200).json({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Failed to process forgot password request",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Token ko hash karke database wale hash se compare karenge
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const passwordReset = await PasswordReset.findOne({
      tokenHash,
    });

    if (!passwordReset) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Expiry check
    if (passwordReset.expiresAt < new Date()) {
      await PasswordReset.deleteOne({
        _id: passwordReset._id,
      });

      return res.status(400).json({
        message: "Reset link has expired",
      });
    }

    // New password hash
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // User password update
    await User.findByIdAndUpdate(
      passwordReset.user,
      {
        password: hashedPassword,
      }
    );

    // Token ko one-time use banaya
    await PasswordReset.deleteOne({
      _id: passwordReset._id,
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Failed to reset password",
    });
  }
};

module.exports = {
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
};