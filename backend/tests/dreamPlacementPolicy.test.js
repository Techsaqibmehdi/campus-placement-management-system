const assert = require("assert");
const { getDriveCategory, checkOneOfferPolicy } = require("../src/services/placementPolicyService");

// Mock Offer model for testing
const mongoose = require("mongoose");
const Offer = require("../src/models/Offer");

async function runTests() {
  console.log("Starting Dream & Super Dream Offer Policy Unit Tests...\n");

  // TEST 1: Category Resolution
  console.log("Test 1: Drive Category Resolution");
  const driveRegular = { package: 4.5 };
  const driveDream = { package: 7.5 };
  const driveSuperDream = { package: 12 };
  const driveOverride = { package: 5, category: "Dream" };

  assert.strictEqual(getDriveCategory(driveRegular), "Regular", "4.5 LPA should be Regular");
  assert.strictEqual(getDriveCategory(driveDream), "Dream", "7.5 LPA should be Dream");
  assert.strictEqual(getDriveCategory(driveSuperDream), "Super Dream", "12 LPA should be Super Dream");
  assert.strictEqual(getDriveCategory(driveOverride), "Dream", "Explicit category override should take priority");
  console.log("✓ Test 1 Passed: Drive Category resolution matches expected thresholds (< 6 LPA, 6-10 LPA, >= 10 LPA)\n");

  // TEST 2: Policy for Unplaced Student (No Offer)
  console.log("Test 2: Unplaced Student Policy Check");
  // Stub Offer.findOne to simulate no offer
  const originalFindOne = Offer.findOne;
  Offer.findOne = () => ({
    sort: () => Promise.resolve(null),
  });

  const unplacedStudentId = new mongoose.Types.ObjectId();
  const resUnplacedRegular = await checkOneOfferPolicy(unplacedStudentId, driveRegular);
  const resUnplacedDream = await checkOneOfferPolicy(unplacedStudentId, driveDream);
  const resUnplacedSuperDream = await checkOneOfferPolicy(unplacedStudentId, driveSuperDream);

  assert.strictEqual(resUnplacedRegular.canApply, true, "Unplaced student should be able to apply to Regular drive");
  assert.strictEqual(resUnplacedDream.canApply, true, "Unplaced student should be able to apply to Dream drive");
  assert.strictEqual(resUnplacedSuperDream.canApply, true, "Unplaced student should be able to apply to Super Dream drive");
  console.log("✓ Test 2 Passed: Unplaced student can freely apply to Regular, Dream, and Super Dream drives\n");

  // TEST 3: Policy for Placed Student (Holding 4.5 LPA Regular Offer)
  console.log("Test 3: Placed Student with Regular Offer applying to Regular vs Dream vs Super Dream");
  const placedOffer = {
    _id: new mongoose.Types.ObjectId(),
    package: 4.5,
    status: "accepted",
    jobTitle: "Junior Developer",
  };
  Offer.findOne = () => ({
    sort: () => Promise.resolve(placedOffer),
  });

  const placedStudentId = new mongoose.Types.ObjectId();
  const resPlacedRegular = await checkOneOfferPolicy(placedStudentId, driveRegular);
  const resPlacedDream = await checkOneOfferPolicy(placedStudentId, driveDream);
  const resPlacedSuperDream = await checkOneOfferPolicy(placedStudentId, driveSuperDream);

  // Placed student must be BLOCKED from Regular drives
  assert.strictEqual(resPlacedRegular.canApply, false, "Placed student MUST be blocked from applying to Regular drive (< 6 LPA)");
  assert.ok(resPlacedRegular.message.includes("students with an active or accepted offer cannot apply for Regular drives"), "Should return clear one offer policy explanation");

  // Placed student must be ALLOWED to apply to Dream and Super Dream drives
  assert.strictEqual(resPlacedDream.canApply, true, "Placed student MUST be allowed to apply to Dream drive (>= 6 LPA)");
  assert.strictEqual(resPlacedDream.isUpgrade, true, "Should be marked as upgrade");
  assert.strictEqual(resPlacedSuperDream.canApply, true, "Placed student MUST be allowed to apply to Super Dream drive (>= 10 LPA)");
  assert.strictEqual(resPlacedSuperDream.isUpgrade, true, "Should be marked as upgrade");
  console.log("✓ Test 3 Passed: Placed student is blocked from Regular drives, but fully eligible for Dream & Super Dream drives!\n");

  // Restore Offer.findOne
  Offer.findOne = originalFindOne;

  console.log("🎉 ALL DREAM & SUPER DREAM PLACEMENT POLICY TESTS PASSED (100%)!\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});

