const assert = require("assert");
const mongoose = require("mongoose");
const PlacementDrive = require("../src/models/PlacementDrive");
const Competition = require("../src/models/Competition");
const { checkEligibility } = require("../src/services/eligibilityService");

console.log("Running 'Open to All' (No Eligibility Criteria) Unit Tests...\n");

// Test 1: Model validation for PlacementDrive with isOpenToAll: true
const driveOpen = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  jobTitle: "Open Innovation Hackathon",
  isOpenToAll: true,
  package: 10,
  location: "Noida",
  applicationDeadline: new Date(Date.now() + 86400000),
});
assert.strictEqual(driveOpen.isOpenToAll, true, "Drive should have isOpenToAll: true");
assert.strictEqual(driveOpen.minimumCgpa, 0, "Default minimumCgpa should be 0");
console.log("✓ Test 1 Passed: PlacementDrive with isOpenToAll: true instantiates without requiring cutoffs");

// Test 2: Model validation for Competition with isOpenToAll: true
const compOpen = new Competition({
  title: "XYZ Code Combat 2026",
  isOpenToAll: true,
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000),
  registrationDeadline: new Date(Date.now() + 43200000),
});
assert.strictEqual(compOpen.isOpenToAll, true, "Competition should have isOpenToAll: true");
console.log("✓ Test 2 Passed: Competition schema supports isOpenToAll attribute");

// Test 3: checkEligibility with student having backlogs, low CGPA, and different branch
const studentLowMarks = {
  cgpa: 5.2,
  tenthPercentage: 45,
  twelfthPercentage: 50,
  backlogs: 4,
  course: "BCA",
  branch: "Mechanical",
  skills: ["HTML"],
};

const strictDrive = {
  isOpenToAll: false,
  minimumCgpa: 7.5,
  allowedCourses: ["B.Tech", "MCA"],
  eligibleBranches: ["CSE", "IT"],
  maximumBacklogs: 0,
  requiredSkills: ["Java", "Spring Boot"],
  minimumTenthPercentage: 60,
  minimumTwelfthPercentage: 60,
};

const strictResult = checkEligibility(studentLowMarks, strictDrive);
assert.strictEqual(strictResult.eligible, false, "Student must NOT be eligible under strict criteria");
assert(strictResult.reasons.length >= 3, "Strict check must yield multiple blocking reasons");
console.log("✓ Test 3 Passed: Strict eligibility rules reject candidate who doesn't meet cutoffs");

// Test 4: checkEligibility with isOpenToAll: true on the same student
const openDrive = {
  isOpenToAll: true,
  minimumCgpa: 0,
  allowedCourses: [],
  eligibleBranches: [],
  maximumBacklogs: 99,
  requiredSkills: [],
};

const openResult = checkEligibility(studentLowMarks, openDrive);
assert.strictEqual(openResult.eligible, true, "Student MUST be 100% eligible when drive is Open to All");
assert.strictEqual(openResult.reasons.length, 0, "Open to All must produce 0 blocking reasons");
assert.strictEqual(openResult.checks.cgpa, true, "All check flags must be true");
assert.strictEqual(openResult.checks.backlogs, true, "Backlogs check must be true");
console.log("✓ Test 4 Passed: Candidate with low marks and 4 backlogs is 100% ELIGIBLE when drive is Open to All");

console.log("\n🎉 ALL 'OPEN TO ALL' ELIGIBILITY UNIT TESTS PASSED (100%)!\n");

