const Interview = require("../models/Interview");
const Application = require("../models/Application");
const PlacementDrive = require("../models/PlacementDrive");
const Company = require("../models/Company");
const StudentProfile = require("../models/StudentProfile");

const scheduleInterview = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const {
      scheduledAt,
      mode,
      meetingLink,
      location,
    } = req.body;


    // Validate interview date
const interviewDate = new Date(scheduledAt);

if (!scheduledAt || Number.isNaN(interviewDate.getTime())) {
  return res.status(400).json({
    message: "Invalid intervidsew date",
    received: scheduledAt,
  });
}

if (interviewDate <= new Date()) {
  return res.status(400).json({
    message: "Interview must be scheduled for a future date",
  });
}

// Validate interview mode
if (!["online", "offline"].includes(mode)) {
  return res.status(400).json({
    message: "Interview mode must be online or offline",
  });
}

// Online interview requires meeting link
if (mode === "online" && !meetingLink) {
  return res.status(400).json({
    message: "Meeting link is required for online interview",
  });
}

// Offline interview requires location
if (mode === "offline" && !location) {
  return res.status(400).json({
    message: "Location is required for offline interview",
  });
}


    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Interview can only be scheduled for shortlisted candidate
    if (application.status !== "shortlisted") {
      return res.status(400).json({
        message: "Interview can only be scheduled for shortlisted candidates",
      });
    }

    // Find drive
    const drive = await PlacementDrive.findById(application.drive);

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

    // Recruiter can only schedule interviews for assigned company
    if (
      req.user.role === "recruiter" &&
      company.recruiter?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message:
          "You can only schedule interviews for your assigned company",
      });
    }

    // Check if interview already exists
    const existingInterview = await Interview.findOne({
      application: application._id,
      status: "scheduled",
    });

    if (existingInterview) {
      return res.status(400).json({
        message: "An interview is already scheduled for this application",
      });
    }

    // Create interview
    const interview = await Interview.create({
      application: application._id,
      student: application.student,
      drive: drive._id,
      company: company._id,
      scheduledAt,
      mode,
      meetingLink: mode === "online" ? meetingLink : null,
      location: mode === "offline" ? location : null,
    });

    return res.status(201).json({
      message: "Interview scheduled successfully",
      interview,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to schedule interview",
      error: error.message,
    });
  }
};


const getMyInterviews = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const interviews = await Interview.find({
      student: student._id,
    })
      .populate("company", "name logoUrl industry location")
      .populate("drive", "jobTitle package location")
      .populate("application", "status")
      .sort({ scheduledAt: 1 });

    return res.status(200).json({
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch interviews",
      error: error.message,
    });
  }
};


const updateInterviewStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;

    const allowedStatuses = ["completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid interview status",
      });
    }

    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    // Interview can only be updated while scheduled
    if (interview.status !== "scheduled") {
      return res.status(400).json({
        message: `Interview is already ${interview.status}`,
      });
    }

    const company = await Company.findById(interview.company);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Recruiter can update only their company's interviews
    if (
      req.user.role === "recruiter" &&
      company.recruiter?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message:
          "You can only update interviews for your assigned company",
      });
    }

    interview.status = status;

    if (feedback !== undefined) {
      interview.feedback = feedback;
    }

    await interview.save();

    return res.status(200).json({
      message: "Interview status updated successfully",
      interview,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update interview status",
      error: error.message,
    });
  }
};
const getRecruiterInterviews = async (req, res) => {
  try {
    const company = await Company.findOne({
      recruiter: req.user.id,
    });

    if (!company) {
      return res.status(404).json({
        message: "No company assigned to this recruiter",
      });
    }

    const interviews = await Interview.find({
      company: company._id,
    })
      .populate("student", "rollNumber course branch cgpa skills resumeUrl")
      .populate("drive", "jobTitle package location")
      .populate("application", "status")
      .sort({ scheduledAt: 1 });

    return res.status(200).json({
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recruiter interviews",
      error: error.message,
    });
  }
};


module.exports = {
  scheduleInterview,
  getMyInterviews,
  updateInterviewStatus,
  getRecruiterInterviews,
};