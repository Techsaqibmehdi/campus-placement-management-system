const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const EmailVerification = require("../models/EmailVerification");
const { sendOTPEmail } = require("./emailService");

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const createAndSendOTP = async (email, name) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Remove any existing OTP for this email
  await EmailVerification.deleteMany({
    email: normalizedEmail,
  });

  // Generate 6-digit OTP
  const otp = generateOTP();

  // Hash OTP before storing
  const otpHash = await bcrypt.hash(otp, 10);

  // OTP expires after 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await EmailVerification.create({
    email: normalizedEmail,
    otpHash,
    expiresAt,
  });

  // Send OTP to email
  await sendOTPEmail(
    normalizedEmail,
    otp,
    name
  );
};

module.exports = {
  createAndSendOTP,
};