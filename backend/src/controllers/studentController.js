const StudentProfile = require("../models/StudentProfile");
const cloudinary = require("../config/cloudinary");

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
    }).populate("user", "name email");

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

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "campus-placement/resumes",
          resource_type: "raw",
          public_id: `${req.user.id}-resume`,
          overwrite: true,
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

    const student = await StudentProfile.findOne({
  user: req.user.id,
}).populate("user", "name email");

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    student.resumeUrl = result.secure_url;

    await student.save();

    return res.status(200).json({
      message: "Resume uploaded successfully",
      resumeUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({
      message: "Resume upload failed",
      error: error.message,
    });
  }
};

module.exports = {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
};