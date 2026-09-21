const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const Offer = require("../models/Offer");
const ScoreUpdateRequest = require("../models/ScoreUpdateRequest");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");

const createStudentProfile = async (req, res) => {
  try {
    const {
      rollNumber,
      course,
      branch,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      backlogs,
      skills,
      internships,
      projects,
      por,
      achievements,
      socialProfiles,
    } = req.body;

    const existingProfile = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (existingProfile) {
      return res.status(400).json({
        message: "Student profile already exists",
      });
    }

    const profile = await StudentProfile.create({
      user: req.user.id,
      rollNumber,
      course,
      branch,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      backlogs,
      skills,
      internships,
      projects,
      por,
      achievements,
      socialProfiles,
    });

    res.status(201).json({
      message: "Student profile created successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      message: "Profile creation failed",
      error: error.message,
    });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({
      user: req.user.id,
    }).populate("user", "name email college rollNumber course branch");

    if (!profile) {
      // Auto-initialize profile from registered user details
      const user = await User.findById(req.user.id);
      if (user && user.role === "student") {
        profile = await StudentProfile.create({
          user: user._id,
          rollNumber: user.rollNumber || `ROLL-${Date.now().toString().slice(-6)}`,
          course: user.course || "MCA",
          branch: user.branch || null,
        });

        profile = await StudentProfile.findById(profile._id).populate(
          "user",
          "name email college rollNumber course branch"
        );
      } else {
        return res.status(404).json({
          message: "Student profile not found",
        });
      }
    }

    const latestScoreRequest = await ScoreUpdateRequest.findOne({
      student: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      profile,
      latestScoreRequest: latestScoreRequest || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch student profile",
      error: error.message,
    });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      const user = await User.findById(req.user.id);
      profile = await StudentProfile.create({
        user: req.user.id,
        rollNumber: user?.rollNumber || `ROLL-${Date.now().toString().slice(-6)}`,
        course: user?.course || "MCA",
        branch: user?.branch || null,
      });
    }

    const {
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      backlogs,
      skills,
      internships,
      projects,
      por,
      achievements,
      socialProfiles,
    } = req.body;

    // Check if student scores are already locked
    const isScoresLocked = Boolean(
      profile.academicScoresLocked ||
      (profile.cgpa !== null && profile.cgpa !== undefined &&
       profile.tenthPercentage !== null && profile.tenthPercentage !== undefined)
    );

    const hasScoreField = (
      cgpa !== undefined ||
      tenthPercentage !== undefined ||
      twelfthPercentage !== undefined ||
      backlogs !== undefined
    );

    if (hasScoreField) {
      if (isScoresLocked) {
        return res.status(403).json({
          message: "Direct modification of academic scores is locked after initial registration. Please submit an Academic Score Update Request for TPO verification.",
          code: "ACADEMIC_SCORES_LOCKED",
        });
      }

      // First time setting scores (Direct entry allowed)
      if (cgpa !== undefined) {
        profile.cgpa = cgpa;
      }

      if (tenthPercentage !== undefined) {
        profile.tenthPercentage = tenthPercentage;
      }

      if (twelfthPercentage !== undefined) {
        profile.twelfthPercentage = twelfthPercentage;
      }

      if (backlogs !== undefined) {
        profile.backlogs = backlogs;
      }

      // Once non-null academic scores are submitted for the first time, lock them
      if (profile.cgpa !== null || profile.tenthPercentage !== null) {
        profile.academicScoresLocked = true;
      }
    }

    // Skills
    if (skills !== undefined) {
      profile.skills = skills;
    }

    // Internships
    if (internships !== undefined) {
      profile.internships = internships;
    }

    // Projects
    if (projects !== undefined) {
      profile.projects = projects;
    }

    // Positions of Responsibility
    if (por !== undefined) {
      profile.por = por;
    }

    // Achievements
    if (achievements !== undefined) {
      profile.achievements = achievements;
    }

    // Social profiles
    if (socialProfiles !== undefined) {
      profile.socialProfiles = socialProfiles;
    }

    await profile.save();

const updatedProfile = await StudentProfile.findOne({
  user: req.user.id,
}).populate(
  "user",
  "name email college rollNumber course branch"
);

res.status(200).json({
  message: "Student profile updated successfully",
  profile: updatedProfile,
});
  } catch (error) {
    res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required",
      });
    }

    let student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      const user = await User.findById(req.user.id);
      student = await StudentProfile.create({
        user: req.user.id,
        rollNumber: user?.rollNumber || `ROLL-${Date.now().toString().slice(-6)}`,
        course: user?.course || "MCA",
        branch: user?.branch || null,
      });
    }

    // Maximum 3 resumes
    if (student.resumes && student.resumes.length >= 3) {
      return res.status(400).json({
        message: "Maximum 3 resumes can be uploaded. Please delete an older resume first.",
      });
    }

    const originalName = req.file.originalname || "resume.pdf";
    const sanitizedBase = path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    const publicId = `resume_${uniqueSuffix}_${sanitizedBase}.pdf`;

    let resumeUrl = "";
    let storagePublicId = publicId;

    // 1. Try uploading to Cloudinary
    try {
      const cloudResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-placement/resumes",
            resource_type: "raw",
            public_id: publicId,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });

      if (cloudResult && (cloudResult.secure_url || cloudResult.url)) {
        resumeUrl = cloudResult.secure_url || cloudResult.url;
        storagePublicId = cloudResult.public_id;
      }
    } catch (cloudErr) {
      console.warn("Cloudinary upload failed, switching to local disk storage fallback:", cloudErr.message);
    }

    // 2. Fallback to local disk storage if Cloudinary failed or produced no URL
    if (!resumeUrl) {
      const uploadsDir = path.join(__dirname, "../../uploads/resumes");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const localFileName = `${Date.now()}_${sanitizedBase}.pdf`;
      const localFilePath = path.join(uploadsDir, localFileName);
      fs.writeFileSync(localFilePath, req.file.buffer);

      const host = req.get("host") || "localhost:5000";
      const protocol = req.protocol || "http";
      resumeUrl = `${protocol}://${host}/uploads/resumes/${localFileName}`;
      storagePublicId = `local_${localFileName}`;
    }

    const isFirstResume = !student.resumes || student.resumes.length === 0;

    const newResume = {
      name: originalName,
      url: resumeUrl,
      publicId: storagePublicId,
      isPrimary: isFirstResume,
      uploadedAt: new Date(),
    };

    const updatedProfile = await StudentProfile.findByIdAndUpdate(
      student._id,
      { $push: { resumes: newResume } },
      { new: true, runValidators: false }
    );

    const uploadedResume = updatedProfile.resumes[updatedProfile.resumes.length - 1];

    return res.status(200).json({
      message: "Resume uploaded successfully",
      resume: uploadedResume,
    });
  } catch (error) {
    console.error("Upload resume controller error:", error);
    return res.status(500).json({
      message: "Resume upload failed",
      error: error.message,
    });
  }
};


