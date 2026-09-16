const PlacementDrive = require("../models/PlacementDrive");
const Company = require("../models/Company");

const createPlacementDrive = async (req, res) => {
  try {
    const {
      company,
      jobTitle,
      description,
      package: packageAmount,
      location,
      minimumCgpa,
      eligibleBranches,
      requiredSkills,
      minimumTenthPercentage,
      minimumTwelfthPercentage,
      maximumBacklogs,
      applicationDeadline,
      status,
    } = req.body;

    // Find company
    const companyData = await Company.findById(company);

    if (!companyData) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Recruiter can create drive only for their own company
    if (
      req.user.role === "recruiter" &&
      companyData.recruiter?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You can only create drives for your assigned company",
      });
    }

    // Create placement drive
    const drive = await PlacementDrive.create({
      company,
      jobTitle,
      description,
      package: packageAmount,
      location,
      minimumCgpa,
      eligibleBranches,
      requiredSkills,
      minimumTenthPercentage,
      minimumTwelfthPercentage,
      maximumBacklogs,
      applicationDeadline,
      status,
    });

    res.status(201).json({
      message: "Placement drive created successfully",
      drive,
    });
  } catch (error) {
    res.status(500).json({
      message: "Placement drive creation failed",
      error: error.message,
    });
  }
};

const getPlacementDrives = async (req, res) => {
  try {
    const drives = await PlacementDrive.find({
      status: "open",
      applicationDeadline: { $gte: new Date() },
    })
      .populate("company", "name logoUrl industry location")
      .sort({ applicationDeadline: 1 });

    res.status(200).json({
      count: drives.length,
      drives,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch placement drives",
      error: error.message,
    });
  }
};

module.exports = {
  createPlacementDrive,
  getPlacementDrives,
};