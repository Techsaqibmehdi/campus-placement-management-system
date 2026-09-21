const assert = require("assert");
const mongoose = require("mongoose");
const PlacementDrive = require("../src/models/PlacementDrive");
const Company = require("../src/models/Company");

console.log("Running Placement Drive Creation Unit Tests...\n");

// 1. Drive creation with empty location & package (e.g. from clean form)
const driveWithDefaults = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  createdBy: new mongoose.Types.ObjectId(),
  jobTitle: "Software Development Engineer",
  opportunityType: "placement_drive",
  applicationDeadline: new Date(Date.now() + 86400000 * 5),
  status: "open",
});

const validateErr = driveWithDefaults.validateSync();
assert.strictEqual(validateErr, undefined, "Drive with defaults should pass validation without error");
assert.strictEqual(driveWithDefaults.package, 0, "Default package should be 0");
assert.strictEqual(driveWithDefaults.location, "Delhi-NCR / XYZ Campus", "Default location should be Delhi-NCR / XYZ Campus");
console.log("✓ Test 1 Passed: PlacementDrive validates cleanly with default package (0) and default location");

// 2. Internship drive creation without package
const internshipDrive = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  createdBy: new mongoose.Types.ObjectId(),
  jobTitle: "Research Intern",
  opportunityType: "internship",
  stipend: "₹35,000/month",
  duration: "6 Months",
  location: "Bangalore",
  applicationDeadline: new Date(Date.now() + 86400000 * 10),
  status: "open",
});

const internValidateErr = internshipDrive.validateSync();
assert.strictEqual(internValidateErr, undefined, "Internship drive should validate cleanly without explicit package");
assert.strictEqual(internshipDrive.stipend, "₹35,000/month");
console.log("✓ Test 2 Passed: Internship drive validates cleanly with stipend and duration");

// 3. Open for all drive creation
const openDrive = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  createdBy: new mongoose.Types.ObjectId(),
  jobTitle: "Graduate Engineer Trainee (Open for All)",
  opportunityType: "placement_drive",
  isOpenToAll: true,
  package: 8.5,
  location: "Delhi-NCR / Noida",
  applicationDeadline: new Date(Date.now() + 86400000 * 7),
  status: "open",
});

const openValidateErr = openDrive.validateSync();
assert.strictEqual(openValidateErr, undefined, "Open for all drive should validate cleanly");
assert.strictEqual(openDrive.isOpenToAll, true);
console.log("✓ Test 3 Passed: 'Open for All' direct drive validates cleanly");

// 4. Validation error triggered if jobTitle is missing
const invalidDrive = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  applicationDeadline: new Date(Date.now() + 86400000 * 7),
});

const shouldFailErr = invalidDrive.validateSync();
assert.ok(shouldFailErr, "Drive without jobTitle must trigger validation error");
assert.ok(shouldFailErr.errors.jobTitle, "jobTitle error must be present");
console.log("✓ Test 4 Passed: Missing jobTitle correctly triggers validation error");

console.log("\n🎉 ALL PLACEMENT DRIVE CREATION UNIT TESTS PASSED (100%)!");

