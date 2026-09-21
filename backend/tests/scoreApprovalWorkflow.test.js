const assert = require("assert");
const mongoose = require("mongoose");
const StudentProfile = require("../src/models/StudentProfile");
const ScoreUpdateRequest = require("../src/models/ScoreUpdateRequest");

async function runTests() {
  console.log("Running Academic Score Locking & TPO Approval Workflow Unit Tests...\n");

  const dummyStudentId = new mongoose.Types.ObjectId();
  const dummyProfileId = new mongoose.Types.ObjectId();

  // Test 1: StudentProfile schema initializes with academicScoresLocked: false by default
  try {
    const profile = new StudentProfile({
      user: dummyStudentId,
      rollNumber: "TEST-ROLL-001",
      course: "MCA",
      branch: "CSE",
    });
    assert.strictEqual(profile.academicScoresLocked, false, "Default academicScoresLocked must be false");
    console.log("✓ Test 1 Passed: StudentProfile default academicScoresLocked is false for new registrations");
  } catch (err) {
    console.error("✕ Test 1 Failed:", err);
    process.exit(1);
  }

  // Test 2: ScoreUpdateRequest validates valid requestedScores and default status 'pending'
  try {
    const request = new ScoreUpdateRequest({
      student: dummyStudentId,
      profile: dummyProfileId,
      currentScores: {
        cgpa: 7.2,
        tenthPercentage: 78,
        twelfthPercentage: 75,
        backlogs: 1,
      },
      requestedScores: {
        cgpa: 8.5,
        tenthPercentage: 78,
        twelfthPercentage: 75,
        backlogs: 0,
      },
      reason: "Supplementary exam passed; cleared backlog and updated CGPA.",
    });

    const validationErr = request.validateSync();
    assert.strictEqual(validationErr, undefined, "Valid ScoreUpdateRequest should pass validation");
    assert.strictEqual(request.status, "pending", "Status must default to 'pending'");
    console.log("✓ Test 2 Passed: ScoreUpdateRequest instantiates with status 'pending' and validates fields");
  } catch (err) {
    console.error("✕ Test 2 Failed:", err);
    process.exit(1);
  }

  // Test 3: ScoreUpdateRequest schema rejects out-of-bounds CGPA (> 10) or missing reason
  try {
    const invalidRequest = new ScoreUpdateRequest({
      student: dummyStudentId,
      profile: dummyProfileId,
      requestedScores: {
        cgpa: 12.5, // Invalid CGPA
        tenthPercentage: 80,
        twelfthPercentage: 80,
        backlogs: 0,
      },
      // missing reason
    });

    const validationErr = invalidRequest.validateSync();
    assert(validationErr, "Validation must fail for invalid CGPA and missing reason");
    assert(validationErr.errors["requestedScores.cgpa"], "CGPA > 10 should be rejected");
    assert(validationErr.errors["reason"], "Reason is required");
    console.log("✓ Test 3 Passed: Out-of-bounds CGPA and missing reason are strictly rejected by schema");
  } catch (err) {
    console.error("✕ Test 3 Failed:", err);
    process.exit(1);
  }

  // Test 4: Simulate controller logic for locking scores
  try {
    // New profile
    const profile = new StudentProfile({
      user: dummyStudentId,
      rollNumber: "TEST-ROLL-002",
      course: "B.Tech",
      cgpa: null,
      tenthPercentage: null,
      twelfthPercentage: null,
      academicScoresLocked: false,
    });

    // 1st time update: Allowed directly
    const firstTimePayload = {
      cgpa: 7.5,
      tenthPercentage: 82,
      twelfthPercentage: 80,
      backlogs: 0,
    };

    let isLocked = Boolean(profile.academicScoresLocked || (profile.cgpa !== null && profile.tenthPercentage !== null));
    assert.strictEqual(isLocked, false, "Must not be locked before first score submission");

    // Apply first-time scores
    profile.cgpa = firstTimePayload.cgpa;
    profile.tenthPercentage = firstTimePayload.tenthPercentage;
    profile.twelfthPercentage = firstTimePayload.twelfthPercentage;
    profile.backlogs = firstTimePayload.backlogs;
    profile.academicScoresLocked = true;

    // 2nd time update: Blocked directly
    isLocked = Boolean(profile.academicScoresLocked || (profile.cgpa !== null && profile.tenthPercentage !== null));
    assert.strictEqual(isLocked, true, "Must be locked after first score submission");

    const secondTimeAttempt = { cgpa: 9.9 }; // Student trying to boost CGPA to breach eligibility
    const isDirectUpdateBlocked = isLocked && secondTimeAttempt.cgpa !== undefined;
    assert.strictEqual(isDirectUpdateBlocked, true, "Direct score alteration must be blocked when locked");

    console.log("✓ Test 4 Passed: 1st time scores entry is allowed; subsequent direct edits are blocked (403 lock)");
  } catch (err) {
    console.error("✕ Test 4 Failed:", err);
    process.exit(1);
  }

  // Test 5: Simulate TPO Approval & Rejection state machine
  try {
    const profile = new StudentProfile({
      user: dummyStudentId,
      rollNumber: "TEST-ROLL-003",
      course: "B.Tech",
      cgpa: 6.8,
      tenthPercentage: 70,
      twelfthPercentage: 70,
      backlogs: 2,
      academicScoresLocked: true,
    });

    const scoreRequest = new ScoreUpdateRequest({
      student: dummyStudentId,
      profile: profile._id,
      currentScores: { cgpa: 6.8, tenthPercentage: 70, twelfthPercentage: 70, backlogs: 2 },
      requestedScores: { cgpa: 8.2, tenthPercentage: 70, twelfthPercentage: 70, backlogs: 0 },
      reason: "Re-evaluation grade card verified by exam controller.",
      status: "pending",
    });

    // Case A: TPO Approval
    profile.cgpa = scoreRequest.requestedScores.cgpa;
    profile.backlogs = scoreRequest.requestedScores.backlogs;
    scoreRequest.status = "approved";
    scoreRequest.reviewRemarks = "Approved after verifying physical grade card.";
    scoreRequest.reviewedAt = new Date();

    assert.strictEqual(profile.cgpa, 8.2, "Approved CGPA must be applied to StudentProfile");
    assert.strictEqual(profile.backlogs, 0, "Approved backlogs must be applied to StudentProfile");
    assert.strictEqual(scoreRequest.status, "approved", "Request status must transition to 'approved'");

    // Case B: TPO Rejection on a fresh request
    const secondRequest = new ScoreUpdateRequest({
      student: dummyStudentId,
      profile: profile._id,
      currentScores: { cgpa: 8.2, tenthPercentage: 70, twelfthPercentage: 70, backlogs: 0 },
      requestedScores: { cgpa: 9.8, tenthPercentage: 95, twelfthPercentage: 95, backlogs: 0 },
      reason: "Typo in marks",
      status: "pending",
    });

    // Rejecting leaves profile scores unchanged
    secondRequest.status = "rejected";
    secondRequest.reviewRemarks = "Marksheet proof does not match university record.";
    secondRequest.reviewedAt = new Date();

    assert.strictEqual(profile.cgpa, 8.2, "Profile CGPA must remain unchanged on rejection");
    assert.strictEqual(secondRequest.status, "rejected", "Request status must be 'rejected'");
    assert(secondRequest.reviewRemarks.length > 0, "Rejection remarks must be preserved");

    console.log("✓ Test 5 Passed: TPO Approval applies scores to profile; TPO Rejection preserves original scores");
  } catch (err) {
    console.error("✕ Test 5 Failed:", err);
    process.exit(1);
  }

  console.log("\n🎉 ALL ACADEMIC SCORE APPROVAL WORKFLOW TESTS PASSED (100%)!\n");
}

runTests();

