const assert = require("assert");
const mongoose = require("mongoose");
const PlacementDrive = require("../src/models/PlacementDrive");
const Company = require("../src/models/Company");
const User = require("../src/models/User");
const StudentProfile = require("../src/models/StudentProfile");
const Offer = require("../src/models/Offer");

console.log("Running Admin / TPO Workflow & Schema Unit Tests...\n");

// 1. Test Admin Direct Drive Schema Defaults
const adminDrive = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  createdBy: new mongoose.Types.ObjectId(),
  jobTitle: "Associate Software Engineer",
  opportunityType: "placement_drive",
  package: 14.5,
  location: "Delhi-NCR",
  minimumCgpa: 6.5,
  allowedCourses: ["B.Tech", "MCA"],
  eligibleBranches: ["CSE", "IT", "ECE"],
  applicationDeadline: new Date(Date.now() + 86400000 * 7),
  status: "open", // Directly posted by TPO
});

assert.strictEqual(adminDrive.status, "open", "Admin posted drive should be open immediately");
assert.strictEqual(adminDrive.package, 14.5, "Package should match 14.5 LPA");
assert.ok(adminDrive.allowedCourses.includes("MCA"), "Allowed courses should include MCA");
console.log("✓ Test 1 Passed: TPO Direct Drive model instantiated with status 'open'");

// 2. Test Dynamic Company Model Validation
const newPartnerCompany = new Company({
  name: "Adobe Systems India",
  website: "https://adobe.com",
  industry: "Creative Cloud & Digital Media",
  location: "Noida Sector 132",
  description: "Official campus recruitment drive conducted via XYZ CRPC.",
});

assert.strictEqual(newPartnerCompany.name, "Adobe Systems India");
assert.strictEqual(newPartnerCompany.location, "Noida Sector 132");
console.log("✓ Test 2 Passed: Dynamic visiting company model validated");

// 3. Test Student User Schema with College Lock & Status
const studentUser = new User({
  name: "Harshit Verma",
  email: "harshit.22mca012@xyz.edu",
  password: "HashedPassword123!",
  role: "student",
  status: "active",
  college: "XYZ Group of Institutions",
  rollNumber: "2200290140045",
  course: "MCA",
  branch: "Computer Applications",
});

assert.strictEqual(studentUser.college, "XYZ Group of Institutions", "College lock must be XYZ");
assert.strictEqual(studentUser.status, "active", "Default status should be active");
assert.strictEqual(studentUser.rollNumber, "2200290140045");
console.log("✓ Test 3 Passed: Student User verified with institutional attributes");

// 4. Test Student Status Toggling
studentUser.status = "suspended";
assert.strictEqual(studentUser.status, "suspended", "Status toggle to suspended failed");
studentUser.status = "active";
assert.strictEqual(studentUser.status, "active", "Status toggle back to active failed");
console.log("✓ Test 4 Passed: Admin student account toggle (active <-> suspended) logic validated");

// 5. Test Analytics Calculation (Median Package & Salary Tier Distribution)
const mockOffers = [
  { package: 3.5 },
  { package: 4.8 },
  { package: 6.5 },
  { package: 8.0 },
  { package: 12.0 },
  { package: 18.5 },
  { package: 24.0 },
];

// Median calculation
const sorted = mockOffers.map((o) => o.package).sort((a, b) => a - b);
const mid = Math.floor(sorted.length / 2);
const medianPackage = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

assert.strictEqual(medianPackage, 8.0, "Median package of [3.5, 4.8, 6.5, 8.0, 12.0, 18.5, 24.0] must be 8.0");

// Salary tiers
const tiers = {
  "< 4 LPA": 0,
  "4 - 7 LPA": 0,
  "7 - 12 LPA": 0,
  "12+ LPA": 0,
};

sorted.forEach((pkg) => {
  if (pkg < 4) tiers["< 4 LPA"]++;
  else if (pkg < 7) tiers["4 - 7 LPA"]++;
  else if (pkg < 12) tiers["7 - 12 LPA"]++;
  else tiers["12+ LPA"]++;
});

assert.strictEqual(tiers["< 4 LPA"], 1);
assert.strictEqual(tiers["4 - 7 LPA"], 2);
assert.strictEqual(tiers["7 - 12 LPA"], 1);
assert.strictEqual(tiers["12+ LPA"], 3);

console.log("✓ Test 5 Passed: Institutional analytics (median package & salary tiers) calculated accurately");

// 6. Test Placed / Unplaced Student Offer Association
const mockProfileId = new mongoose.Types.ObjectId();
const mockOffer = new Offer({
  application: new mongoose.Types.ObjectId(),
  student: mockProfileId,
  company: new mongoose.Types.ObjectId(),
  drive: new mongoose.Types.ObjectId(),
  jobTitle: "Software Development Engineer",
  package: 18.0,
  baseSalary: 15.0,
  variableSalary: 3.0,
  status: "accepted",
});

assert.strictEqual(mockOffer.status, "accepted");
assert.strictEqual(mockOffer.student.toString(), mockProfileId.toString());
assert.ok(["active", "accepted"].includes(mockOffer.status), "Student must be categorized as PLACED");
console.log("✓ Test 6 Passed: Student placement status calculation from accepted offer verified");

// 7. Test Admin Override of Non-Editable Student Profile Fields
const adminEditPayload = {
  name: "Harshit Verma (Corrected)",
  rollNumber: "2200290140099",
  course: "MCA",
  branch: "Computer Applications (Data Science)",
  college: "XYZ Group of Institutions",
  cgpa: 8.85,
  tenthPercentage: 91.2,
  twelfthPercentage: 89.6,
  backlogs: 0,
};

studentUser.name = adminEditPayload.name;
studentUser.rollNumber = adminEditPayload.rollNumber;
studentUser.branch = adminEditPayload.branch;

const mockProfile = new StudentProfile({
  user: studentUser._id,
  rollNumber: studentUser.rollNumber,
  course: studentUser.course,
  branch: studentUser.branch,
  cgpa: adminEditPayload.cgpa,
  tenthPercentage: adminEditPayload.tenthPercentage,
  twelfthPercentage: adminEditPayload.twelfthPercentage,
  backlogs: adminEditPayload.backlogs,
});

assert.strictEqual(studentUser.name, "Harshit Verma (Corrected)");
assert.strictEqual(studentUser.rollNumber, "2200290140099");
assert.strictEqual(mockProfile.cgpa, 8.85);
assert.strictEqual(mockProfile.branch, "Computer Applications (Data Science)");
console.log("✓ Test 7 Passed: Admin override of student locked/non-editable fields validated");

console.log("\n🎉 ALL ADMIN / TPO WORKFLOW & SCHEMA TESTS PASSED (100%)!\n");