const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const resume = student.resumes?.id ? student.resumes.id(resumeId) : student.resumes?.find(r => r._id.toString() === resumeId);

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    // Delete file from storage
    if (resume.publicId && resume.publicId.startsWith("local_")) {
      const fileName = resume.publicId.replace("local_", "");
      const filePath = path.join(__dirname, "../../uploads/resumes", fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Could not delete local file:", e.message);
        }
      }
    } else if (resume.publicId) {
      try {
        await cloudinary.uploader.destroy(resume.publicId, {
          resource_type: "raw",
        });
      } catch (e) {
        console.warn("Cloudinary destroy error:", e.message);
      }
    }

    const wasPrimary = resume.isPrimary;

    // Remove resume using findByIdAndUpdate
    const updated = await StudentProfile.findByIdAndUpdate(
      student._id,
      { $pull: { resumes: { _id: resumeId } } },
      { new: true, runValidators: false }
    );

    // If primary resume was deleted and there are remaining resumes, promote the first one
    if (wasPrimary && updated && updated.resumes && updated.resumes.length > 0) {
      await StudentProfile.updateOne(
        { _id: student._id, "resumes._id": updated.resumes[0]._id },
        { $set: { "resumes.$.isPrimary": true } }
      );
      updated.resumes[0].isPrimary = true;
    }

    return res.status(200).json({
      message: "Resume deleted successfully",
      resumes: updated ? updated.resumes : [],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Resume deletion failed",
      error: error.message,
    });
  }
};


const setPrimaryResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const resumeExists = student.resumes?.some((r) => r._id.toString() === resumeId);

    if (!resumeExists) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    // Set all resumes isPrimary to false
    await StudentProfile.updateOne(
      { _id: student._id },
      { $set: { "resumes.$[].isPrimary": false } }
    );

    // Set target resume isPrimary to true
    const updated = await StudentProfile.findOneAndUpdate(
      { _id: student._id, "resumes._id": resumeId },
      { $set: { "resumes.$.isPrimary": true } },
      { new: true, runValidators: false }
    );

    return res.status(200).json({
      message: "Primary resume updated successfully",
      resumes: updated ? updated.resumes : [],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to set primary resume",
      error: error.message,
    });
  }
};

const getAllStudentsForAdmin = async (req, res) => {
  try {
    const {
      search,
      course,
      branch,
      placementStatus,
      status,
      minCgpa,
      maxBacklogs,
    } = req.query;

    const userQuery = { role: "student" };

    if (status && status !== "all") {
      userQuery.status = status;
    }

    if (course && course !== "all") {
      userQuery.course = course;
    }

    if (branch && branch !== "all") {
      userQuery.branch = branch;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      userQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex },
      ];
    }

    const studentUsers = await User.find(userQuery)
      .select("-password")
      .sort({ rollNumber: 1, name: 1 });

    const userIds = studentUsers.map((u) => u._id);

    // Fetch corresponding StudentProfiles
    const profiles = await StudentProfile.find({ user: { $in: userIds } });
    const profileMap = new Map();
    profiles.forEach((p) => {
      profileMap.set(p.user.toString(), p);
    });

    // Fetch accepted / active offers for these profiles
    const profileIds = profiles.map((p) => p._id);
    const activeOffers = await Offer.find({
      student: { $in: profileIds },
      status: { $in: ["active", "accepted"] },
    })
      .populate("company", "name logoUrl")
      .sort({ package: -1 });

    const offerMap = new Map();
    activeOffers.forEach((off) => {
      const studentIdStr = off.student.toString();
      if (!offerMap.has(studentIdStr)) {
        // Highest package offer
        offerMap.set(studentIdStr, off);
      }
    });

    // Merge student user + profile + offer information
    let studentList = studentUsers.map((user) => {
      const userObj = user.toObject ? user.toObject() : user;
      const profile = profileMap.get(user._id.toString());
      const offer = profile ? offerMap.get(profile._id.toString()) : null;

      const isPlaced = !!offer;

      return {
        _id: userObj._id,
        profileId: profile?._id || null,
        name: userObj.name,
        email: userObj.email,
        rollNumber: userObj.rollNumber || profile?.rollNumber || "",
        college: userObj.college || "XYZ Group of Institutions",
        course: userObj.course || profile?.course || "B.Tech",
        branch: userObj.branch || profile?.branch || "",
        status: userObj.status || "active",
        cgpa: profile?.cgpa ?? null,
        tenthPercentage: profile?.tenthPercentage ?? null,
        twelfthPercentage: profile?.twelfthPercentage ?? null,
        backlogs: profile?.backlogs ?? 0,
        skills: profile?.skills || [],
        resumes: profile?.resumes || [],
        internships: profile?.internships || [],
        projects: profile?.projects || [],
        por: profile?.por || [],
        achievements: profile?.achievements || [],
        socialProfiles: profile?.socialProfiles || {},
        placementStatus: isPlaced ? "placed" : "unplaced",
        placedOffer: offer
          ? {
              id: offer._id,
              jobTitle: offer.jobTitle,
              companyName: offer.company?.name || "Company Partner",
              companyLogo: offer.company?.logoUrl || "",
              package: offer.package,
              status: offer.status,
              offerLetterUrl: offer.offerLetterUrl || "",
            }
          : null,
      };
    });

    // In-memory post filtering for placement status, cgpa, and backlogs
    if (placementStatus && placementStatus !== "all") {
      studentList = studentList.filter(
        (s) => s.placementStatus === placementStatus.toLowerCase()
      );
    }

    if (minCgpa !== undefined && minCgpa !== "") {
      const minVal = parseFloat(minCgpa);
      if (!isNaN(minVal)) {
        studentList = studentList.filter((s) => s.cgpa !== null && s.cgpa >= minVal);
      }
    }

    if (maxBacklogs !== undefined && maxBacklogs !== "") {
      const maxVal = parseInt(maxBacklogs, 10);
      if (!isNaN(maxVal)) {
        studentList = studentList.filter((s) => s.backlogs <= maxVal);
      }
    }

    return res.status(200).json({
      count: studentList.length,
      students: studentList,
    });
  } catch (error) {
    console.error("Error fetching students for admin:", error);
    return res.status(500).json({
      message: "Failed to fetch student directory",
      error: error.message,
    });
  }
};

const toggleStudentStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Allowed values are 'active' or 'suspended'.",
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
      message: `Student account ${status === "active" ? "activated" : "suspended"} successfully`,
      student: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error toggling student status:", error);
    return res.status(500).json({
      message: "Failed to update student account status",
      error: error.message,
    });
  }
};

const updateStudentByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      rollNumber,
      course,
      branch,
      college,
      status,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      backlogs,
    } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      return res.status(404).json({
        message: "Student user not found",
      });
    }

    // Check email uniqueness if email is changed
    if (email && email.toLowerCase().trim() !== (user.email || "").toLowerCase()) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id },
      });
      if (emailExists) {
        return res.status(400).json({
          message: "Another account already exists with this email address",
        });
      }
      user.email = email.toLowerCase().trim();
    }

    // Check rollNumber uniqueness across both User and StudentProfile if changed
    if (rollNumber && rollNumber.trim() !== (user.rollNumber || "").trim()) {
      const cleanRoll = rollNumber.trim();
      const userRollExists = await User.findOne({
        rollNumber: cleanRoll,
        _id: { $ne: user._id },
      });
      if (userRollExists) {
        return res.status(400).json({
          message: "Another student already exists with this roll number",
        });
      }

      const profileRollExists = await StudentProfile.findOne({
        rollNumber: cleanRoll,
        user: { $ne: user._id },
      });
      if (profileRollExists) {
        return res.status(400).json({
          message: "Another student profile already uses this roll number",
        });
      }

      user.rollNumber = cleanRoll;
    }

    if (name && name.trim()) user.name = name.trim();

    // Normalize course
    if (course && course !== "N/A") {
      const cStr = course.trim();
      if (/^b\.?tech/i.test(cStr)) user.course = "B.Tech";
      else if (/^m\.?tech/i.test(cStr)) user.course = "M.Tech";
      else if (/^mca/i.test(cStr)) user.course = "MCA";
      else if (/^bca/i.test(cStr)) user.course = "BCA";
      else if (/^mba/i.test(cStr)) user.course = "MBA";
      else user.course = cStr;
    }

    // Sanitize branch
    if (branch !== undefined) {
      if (!branch || branch === "N/A" || branch.trim() === "") {
        user.branch = null;
      } else {
        user.branch = branch.trim();
      }
    }

    if (college && college.trim()) user.college = college.trim();
    if (status && ["active", "suspended"].includes(status)) user.status = status;

    await user.save();

    // Find or create StudentProfile to update
    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new StudentProfile({
        user: user._id,
        rollNumber: user.rollNumber || `ROLL-${Date.now().toString().slice(-6)}`,
        course: user.course || "B.Tech",
        branch: user.branch || null,
      });
    }

    // Keep profile in sync with User details
    if (user.rollNumber) profile.rollNumber = user.rollNumber;
    if (user.course) profile.course = user.course;
    profile.branch = user.branch;

    // Academic marks handling with validation
    if (cgpa !== undefined) {
      if (cgpa === "" || cgpa === null) {
        profile.cgpa = null;
      } else {
        const val = parseFloat(cgpa);
        if (!isNaN(val) && val >= 0 && val <= 10) profile.cgpa = val;
      }
    }

    if (tenthPercentage !== undefined) {
      if (tenthPercentage === "" || tenthPercentage === null) {
        profile.tenthPercentage = null;
      } else {
        const val = parseFloat(tenthPercentage);
        if (!isNaN(val) && val >= 0 && val <= 100) profile.tenthPercentage = val;
      }
    }

    if (twelfthPercentage !== undefined) {
      if (twelfthPercentage === "" || twelfthPercentage === null) {
        profile.twelfthPercentage = null;
      } else {
        const val = parseFloat(twelfthPercentage);
        if (!isNaN(val) && val >= 0 && val <= 100) profile.twelfthPercentage = val;
      }
    }

    if (backlogs !== undefined) {
      if (backlogs === "" || backlogs === null) {
        profile.backlogs = 0;
      } else {
        const val = parseInt(backlogs, 10);
        if (!isNaN(val) && val >= 0) profile.backlogs = val;
      }
    }

    await profile.save({ validateModifiedOnly: true });

    return res.status(200).json({
      message: "Student profile updated successfully by Admin",
      student: {
        _id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        course: user.course,
        branch: user.branch,
        college: user.college,
        status: user.status,
        cgpa: profile.cgpa,
        tenthPercentage: profile.tenthPercentage,
        twelfthPercentage: profile.twelfthPercentage,
        backlogs: profile.backlogs,
      },
    });
  } catch (error) {
    console.error("Error updating student by admin:", error);
    return res.status(500).json({
      message: "Failed to update student profile",
      error: error.message,
    });
  }
};

