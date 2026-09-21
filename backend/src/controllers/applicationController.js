const Application = require("../models/Application");
const StudentProfile = require("../models/StudentProfile");
const PlacementDrive = require("../models/PlacementDrive");
const Company = require("../models/Company");
const Offer = require("../models/Offer");

const { checkEligibility } = require("../services/eligibilityService");
const { checkOneOfferPolicy } = require("../services/placementPolicyService");
const { sendOfferReleaseEmail } = require("../services/emailService");
const { generateOfferLetterPDF } = require("../services/offerLetterGenerator");

const applyForDrive = async (req, res) => {
  try {
    // 1. Find student profile
    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found. Please create your profile first.",
      });
    }

    // 2. Completeness validation: Must have CGPA and at least 1 resume
    if (student.cgpa == null) {
      return res.status(400).json({
        message: "Please complete your academic profile (CGPA) before applying.",
      });
    }

    if (!student.resumes || student.resumes.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one resume to your profile before applying.",
      });
    }

    // 3. Find placement drive
    const drive = await PlacementDrive.findById(req.params.driveId);

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    // 4. Check drive status
    if (drive.status !== "open") {
      return res.status(400).json({
        message: "This placement drive is not open for applications",
      });
    }

    // 5. Check deadline
    if (new Date(drive.applicationDeadline) < new Date()) {
      return res.status(400).json({
        message: "The application deadline for this drive has passed",
      });
    }

    // 6. Check eligibility using diagnostic engine
    const eligibilityResult = checkEligibility(student, drive);

    if (!eligibilityResult.eligible) {
      return res.status(400).json({
        message: "You are not eligible for this placement drive",
        reasons: eligibilityResult.reasons,
        criteria: eligibilityResult.criteria,
        checks: eligibilityResult.checks,
      });
    }

    // 7. Check one offer policy with target drive category (Dream/Super Dream exemption)
    const policyResult = await checkOneOfferPolicy(student._id, drive);

    if (!policyResult.canApply) {
      return res.status(400).json({
        message:
          policyResult.message ||
          "You already have an active or accepted offer and cannot apply for another Regular drive under the college placement policy.",
        policyRestriction: true,
        category: policyResult.category,
        existingOffer: policyResult.existingOffer,
      });
    }

    // 8. Check duplicate application
    const existingApplication = await Application.findOne({
      student: student._id,
      drive: drive._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this placement drive",
      });
    }

    // 9. Determine resume snapshot
    let selectedResume = null;
    if (req.body.resumeId) {
      selectedResume = student.resumes.find(
        (r) => r._id.toString() === req.body.resumeId
      );
    }

    if (!selectedResume) {
      selectedResume =
        student.resumes.find((r) => r.isPrimary) || student.resumes[0];
    }

    const resumeSnapshot = selectedResume
      ? {
          resumeId: selectedResume._id,
          url: selectedResume.url,
          name: selectedResume.name,
        }
      : {
          resumeId: null,
          url: "",
          name: "",
        };

    // 10. Create application
    const application = await Application.create({
      student: student._id,
      drive: drive._id,
      resume: resumeSnapshot,
      status: "applied",
      statusHistory: [
        {
          status: "applied",
          changedAt: new Date(),
          comments: "Application submitted by student",
        },
      ],
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
    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

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
    const company = await Company.findOne({
      recruiter: req.user.id,
    });

    if (!company) {
      return res.status(404).json({
        message: "No company assigned to this recruiter",
      });
    }

    const { driveId, status } = req.query;
    const driveMatch = { company: company._id };
    if (driveId) {
      driveMatch._id = driveId;
    }

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate({
        path: "drive",
        match: driveMatch,
        populate: {
          path: "company",
          select: "name logoUrl industry location",
        },
      })
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email college rollNumber course branch",
        },
      })
      .sort({ createdAt: -1 });

    const filteredApplications = applications.filter(
      (app) => app.drive !== null
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

const getDriveApplications = async (req, res) => {
  try {
    const { driveId } = req.params;
    const drive = await PlacementDrive.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    if (req.user.role === "recruiter") {
      const company = await Company.findById(drive.company);
      if (!company || company.recruiter?.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You can only view applications for your assigned company",
        });
      }
    }

    const { status } = req.query;
    const filter = { drive: driveId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email college rollNumber course branch",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      driveTitle: drive.jobTitle,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch drive applications",
      error: error.message,
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;

    const allowedStatuses = [
      "applied",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid application status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Allowed status transitions
    const allowedTransitions = {
      applied: ["under_review", "shortlisted", "rejected"],
      under_review: ["shortlisted", "rejected"],
      shortlisted: ["interview", "selected", "rejected"],
      interview: ["selected", "rejected"],
      selected: [],
      rejected: ["under_review", "shortlisted"], // allow review reconsideration
    };

    const currentStatus = application.status;

    if (
      allowedTransitions[currentStatus] &&
      !allowedTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        message: `Cannot transition status from ${currentStatus} to ${status}`,
      });
    }

    // Recruiter ownership check
    if (req.user.role === "recruiter") {
      const drive = await PlacementDrive.findById(application.drive);

      if (!drive) {
        return res.status(404).json({
          message: "Placement drive not found",
        });
      }

      const company = await Company.findById(drive.company);

      if (!company) {
        return res.status(404).json({
          message: "Company not found",
        });
      }

      if (company.recruiter?.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You can only update applications for your assigned company",
        });
      }
    }

    // Update status and append to history
    application.status = status;
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      comments: comments || `Status updated to ${status} by ${req.user.role}`,
    });

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
    const { joiningDate, baseSalary, variableSalary, offerLetterUrl } = req.body;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (application.status !== "selected") {
      return res.status(400).json({
        message: "Offer can only be created for a selected candidate",
      });
    }

    const drive = await PlacementDrive.findById(application.drive);

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    const company = await Company.findById(drive.company);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    if (
      req.user.role === "recruiter" &&
      company.recruiter?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You can only create offers for your assigned company",
      });
    }

    const existingOffer = await Offer.findOne({
      application: application._id,
    });

    if (existingOffer) {
      return res.status(400).json({
        message: "Offer already exists for this application",
      });
    }

    const studentProfile = await StudentProfile.findById(application.student).populate(
      "user",
      "name email rollNumber course branch college"
    );

    let finalOfferLetterUrl = offerLetterUrl ? offerLetterUrl.trim() : "";
    let localPdfPath = null;

    // Auto-generate branded PDF offer letter if custom URL is omitted or autoGeneratePdf is flagged
    if (!finalOfferLetterUrl || req.body.autoGeneratePdf) {
      try {
        const studentObj = {
          name: studentProfile?.user?.name || "Selected Candidate",
          rollNumber: studentProfile?.user?.rollNumber || studentProfile?.rollNumber || "N/A",
          course: studentProfile?.user?.course || studentProfile?.course || "B.Tech",
          branch: studentProfile?.user?.branch || studentProfile?.branch || "Computer Science and Engineering",
          college: studentProfile?.user?.college || "XYZ Group of Institutions",
          email: studentProfile?.user?.email || "",
        };

        const pdfResult = await generateOfferLetterPDF({
          student: studentObj,
          company: {
            name: company.name,
            location: company.location,
            website: company.website,
          },
          drive: {
            jobTitle: drive.jobTitle,
            package: drive.package,
            baseSalary: baseSalary != null ? Number(baseSalary) : drive.baseSalary,
            variableSalary: variableSalary != null ? Number(variableSalary) : drive.variableSalary,
            location: drive.location,
          },
          offer: {
            _id: application._id,
            joiningDate,
            offerDate: new Date(),
            package: drive.package,
            baseSalary: baseSalary != null ? Number(baseSalary) : drive.baseSalary,
            variableSalary: variableSalary != null ? Number(variableSalary) : drive.variableSalary,
          },
        });

        finalOfferLetterUrl = pdfResult.relativeUrl;
        localPdfPath = pdfResult.filePath;
      } catch (genErr) {
        console.warn("Auto Offer Letter PDF generation warning:", genErr.message);
      }
    }

    const offer = await Offer.create({
      application: application._id,
      student: application.student,
      company: company._id,
      drive: drive._id,
      jobTitle: drive.jobTitle,
      package: drive.package,
      baseSalary: baseSalary != null ? Number(baseSalary) : drive.baseSalary || null,
      variableSalary: variableSalary != null ? Number(variableSalary) : drive.variableSalary || null,
      offerLetterUrl: finalOfferLetterUrl,
      joiningDate,
    });

    // Notify student via official celebratory email asynchronously with PDF attached
    if (studentProfile?.user?.email) {
      sendOfferReleaseEmail(studentProfile.user.email, studentProfile.user.name, {
        jobTitle: offer.jobTitle,
        companyName: company.name,
        packageAmount: offer.package,
        baseSalary: offer.baseSalary,
        joiningDate: offer.joiningDate,
        offerLetterUrl: offer.offerLetterUrl,
        localPdfPath: localPdfPath,
      }).catch((mailErr) => {
        console.error("Offer release notification email error:", mailErr.message);
      });
    }

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

