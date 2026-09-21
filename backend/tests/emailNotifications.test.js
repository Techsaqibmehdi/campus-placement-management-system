require("dotenv").config();
const { sendWelcomeEmail, sendOfferReleaseEmail } = require("../src/services/emailService");

async function runTests() {
  console.log("Starting Welcome & Offer Email Notification Unit Tests...\n");

  const testEmail = process.env.EMAIL_USER; // send test email to configured address so it's safe

  // Test 1: Welcome Email
  console.log("Test 1: Sending Welcome Email...");
  try {
    await sendWelcomeEmail(testEmail, "Saqib Mehdi", {
      rollNumber: "2100290120150",
      course: "MCA",
      branch: "Computer Science",
      college: "XYZ Group of Institutions",
    });
    console.log("✓ Test 1 Passed: Welcome Email successfully sent!\n");
  } catch (err) {
    console.error("✗ Test 1 Failed: Welcome Email error:", err.message);
    process.exit(1);
  }

  // Test 2: Offer Release Email (Super Dream Offer)
  console.log("Test 2: Sending Offer Release Email (Super Dream)...");
  try {
    await sendOfferReleaseEmail(testEmail, "Saqib Mehdi", {
      jobTitle: "Senior Cloud Solutions Engineer",
      companyName: "Google Cloud Partners",
      packageAmount: 18.5,
      baseSalary: 15.0,
      joiningDate: new Date("2026-07-01"),
      offerLetterUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    });
    console.log("✓ Test 2 Passed: Offer Release Email (Super Dream) successfully sent!\n");
  } catch (err) {
    console.error("✗ Test 2 Failed: Offer Release Email error:", err.message);
    process.exit(1);
  }

  // Test 3: Offer Release Email (Regular Offer without remote PDF)
  console.log("Test 3: Sending Offer Release Email (Regular Offer without attachment)...");
  try {
    await sendOfferReleaseEmail(testEmail, "Saqib Mehdi", {
      jobTitle: "Associate Software Engineer",
      companyName: "TCS Digital",
      packageAmount: 5.5,
      baseSalary: 4.8,
      joiningDate: new Date("2026-08-15"),
      offerLetterUrl: "",
    });
    console.log("✓ Test 3 Passed: Regular Offer Email without remote attachment successfully sent!\n");
  } catch (err) {
    console.error("✗ Test 3 Failed: Regular Offer Email error:", err.message);
    process.exit(1);
  }

  console.log("🎉 ALL EMAIL NOTIFICATION UNIT TESTS PASSED (100%)!");
}

runTests();

