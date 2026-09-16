const PlacementDrive = require("../models/PlacementDrive");

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

module.exports = {
  createPlacementDrive,
};