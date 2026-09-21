const PlacementDrive = require("../models/PlacementDrive");
const Company = require("../models/Company");
const StudentProfile = require("../models/StudentProfile");
const Application = require("../models/Application");
const Offer = require("../models/Offer");
const { checkEligibility } = require("../services/eligibilityService");
const { getDriveCategory, checkOneOfferPolicy } = require("../services/placementPolicyService");

const createPlacementDrive = async (req, res) => {
  try {
    let companyId = req.body.company;

    // If recruiter, automatically bind to recruiter's company if not provided
    if (req.user.role === "recruiter") {
      if (req.user.status === "pending") {
        return res.status(403).json({
          message: "Your recruiter account is pending TPO approval. You cannot publish placement drives yet.",
        });
      }

      const recruiterCompany = await Company.findOne({
        recruiter: req.user.id,
      });

      if (!recruiterCompany) {
        return res.status(404).json({
          message: "No company is assigned to your recruiter account",
        });
      }

      if (companyId && companyId.toString() !== recruiterCompany._id.toString()) {
        return res.status(403).json({
          message: "You can only create drives for your assigned company",
        });
      }

      companyId = recruiterCompany._id;
    }

    let companyData = companyId ? await Company.findById(companyId) : null;

    // Admin direct drive creation: dynamic company resolution or creation
    if (!companyData && req.user.role === "admin" && req.body.companyName) {
      const trimmedName = req.body.companyName.trim();
      companyData = await Company.findOne({
        name: new RegExp(`^${trimmedName}$`, "i"),
      });

      if (!companyData) {
        try {
          companyData = await Company.create({
            name: trimmedName,
            website:
              req.body.companyWebsite ||
              `https://${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
            location: req.body.companyLocation || req.body.location || "Delhi-NCR",
            industry: req.body.industry || "Information Technology",
            description:
              req.body.companyDescription ||
              `${trimmedName} official campus recruitment drive.`,
          });
        } catch (compErr) {
          companyData = await Company.findOne({
            name: new RegExp(`^${trimmedName}$`, "i"),
          });
          if (!companyData) throw compErr;
        }
      }
      companyId = companyData._id;
    }

    if (!companyData) {
      return res.status(404).json({
        message: "Company not found. Please select a valid company or provide a company name.",
      });
    }

    const {
      jobTitle,
      opportunityType,
      isOpenToAll,
      noEligibilityCriteria,
      duration,
      stipend,
      theme,
      teamSize,
      prizePool,
      eventType,
      description,
      employmentType,
      workMode,
      package: packageAmount,
      baseSalary,
      variableSalary,
      location,
      minimumCgpa,
      allowedCourses,
      eligibleBranches,
      passingYears,
      requiredSkills,
      minimumTenthPercentage,
      minimumTwelfthPercentage,
      maximumBacklogs,
      selectionRounds,
      maxApplications,
      applicationDeadline,
      status,
    } = req.body;

    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({
        message: "Job Title is required",
      });
    }

    if (!applicationDeadline) {
      return res.status(400).json({
        message: "Application deadline is required",
      });
    }

    const parsedDeadline = new Date(applicationDeadline);
    if (isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({
        message: "Invalid application deadline format",
      });
    }

    if (parsedDeadline <= new Date()) {
      return res.status(400).json({
        message: "Application deadline must be a future date and time",
      });
    }

    const isEntirelyOpen = Boolean(isOpenToAll || noEligibilityCriteria);
    const resolvedPackage =
      packageAmount != null && !isNaN(Number(packageAmount))
        ? Number(packageAmount)
        : 0;
    const resolvedLocation =
      (location && location.trim()) ||
      companyData.location ||
      "Delhi-NCR / XYZ Campus";

    const resolvedCategory =
      req.body.category && ["Regular", "Dream", "Super Dream"].includes(req.body.category)
        ? req.body.category
        : resolvedPackage >= 10
        ? "Super Dream"
        : resolvedPackage >= 6
        ? "Dream"
        : "Regular";

    const drive = await PlacementDrive.create({
      company: companyId,
      createdBy: req.user.id,
      jobTitle: jobTitle.trim(),
      opportunityType: opportunityType || "placement_drive",
      isOpenToAll: isEntirelyOpen,
      duration: duration || null,
      stipend: stipend || null,
      theme: theme || null,
      teamSize: teamSize || null,
      prizePool: prizePool || null,
      eventType: eventType || null,
      description: description || `${jobTitle.trim()} recruitment drive hosted by XYZ CRPC.`,
      employmentType: employmentType || "Full Time",
      workMode: workMode || "On-site",
      package: resolvedPackage,
      category: resolvedCategory,
      baseSalary: baseSalary != null && !isNaN(Number(baseSalary)) ? Number(baseSalary) : null,
      variableSalary: variableSalary != null && !isNaN(Number(variableSalary)) ? Number(variableSalary) : null,
      location: resolvedLocation,
      minimumCgpa: isEntirelyOpen ? 0 : (minimumCgpa != null ? Number(minimumCgpa) : 0),
      allowedCourses: isEntirelyOpen ? [] : (allowedCourses || []),
      eligibleBranches: isEntirelyOpen ? [] : (eligibleBranches || []),
      passingYears: passingYears || [],
      requiredSkills: isEntirelyOpen ? [] : (requiredSkills || []),
      minimumTenthPercentage: isEntirelyOpen
        ? null
        : (minimumTenthPercentage != null ? Number(minimumTenthPercentage) : null),
      minimumTwelfthPercentage: isEntirelyOpen
        ? null
        : (minimumTwelfthPercentage != null ? Number(minimumTwelfthPercentage) : null),
      maximumBacklogs: isEntirelyOpen ? 99 : (maximumBacklogs != null ? Number(maximumBacklogs) : 0),
      selectionRounds: selectionRounds && selectionRounds.length > 0
        ? selectionRounds
        : ["Resume Screening", "Technical Interview", "HR Interview"],
      maxApplications: maxApplications || null,
      applicationDeadline: parsedDeadline,
      status:
        req.user.role === "recruiter" ? "pending_approval" : (status || "open"),
    });

    res.status(201).json({
      message:
        req.user.role === "recruiter"
          ? "Placement drive submitted for TPO approval"
          : "Placement drive created and published successfully",
      drive,
    });

  } catch (error) {
    console.error("Placement drive creation failed:", error);
    res.status(500).json({
      message: error.message || "Placement drive creation failed",
      error: error.message,
    });
  }
};

const getPlacementDrives = async (req, res) => {
  try {
    const { eligibleOnly, search, course, branch } = req.query;

    const query = {
      status: "open",
      applicationDeadline: { $gte: new Date() },
    };

    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (course) {
      query.$or = [
        { allowedCourses: { $size: 0 } },
        { allowedCourses: course },
      ];
    }

    if (branch) {
      query.$or = [
        { eligibleBranches: { $size: 0 } },
        { eligibleBranches: branch },
      ];
    }

    const drives = await PlacementDrive.find(query)
      .populate("company", "name logoUrl industry location website")
      .sort({ applicationDeadline: 1 });

    // If student, compute eligibility, category, and one-offer policy status for each drive
    let student = null;
    let appliedDriveIds = new Set();
    let studentActiveOffer = null;

    if (req.user && req.user.role === "student") {
      student = await StudentProfile.findOne({ user: req.user.id });

      if (student) {
        const [studentApplications, activeOffer] = await Promise.all([
          Application.find({
            student: student._id,
          }).select("drive status"),
          Offer.findOne({
            student: student._id,
            status: { $in: ["active", "accepted"] },
          }).sort({ package: -1 }),
        ]);

        appliedDriveIds = new Set(
          studentApplications.map((app) => app.drive.toString())
        );
        studentActiveOffer = activeOffer;
      }
    }

    let enrichedDrives = drives.map((drive) => {
      const driveObj = drive.toObject();
      driveObj.category = driveObj.category || getDriveCategory(driveObj);

      if (student) {
        const eligibility = checkEligibility(student, driveObj);
        driveObj.eligibility = eligibility;
        driveObj.hasApplied = appliedDriveIds.has(drive._id.toString());

        if (studentActiveOffer) {
          const isDreamOrSuper =
            driveObj.category === "Dream" || driveObj.category === "Super Dream";
          driveObj.oneOfferPolicy = {
            hasOffer: true,
            isBlocked: !isDreamOrSuper,
            category: driveObj.category,
            existingOfferPackage: studentActiveOffer.package,
            message: isDreamOrSuper
              ? `Eligible: One offer policy is waived for ${driveObj.category} drives.`
              : "Blocked: You already hold a placement offer. Students with an existing offer cannot apply for Regular drives (< 6 LPA).",
          };
        } else {
          driveObj.oneOfferPolicy = {
            hasOffer: false,
            isBlocked: false,
            category: driveObj.category,
            message: "Eligible to apply",
          };
        }
      }

      return driveObj;
    });

    if (eligibleOnly === "true" && student) {
      enrichedDrives = enrichedDrives.filter(
        (drive) => drive.eligibility && drive.eligibility.eligible
      );
    }

    res.status(200).json({
      count: enrichedDrives.length,
      drives: enrichedDrives,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch placement drives",
      error: error.message,
    });
  }
};

const getDriveById = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id).populate(
      "company",
      "name logoUrl industry location website description"
    );

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    const driveObj = drive.toObject();
    driveObj.category = driveObj.category || getDriveCategory(driveObj);

    if (req.user && req.user.role === "student") {
      const student = await StudentProfile.findOne({ user: req.user.id });
      if (student) {
        driveObj.eligibility = checkEligibility(student, driveObj);

        const [application, activeOffer] = await Promise.all([
          Application.findOne({
            student: student._id,
            drive: drive._id,
          }),
          Offer.findOne({
            student: student._id,
            status: { $in: ["active", "accepted"] },
          }).sort({ package: -1 }),
        ]);

        driveObj.hasApplied = Boolean(application);
        driveObj.application = application || null;

        if (activeOffer) {
          const isDreamOrSuper =
            driveObj.category === "Dream" || driveObj.category === "Super Dream";
          driveObj.oneOfferPolicy = {
            hasOffer: true,
            isBlocked: !isDreamOrSuper,
            category: driveObj.category,
            existingOfferPackage: activeOffer.package,
            message: isDreamOrSuper
              ? `Eligible: One offer policy is waived for ${driveObj.category} drives.`
              : "Blocked: You already hold a placement offer. Students with an existing offer cannot apply for Regular drives (< 6 LPA).",
          };
        } else {
          driveObj.oneOfferPolicy = {
            hasOffer: false,
            isBlocked: false,
            category: driveObj.category,
            message: "Eligible to apply",
          };
        }
      }
    }

    res.status(200).json({
      drive: driveObj,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch placement drive details",
      error: error.message,
    });
  }
};

const getMyDrives = async (req, res) => {
  try {
    let companyId = null;

    if (req.user.role === "recruiter") {
      const company = await Company.findOne({ recruiter: req.user.id });
      if (!company) {
        return res.status(404).json({
          message: "No company assigned to this recruiter",
        });
      }
      companyId = company._id;
    } else if (req.query.companyId) {
      companyId = req.query.companyId;
    }

    const query = companyId ? { company: companyId } : {};
    const drives = await PlacementDrive.find(query)
      .populate("company", "name logoUrl industry location")
      .sort({ createdAt: -1 });

    // Fetch application count per drive
    const driveIds = drives.map((d) => d._id);
    const appCounts = await Application.aggregate([
      { $match: { drive: { $in: driveIds } } },
      { $group: { _id: "$drive", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    appCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const drivesWithStats = drives.map((drive) => {
      const obj = drive.toObject();
      obj.applicationCount = countMap[drive._id.toString()] || 0;
      return obj;
    });

    res.status(200).json({
      count: drivesWithStats.length,
      drives: drivesWithStats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch company drives",
      error: error.message,
    });
  }
};

const updatePlacementDrive = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    // Ownership check for recruiters
    if (req.user.role === "recruiter") {
      const company = await Company.findById(drive.company);
      if (!company || company.recruiter?.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You are not authorized to update this placement drive",
        });
      }
    }

    const allowedUpdates = [
      "jobTitle",
      "opportunityType",
      "duration",
      "stipend",
      "theme",
      "teamSize",
      "prizePool",
      "eventType",
      "description",
      "employmentType",
      "workMode",
      "package",
      "baseSalary",
      "variableSalary",
      "location",
      "minimumCgpa",
      "allowedCourses",
      "eligibleBranches",
      "passingYears",
      "requiredSkills",
      "minimumTenthPercentage",
      "minimumTwelfthPercentage",
      "maximumBacklogs",
      "selectionRounds",
      "maxApplications",
      "applicationDeadline",
      "status",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        drive[field] = req.body[field];
      }
    });

    await drive.save();

    res.status(200).json({
      message: "Placement drive updated successfully",
      drive,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update placement drive",
      error: error.message,
    });
  }
};

const updateDriveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["draft", "pending_approval", "open", "closed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed statuses: ${allowed.join(", ")}`,
      });
    }

    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    if (req.user.role === "recruiter") {
      const company = await Company.findById(drive.company);
      if (!company || company.recruiter?.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You are not authorized to update this placement drive",
        });
      }
    }

    drive.status = status;
    await drive.save();

    res.status(200).json({
      message: `Drive status updated to ${status}`,
      drive,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update drive status",
      error: error.message,
    });
  }
};

