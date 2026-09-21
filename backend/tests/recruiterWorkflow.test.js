const assert = require("assert");
const mongoose = require("mongoose");
const PlacementDrive = require("../src/models/PlacementDrive");
const Interview = require("../src/models/Interview");
const Offer = require("../src/models/Offer");

console.log("Running Recruiter Workflow Schema & Validation Tests...");

// 1. Test PlacementDrive schema with new opportunity types
const mockDrive = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  jobTitle: "Software Engineer Intern",
  opportunityType: "internship",
  duration: "6 Months",
  stipend: "₹25,000/month",
  location: "Noida, XYZ Campus",
  package: 3.5,
  minimumCgpa: 7.5,
  applicationDeadline: new Date(Date.now() + 86400000),
});

assert.strictEqual(mockDrive.opportunityType, "internship");
assert.strictEqual(mockDrive.duration, "6 Months");
assert.strictEqual(mockDrive.stipend, "₹25,000/month");
console.log("✓ PlacementDrive Internship opportunity fields verified!");

// Test Hackathon opportunity
const mockHackathon = new PlacementDrive({
  company: new mongoose.Types.ObjectId(),
  jobTitle: "XYZ InnoHacks 2026",
  opportunityType: "hackathon",
  theme: "AI for Sustainability",
  teamSize: "2-4 Members",
  prizePool: "₹1,00,000",
  location: "XYZ Auditorium",
  package: 1,
  minimumCgpa: 6.0,
  applicationDeadline: new Date(Date.now() + 86400000),
});
assert.strictEqual(mockHackathon.opportunityType, "hackathon");
assert.strictEqual(mockHackathon.prizePool, "₹1,00,000");
console.log("✓ PlacementDrive Hackathon opportunity fields verified!");

// 2. Test Interview schema with evaluation metrics
const mockInterview = new Interview({
  application: new mongoose.Types.ObjectId(),
  student: new mongoose.Types.ObjectId(),
  drive: new mongoose.Types.ObjectId(),
  company: new mongoose.Types.ObjectId(),
  roundName: "Technical Round 1",
  interviewer: "Lead Architect",
  scheduledAt: new Date(Date.now() + 86400000),
  mode: "online",
  meetingLink: "https://meet.google.com/abc-def-ghi",
  score: 85,
  result: "passed",
  feedback: "Strong core DSA and clean coding style",
});

assert.strictEqual(mockInterview.roundName, "Technical Round 1");
assert.strictEqual(mockInterview.score, 85);
assert.strictEqual(mockInterview.result, "passed");
console.log("✓ Interview evaluation fields (roundName, score, result, feedback) verified!");

// 3. Test Offer schema with compensation breakdown
const mockOffer = new Offer({
  application: new mongoose.Types.ObjectId(),
  student: new mongoose.Types.ObjectId(),
  drive: new mongoose.Types.ObjectId(),
  company: new mongoose.Types.ObjectId(),
  jobTitle: "Member Technical Staff",
  package: 12,
  baseSalary: 10.5,
  variableSalary: 1.5,
  offerLetterUrl: "https://res.cloudinary.com/demo/offer_letter.pdf",
});

assert.strictEqual(mockOffer.package, 12);
assert.strictEqual(mockOffer.baseSalary, 10.5);
assert.strictEqual(mockOffer.variableSalary, 1.5);
assert.strictEqual(mockOffer.offerLetterUrl, "https://res.cloudinary.com/demo/offer_letter.pdf");
console.log("✓ Offer compensation breakdown and letter fields verified!");

console.log("All Recruiter Workflow Unit Tests Passed Successfully!");