// ==========================================
// ACADEMIC SCORE UPDATE APPROVAL WORKFLOW
// ==========================================

const submitScoreUpdateRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { requestedScores, reason, proofDocumentUrl } = req.body;

    if (!requestedScores) {
      return res.status(400).json({ message: "Requested scores are required" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Official reason / justification is required" });
    }

    const { cgpa, tenthPercentage, twelfthPercentage, backlogs } = requestedScores;
    if (cgpa === undefined || tenthPercentage === undefined || twelfthPercentage === undefined || backlogs === undefined) {
      return res.status(400).json({ message: "All score fields (CGPA, 10th %, 12th %, backlogs) must be provided" });
    }

    const parsedCgpa = parseFloat(cgpa);
    const parsedTenth = parseFloat(tenthPercentage);
    const parsedTwelfth = parseFloat(twelfthPercentage);
    const parsedBacklogs = parseInt(backlogs, 10);

    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      return res.status(400).json({ message: "Valid CGPA between 0 and 10 is required" });
    }
    if (isNaN(parsedTenth) || parsedTenth < 0 || parsedTenth > 100) {
      return res.status(400).json({ message: "Valid 10th percentage between 0 and 100 is required" });
    }
    if (isNaN(parsedTwelfth) || parsedTwelfth < 0 || parsedTwelfth > 100) {
      return res.status(400).json({ message: "Valid 12th percentage between 0 and 100 is required" });
    }
    if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
      return res.status(400).json({ message: "Valid backlogs count (>= 0) is required" });
    }

    // Check if student has an existing request in 'pending' status
    const existingPending = await ScoreUpdateRequest.findOne({
      student: studentId,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        message: "You already have an academic score update request pending TPO review. Please wait for the current request to be processed.",
      });
    }

    const profile = await StudentProfile.findOne({ user: studentId });
    if (!profile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const currentScores = {
      cgpa: profile.cgpa ?? null,
      tenthPercentage: profile.tenthPercentage ?? null,
      twelfthPercentage: profile.twelfthPercentage ?? null,
      backlogs: profile.backlogs ?? 0,
    };

    const newRequest = await ScoreUpdateRequest.create({
      student: studentId,
      profile: profile._id,
      currentScores,
      requestedScores: {
        cgpa: parsedCgpa,
        tenthPercentage: parsedTenth,
        twelfthPercentage: parsedTwelfth,
        backlogs: parsedBacklogs,
      },
      reason: reason.trim(),
      proofDocumentUrl: (proofDocumentUrl || "").trim(),
      status: "pending",
    });

    return res.status(201).json({
      message: "Score update request submitted successfully. Awaiting TPO verification.",
      scoreUpdateRequest: newRequest,
    });
  } catch (error) {
    console.error("Error submitting score update request:", error);
    return res.status(500).json({
      message: "Failed to submit score update request",
      error: error.message,
    });
  }
};

