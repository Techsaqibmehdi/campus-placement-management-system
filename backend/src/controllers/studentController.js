const StudentProfile = require("../models/StudentProfile");

const createStudentProfile = async (req, res) => {
  try {
    const {
      rollNumber,
      course,
      branch,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      skills,
      projects,
      internships,
      backlogs,
      resumeUrl,
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
      skills,
      projects,
      internships,
      backlogs,
      resumeUrl,
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
    const profile = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      profile,
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
    const profile = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const {
      rollNumber,
      course,
      branch,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      skills,
      projects,
      internships,
      backlogs,
      resumeUrl,
    } = req.body;

    profile.rollNumber = rollNumber ?? profile.rollNumber;
    profile.course = course ?? profile.course;
    profile.branch = branch ?? profile.branch;
    profile.cgpa = cgpa ?? profile.cgpa;
    profile.tenthPercentage =
      tenthPercentage ?? profile.tenthPercentage;
    profile.twelfthPercentage =
      twelfthPercentage ?? profile.twelfthPercentage;
    profile.skills = skills ?? profile.skills;
    profile.projects = projects ?? profile.projects;
    profile.internships = internships ?? profile.internships;
    profile.backlogs = backlogs ?? profile.backlogs;
    profile.resumeUrl = resumeUrl ?? profile.resumeUrl;

    await profile.save();

    res.status(200).json({
      message: "Student profile updated successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
};



module.exports = {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
};