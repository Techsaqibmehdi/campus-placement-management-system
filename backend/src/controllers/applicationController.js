const Application = require("../models/Application");
const StudentProfile = require("../models/StudentProfile");
const PlacementDrive = require("../models/PlacementDrive");
const Company = require("../models/Company");
const Offer = require("../models/Offer");

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
    const canApply = await checkOneOfferPolicy(student._id);

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

const getRecruiterApplications = async (req, res) => {
  try {
    // Find company assigned to recruiter
    const company = await Company.findOne({
      recruiter: req.user.id,
    });

    if (!company) {
      return res.status(404).json({
        message: "No company assigned to this recruiter",
      });
    }

    // Find applications for this company's drives
    const applications = await Application.find()
      .populate({
        path: "drive",
        match: { company: company._id },
        populate: {
          path: "company",
          select: "name logoUrl industry location",
        },
      })
      .populate({
        path: "student",
        select:
          "rollNumber course branch cgpa tenthPercentage twelfthPercentage skills projects internships backlogs resumeUrl",
      })
      .sort({ createdAt: -1 });

    // Remove applications whose drive doesn't belong to recruiter
    const filteredApplications = applications.filter(
      (application) => application.drive !== null
    );

    return res.status(200).json({
      count: filteredApplications.length,
      applications: filteredApplications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recruiter applications",
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

    // Find application
    const application = await Application.findById(
      req.params.applicationId
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Allowed status transitions
    const allowedTransitions = {
      applied: ["shortlisted", "rejected"],
      shortlisted: ["selected", "rejected"],
      selected: [],
      rejected: [],
    };

    const currentStatus = application.status;

    if (!allowedTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Recruiter ownership check
    if (req.user.role === "recruiter") {
      const drive = await PlacementDrive.findById(
        application.drive
      );

      if (!drive) {
        return res.status(404).json({
          message: "Placement drive not found",
        });
      }

      const company = await Company.findById(
        drive.company
      );

      if (!company) {
        return res.status(404).json({
          message: "Company not found",
        });
      }

      if (
        company.recruiter?.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message:
            "You can only update applications for your assigned company",
        });
      }
    }

    // Update status
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

const createOffer = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { joiningDate } = req.body;

    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Offer can only be created for selected candidates
    if (application.status !== "selected") {
      return res.status(400).json({
        message: "Offer can only be created for a selected candidate",
      });
    }

    // Find drive
    const drive = await PlacementDrive.findById(
      application.drive
    );

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    // Find company
    const company = await Company.findById(drive.company);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Recruiter ownership check
    if (
      req.user.role === "recruiter" &&
      company.recruiter?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message:
          "You can only create offers for your assigned company",
      });
    }

    // Check if offer already exists
    const existingOffer = await Offer.findOne({
      application: application._id,
    });

    if (existingOffer) {
      return res.status(400).json({
        message: "Offer already exists for this application",
      });
    }

    // Create offer
    const offer = await Offer.create({
      application: application._id,
      student: application.student,
      company: company._id,
      drive: drive._id,
      jobTitle: drive.jobTitle,
      package: drive.package,
      joiningDate,
    });

    return res.status(201).json({
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Offer creation failed",
      error: error.message,
    });
  }
};
module.exports = {
  applyForDrive,
  getMyApplications,
  updateApplicationStatus,
  getRecruiterApplications,
  createOffer,
};