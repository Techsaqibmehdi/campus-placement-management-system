const Competition = require("../models/Competition");
const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");

// TPO / Admin: Create Competition or Hackathon
const createCompetition = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      organizer,
      mode,
      venue,
      contestUrl,
      startDate,
      endDate,
      registrationDeadline,
      teamSize,
      maxTeamSize,
      prizes,
      isOpenToAll,
      noEligibilityCriteria,
      eligibleCourses,
      eligibleBranches,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Competition title is required",
      });
    }

    if (!registrationDeadline) {
      return res.status(400).json({
        message: "Registration deadline is required",
      });
    }

    const regDeadline = registrationDeadline && !isNaN(new Date(registrationDeadline).getTime())
      ? new Date(registrationDeadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sDate = startDate && !isNaN(new Date(startDate).getTime())
      ? new Date(startDate)
      : new Date(regDeadline.getTime() + 2 * 60 * 60 * 1000);

    const eDate = endDate && !isNaN(new Date(endDate).getTime())
      ? new Date(endDate)
      : new Date(sDate.getTime() + 24 * 60 * 60 * 1000);

    const teamNum = maxTeamSize ? parseInt(maxTeamSize, 10) : 1;
    const finalTeamSize =
      teamSize || (teamNum > 1 ? `Team (Up to ${teamNum} Members)` : "Individual");

    const isEntirelyOpen = isOpenToAll !== undefined
      ? Boolean(isOpenToAll)
      : (noEligibilityCriteria !== undefined ? Boolean(noEligibilityCriteria) : true);

    const competition = await Competition.create({
      title: title.trim(),
      description: description || "",
      type: type || "Coding Contest",
      organizer: organizer || "XYZ CRPC & Department Club",
      mode: mode || "Online",
      venue: venue || "Virtual Platform",
      contestUrl: contestUrl || req.body.externalLink || "",
      startDate: sDate,
      endDate: eDate,
      registrationDeadline: regDeadline,
      teamSize: finalTeamSize,
      maxTeamSize: teamNum || 1,
      prizes: prizes || "Certificates of Excellence & Awards",
      isOpenToAll: isEntirelyOpen,
      eligibleCourses: isEntirelyOpen ? [] : (eligibleCourses || []),
      eligibleBranches: isEntirelyOpen ? [] : (eligibleBranches || []),
      status: status || "upcoming",
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Competition created and published by TPO successfully",
      competition,
    });
  } catch (error) {
    console.error("createCompetition error:", error);
    res.status(500).json({
      message: error.message || "Failed to create competition",
      error: error.message,
    });
  }
};

// All authenticated: Get Competitions List
const getCompetitions = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const query = {};

    if (type && type !== "all") {
      query.type = type;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { organizer: { $regex: search, $options: "i" } },
      ];
    }

    const competitions = await Competition.find(query)
      .populate("createdBy", "name email")
      .sort({ startDate: 1 });

    const userId = req.user?.id;
    const enriched = competitions.map((comp) => {
      const obj = comp.toObject();
      obj.participantCount = comp.participants ? comp.participants.length : 0;
      obj.hasRegistered = comp.participants?.some(
        (p) => p.user?.toString() === userId
      );
      return obj;
    });

    res.status(200).json({
      count: enriched.length,
      competitions: enriched,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch competitions",
      error: error.message,
    });
  }
};

// All authenticated: Get Competition Details
const getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    const obj = competition.toObject();
    obj.participantCount = competition.participants ? competition.participants.length : 0;
    obj.hasRegistered = competition.participants?.some(
      (p) => p.user?.toString() === req.user?.id
    );

    res.status(200).json({
      competition: obj,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch competition details",
      error: error.message,
    });
  }
};