const getMyScoreUpdateRequests = async (req, res) => {
  try {
    const requests = await ScoreUpdateRequest.find({ student: req.user.id })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error("Error fetching score requests:", error);
    return res.status(500).json({
      message: "Failed to fetch score update requests",
      error: error.message,
    });
  }
};

const getAllScoreRequestsForAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const [requests, totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      ScoreUpdateRequest.find(query)
        .populate("student", "name email rollNumber course branch college")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 }),
      ScoreUpdateRequest.countDocuments(),
      ScoreUpdateRequest.countDocuments({ status: "pending" }),
      ScoreUpdateRequest.countDocuments({ status: "approved" }),
      ScoreUpdateRequest.countDocuments({ status: "rejected" }),
    ]);

    return res.status(200).json({
      requests,
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin score requests:", error);
    return res.status(500).json({
      message: "Failed to fetch admin score update requests",
      error: error.message,
    });
  }
};

const approveScoreRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reviewRemarks } = req.body;

    const request = await ScoreUpdateRequest.findById(requestId).populate("student", "name email rollNumber");
    if (!request) {
      return res.status(404).json({ message: "Score update request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: `This request has already been ${request.status}.`,
      });
    }

    // Apply scores to StudentProfile
    const profile = await StudentProfile.findById(request.profile);
    if (!profile) {
      return res.status(404).json({ message: "Student profile associated with this request not found" });
    }

    profile.cgpa = request.requestedScores.cgpa;
    profile.tenthPercentage = request.requestedScores.tenthPercentage;
    profile.twelfthPercentage = request.requestedScores.twelfthPercentage;
    profile.backlogs = request.requestedScores.backlogs;
    profile.academicScoresLocked = true;
    await profile.save({ validateModifiedOnly: true });

    // Update request record
    request.status = "approved";
    request.reviewRemarks = (reviewRemarks || "").trim() || "Scores verified & approved against official records.";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    const populatedRequest = await ScoreUpdateRequest.findById(request._id)
      .populate("student", "name email rollNumber course branch")
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      message: `Score update approved for ${request.student?.name || "Student"}. Academic profile scores updated.`,
      scoreUpdateRequest: populatedRequest,
    });
  } catch (error) {
    console.error("Error approving score request:", error);
    return res.status(500).json({
      message: "Failed to approve score update request",
      error: error.message,
    });
  }
};

const rejectScoreRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reviewRemarks } = req.body;

    const request = await ScoreUpdateRequest.findById(requestId).populate("student", "name email rollNumber");
    if (!request) {
      return res.status(404).json({ message: "Score update request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: `This request has already been ${request.status}.`,
      });
    }

    // Reject without altering profile scores
    request.status = "rejected";
    request.reviewRemarks = (reviewRemarks || "").trim() || "Rejected by TPO: Verification failed or invalid marksheet.";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    const populatedRequest = await ScoreUpdateRequest.findById(request._id)
      .populate("student", "name email rollNumber course branch")
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      message: `Score update request rejected for ${request.student?.name || "Student"}. Profile scores remain unchanged.`,
      scoreUpdateRequest: populatedRequest,
    });
  } catch (error) {
    console.error("Error rejecting score request:", error);
    return res.status(500).json({
      message: "Failed to reject score update request",
      error: error.message,
    });
  }
};

module.exports = {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
  deleteResume,
  setPrimaryResume,
  getAllStudentsForAdmin,
  toggleStudentStatus,
  updateStudentByAdmin,
  submitScoreUpdateRequest,
  getMyScoreUpdateRequests,
  getAllScoreRequestsForAdmin,
  approveScoreRequest,
  rejectScoreRequest,
};