const bulkUpdateApplicationStatus = async (req, res) => {
  try {
    const { applicationIds, status, comments } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        message: "applicationIds must be a non-empty array",
      });
    }

    const allowedStatuses = [
      "applied",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    const applications = await Application.find({ _id: { $in: applicationIds } }).populate("drive");

    if (applications.length === 0) {
      return res.status(404).json({
        message: "No matching applications found",
      });
    }

    // If recruiter, verify company ownership
    if (req.user.role === "recruiter") {
      const recruiterCompany = await Company.findOne({ recruiter: req.user.id });
      if (!recruiterCompany) {
        return res.status(404).json({
          message: "No company assigned to your recruiter account",
        });
      }

      for (const app of applications) {
        if (!app.drive || app.drive.company.toString() !== recruiterCompany._id.toString()) {
          return res.status(403).json({
            message: "One or more applications do not belong to your company",
          });
        }
      }
    }

    const commentText = comments || `Bulk status update to ${status} by recruiter`;
    const now = new Date();

    const updateOps = applications.map((app) => {
      return Application.updateOne(
        { _id: app._id },
        {
          $set: { status },
          $push: { statusHistory: { status, changedAt: now, comments: commentText } },
        }
      );
    });

    await Promise.all(updateOps);

    return res.status(200).json({
      message: `Successfully updated ${applications.length} applications to ${status}`,
      updatedCount: applications.length,
      status,
    });
  } catch (error) {
    res.status(500).json({
      message: "Bulk application update failed",
      error: error.message,
    });
  }
};

module.exports = {
  applyForDrive,
  getMyApplications,
  getRecruiterApplications,
  getDriveApplications,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  createOffer,
};