// Student: One-Click Registration for Competition / Hackathon
const registerForCompetition = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    if (competition.status === "cancelled") {
      return res.status(400).json({
        message: "This competition has been cancelled",
      });
    }

    if (new Date(competition.registrationDeadline) < new Date()) {
      return res.status(400).json({
        message: "Registration deadline for this competition has passed",
      });
    }

    // Check duplicate registration
    const alreadyRegistered = competition.participants.some(
      (p) => p.user.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        message: "You have already registered for this competition",
      });
    }

    // Get or auto-init StudentProfile with synchronized rollNumber, course, branch
    const user = await User.findById(req.user.id);
    let student = await StudentProfile.findOne({ user: req.user.id });

    if (!student) {
      student = await StudentProfile.create({
        user: req.user.id,
        rollNumber: user?.rollNumber || `ROLL-${Date.now().toString().slice(-6)}`,
        course: user?.course || "MCA",
        branch: user?.branch || "CSE",
        college: user?.college || "XYZ Group of Institutions",
      });
    } else {
      let needsSave = false;
      if (!student.rollNumber && user?.rollNumber) {
        student.rollNumber = user.rollNumber;
        needsSave = true;
      }
      if (!student.course && user?.course) {
        student.course = user.course;
        needsSave = true;
      }
      if (!student.branch && user?.branch) {
        student.branch = user.branch;
        needsSave = true;
      }
      if (needsSave) await student.save();
    }

    // Course eligibility check if restricted and not open to all
    if (
      !competition.isOpenToAll &&
      competition.eligibleCourses &&
      competition.eligibleCourses.length > 0 &&
      (student.course || user?.course)
    ) {
      const candidateCourse = (student.course || user?.course || "").toLowerCase();
      const isEligible = competition.eligibleCourses.some(
        (c) => c.toLowerCase() === candidateCourse
      );
      if (!isEligible) {
        return res.status(400).json({
          message: `This competition is restricted to courses: ${competition.eligibleCourses.join(", ")}`,
        });
      }
    }

    competition.participants.push({
      student: student._id,
      user: req.user.id,
      registeredAt: new Date(),
    });

    await competition.save();

    res.status(201).json({
      message: "Successfully registered for competition!",
      competitionId: competition._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Student: My Registered Competitions
const getMyRegistrations = async (req, res) => {
  try {
    const competitions = await Competition.find({
      "participants.user": req.user.id,
    }).sort({ startDate: 1 });

    res.status(200).json({
      count: competitions.length,
      competitions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your registered competitions",
      error: error.message,
    });
  }
};

// TPO / Admin: View Participants for a Competition
const getCompetitionParticipants = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate({
        path: "participants.student",
        populate: {
          path: "user",
          select: "name email rollNumber course branch college",
        },
      })
      .populate("participants.user", "name email rollNumber course branch college");

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    const formattedParticipants = (competition.participants || []).map((p) => {
      const u =
        p.user && p.user.name
          ? p.user
          : p.student && p.student.user
          ? p.student.user
          : {};
      const s = p.student || {};

      const name = u.name || "XYZ Student";
      const email = u.email || "N/A";
      const rollNumber = s.rollNumber || u.rollNumber || "N/A";
      const course = s.course || u.course || "MCA";
      const branch = s.branch || u.branch || "General";
      const college = u.college || "XYZ Group of Institutions";
      const cgpa = s.cgpa ? Number(s.cgpa).toFixed(2) : "N/A";
      const registeredAt = p.registeredAt || p.createdAt || new Date();

      return {
        _id: p._id,
        name,
        email,
        rollNumber,
        course,
        branch,
        college,
        cgpa,
        registeredAt,
        user: {
          _id: u._id,
          name,
          email,
          rollNumber,
          course,
          branch,
          college,
        },
        student: {
          _id: s._id,
          rollNumber,
          course,
          branch,
          cgpa,
        },
      };
    });

    res.status(200).json({
      competitionTitle: competition.title,
      count: formattedParticipants.length,
      participants: formattedParticipants,
    });
  } catch (error) {
    console.error("getCompetitionParticipants error:", error);
    res.status(500).json({
      message: "Failed to fetch participants",
      error: error.message,
    });
  }
};

// TPO / Admin: Update Competition
const updateCompetition = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    const fields = [
      "title",
      "description",
      "type",
      "organizer",
      "mode",
      "venue",
      "contestUrl",
      "startDate",
      "endDate",
      "registrationDeadline",
      "teamSize",
      "prizes",
      "eligibleCourses",
      "eligibleBranches",
      "status",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        competition[f] = req.body[f];
      }
    });

    await competition.save();

    res.status(200).json({
      message: "Competition updated successfully",
      competition,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update competition",
      error: error.message,
    });
  }
};

// TPO / Admin: Delete Competition
const deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);

    if (!competition) {
      return res.status(404).json({
        message: "Competition not found",
      });
    }

    res.status(200).json({
      message: "Competition deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete competition",
      error: error.message,
    });
  }
};

module.exports = {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  registerForCompetition,
  getMyRegistrations,
  getCompetitionParticipants,
  updateCompetition,
  deleteCompetition,
};

