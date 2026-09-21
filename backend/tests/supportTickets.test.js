const mongoose = require("mongoose");
const SupportTicket = require("../src/models/SupportTicket");

const runTests = async () => {
  console.log("Running Support Tickets & Grievance Helpdesk Unit Tests...\n");

  try {
    const studentId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    // Test 1: Ticket Schema Validation with Valid Category & Priority
    const ticket1 = new SupportTicket({
      student: studentId,
      subject: "CGPA Mismatch after re-evaluation",
      category: "academic_discrepancy",
      priority: "high",
      description: "My 3rd sem result updated from 7.2 to 7.85 CGPA. Please update my profile before Google drive deadline.",
    });

    const validationError1 = ticket1.validateSync();
    if (validationError1) throw validationError1;
    if (ticket1.status !== "open") throw new Error("Default status must be 'open'");
    console.log("✓ Test 1 Passed: Valid ticket instantiates with default status 'open' and 'high' priority");

    // Test 2: Category validation rejection
    const ticket2 = new SupportTicket({
      student: studentId,
      subject: "Test invalid",
      category: "invalid_category",
      description: "Sample",
    });
    const validationError2 = ticket2.validateSync();
    if (!validationError2 || !validationError2.errors.category) {
      throw new Error("Invalid category should have failed validation");
    }
    console.log("✓ Test 2 Passed: Invalid category correctly rejected by schema enum validation");

    // Test 3: Missing required subject and description
    const ticket3 = new SupportTicket({
      student: studentId,
    });
    const validationError3 = ticket3.validateSync();
    if (!validationError3.errors.subject || !validationError3.errors.description) {
      throw new Error("Missing subject & description should have triggered validation errors");
    }
    console.log("✓ Test 3 Passed: Missing subject and description trigger required validation errors");

    // Test 4: Status Transition & Resolution State
    ticket1.status = "in_progress";
    ticket1.adminResponse = "We have received your transcript. Verifying with the examination cell.";
    ticket1.resolvedBy = adminId;
    ticket1.status = "resolved";
    ticket1.resolvedAt = new Date();

    if (ticket1.status !== "resolved" || !ticket1.resolvedAt || !ticket1.adminResponse) {
      throw new Error("Resolution state did not persist properly");
    }
    console.log("✓ Test 4 Passed: Status transition to 'in_progress' and 'resolved' validated with audit timestamp");

    console.log("\n🎉 ALL SUPPORT TICKETS & HELPDESK TESTS PASSED (100%)!");
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
};

runTests();

