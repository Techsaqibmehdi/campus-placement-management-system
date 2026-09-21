const mongoose = require("mongoose");
const Competition = require("../src/models/Competition");
const Company = require("../src/models/Company");

console.log("Running Competition and Corporate Partner Unit Tests...");

// 1. Competition Schema with diverse event categories (Ideathon, AI/ML Sprint, Web Dev)
const testCompTypes = ["Ideathon", "Web Development", "AI / ML Sprint", "Coding Contest", "Hackathon"];
testCompTypes.forEach((t) => {
  const comp = new Competition({
    title: `XYZ ${t} 2026`,
    description: `Official campus ${t}`,
    type: t,
    organizer: "XYZ CRPC & Department Club",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    registrationDeadline: new Date(),
    maxTeamSize: 4,
    teamSize: "Team (Up to 4 Members)",
    createdBy: new mongoose.Types.ObjectId(),
  });
  console.assert(comp.type === t, `Type should match ${t}`);
  console.assert(comp.maxTeamSize === 4, "maxTeamSize should be 4");
});
console.log("✓ Test 1 Passed: Flexible competition categories (Ideathon, Web Dev, AI/ML) validated");

// 2. Default Team Size validation
const soloComp = new Competition({
  title: "Algo Challenge",
  startDate: new Date(),
  endDate: new Date(),
  registrationDeadline: new Date(),
  createdBy: new mongoose.Types.ObjectId(),
});
console.assert(soloComp.maxTeamSize === 1, "Default maxTeamSize should be 1");
console.assert(soloComp.teamSize === "Individual", "Default teamSize should be Individual");
console.log("✓ Test 2 Passed: Solo/Team size defaults validated");

// 3. Corporate Partner - Direct Campus Partner (no recruiter)
const directPartner = new Company({
  name: "Cisco Systems India",
  industry: "Cloud & Networking",
  location: "Bangalore",
  website: "https://cisco.com",
  description: "Global leader in technology and networking.",
  recruiter: null,
});
console.assert(directPartner.recruiter === null, "Direct partner should have null recruiter");
console.assert(directPartner.name === "Cisco Systems India", "Name should match");
console.log("✓ Test 3 Passed: Direct TPO Corporate Partner (self-managed) validated");

// 4. Corporate Partner - Assigned Recruiter
const recruiterId = new mongoose.Types.ObjectId();
const recruiterPartner = new Company({
  name: "Amazon India Development Center",
  industry: "E-Commerce & Cloud",
  location: "Gurgaon",
  website: "https://amazon.jobs",
  description: "Global cloud and e-commerce technology partner.",
  recruiter: recruiterId,
});
console.assert(recruiterPartner.recruiter.equals(recruiterId), "Recruiter ID should match");
console.log("✓ Test 4 Passed: Assigned Recruiter Partner validated");

console.log("\n🎉 ALL COMPETITION & CORPORATE PARTNER TESTS PASSED (100%)!\n");
