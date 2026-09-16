const Application = require("../models/Application");
const StudentProfile = require("../models/StudentProfile");
const PlacementDrive = require("../models/PlacementDrive");

const {
  checkEligibility,
} = require("../services/eligibilityService");

const {
  checkOneOfferPolicy,
} = require("../services/placementPolicyService");


const applyForDrive = async (req, res) => {
  try {
    // Find student profile
    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Find placement drive
    const drive = await PlacementDrive.findById(req.params.driveId);

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    // Check drive status
    if (drive.status !== "open") {
      return res.status(400).json({
        message: "This placement drive is closed",
      });
    }

    // Check eligibility
    const eligibilityResult = checkEligibility(student, drive);

    if (!eligibilityResult.eligible) {
      return res.status(400).json({
        message: "You are not eligible for this placement drive",
        checks: eligibilityResult.checks,
      });
    }

    // Check one offer policy
    const canApply = checkOneOfferPolicy(student);

    if (!canApply) {
      return res.status(400).json({
        message:
          "You already have an offer and cannot apply for another drive",
      });
    }

    // Check duplicate application
    const existingApplication = await Application.findOne({
      student: student._id,
      drive: drive._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this placement drive",
      });
    }

    // Create application
    const application = await Application.create({
      student: student._id,
      drive: drive._id,
      status: "applied",
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });

  } catch (error) {
    res.status(500).json({
      message: "Application failed",
      error: error.message,
    });
  }
};


const getMyApplications = async (req, res) => {
  try {
    // Find student profile
    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Find student's applications
    const applications = await Application.find({
      student: student._id,
    })
      .populate({
        path: "drive",
        populate: {
          path: "company",
          select: "name logoUrl industry location",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "applied",
      "shortlisted",
      "rejected",
      "selected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const application = await Application.findById(
      req.params.applicationId
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    application.status = status;

    await application.save();

    return res.status(200).json({
      message: "Application status updated successfully",
      application,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update application status",
      error: error.message,
    });
  }
};
module.exports = {
  applyForDrive,
  getMyApplications,
  updateApplicationStatus,
};