const getDriveEligibility = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        message: "Placement drive not found",
      });
    }

    const eligibility = checkEligibility(student, drive);

    res.status(200).json({
      driveId: drive._id,
      jobTitle: drive.jobTitle,
      eligibility,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to evaluate eligibility",
      error: error.message,
    });
  }
};

const getPendingApprovalDrives = async (req, res) => {
  try {
    const drives = await PlacementDrive.find({ status: "pending_approval" })
      .populate("company", "name logoUrl industry location")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: drives.length,
      drives,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pending drives",
      error: error.message,
    });
  }
};

const approvePlacementDrive = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: "Placement drive not found" });
    }

    drive.status = "open";
    await drive.save();

    res.status(200).json({
      message: "Placement drive approved and published to students successfully",
      drive,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve placement drive",
      error: error.message,
    });
  }
};

const rejectPlacementDrive = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: "Placement drive not found" });
    }

    drive.status = "cancelled";
    await drive.save();

    res.status(200).json({
      message: "Placement drive rejected",
      drive,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject placement drive",
      error: error.message,
    });
  }
};

module.exports = {
  createPlacementDrive,
  getPlacementDrives,
  getDriveById,
  getMyDrives,
  updatePlacementDrive,
  updateDriveStatus,
  getDriveEligibility,
  getPendingApprovalDrives,
  approvePlacementDrive,
  rejectPlacementDrive,
};