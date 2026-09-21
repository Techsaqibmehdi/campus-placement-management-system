const { checkEligibility } = require("../src/services/eligibilityService");

const drive = {
  minimumCgpa: 7.0,
  allowedCourses: ["MCA", "B.Tech"],
  eligibleBranches: ["CSE", "IT"],
  minimumTenthPercentage: 60,
  minimumTwelfthPercentage: 60,
  maximumBacklogs: 0,
  requiredSkills: ["Java", "SQL"],
};

// Case 1: Fully eligible student
const studentPass = {
  cgpa: 8.5,
  course: "MCA",
  branch: "CSE",
  tenthPercentage: 85,
  twelfthPercentage: 77,
  backlogs: 0,
  skills: ["Java", "SQL", "React.js"],
};
const res1 = checkEligibility(studentPass, drive);
console.assert(res1.eligible === true, "Case 1 should pass");

// Case 2: Lower CGPA
const studentLowCgpa = { ...studentPass, cgpa: 6.5 };
const res2 = checkEligibility(studentLowCgpa, drive);
console.assert(res2.eligible === false, "Case 2 should fail on CGPA");
console.assert(
  res2.reasons.some((r) => r.includes("Minimum CGPA required: 7")),
  "Reason should mention CGPA"
);

// Case 3: Ineligible course
const studentBca = { ...studentPass, course: "BCA" };
const res3 = checkEligibility(studentBca, drive);
console.assert(res3.eligible === false, "Case 3 should fail on Course");
console.assert(
  res3.reasons.some((r) => r.includes("Course BCA is not eligible")),
  "Reason should mention Course"
);

// Case 4: Backlogs present
const studentBacklog = { ...studentPass, backlogs: 1 };
const res4 = checkEligibility(studentBacklog, drive);
console.assert(res4.eligible === false, "Case 4 should fail on backlogs");

// Case 5: Missing skill
const studentNoSql = { ...studentPass, skills: ["Java"] };
const res5 = checkEligibility(studentNoSql, drive);
console.assert(res5.eligible === false, "Case 5 should fail on skills");
console.assert(
  res5.criteria.skills.missing.includes("SQL"),
  "Missing skills should list SQL"
);

console.log("✓ All Eligibility Engine test cases passed!");

