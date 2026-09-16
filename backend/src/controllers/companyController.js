const Company = require("../models/Company");

const createCompany = async (req, res) => {
  try {
    const { name, description, website, industry, location, logoUrl } =
      req.body;

    const existingCompany = await Company.findOne({ name });

    if (existingCompany) {
      return res.status(400).json({
        message: "Company already exists",
      });
    }

    const company = await Company.create({
      name,
      description,
      website,
      industry,
      location,
      logoUrl,
    });

    res.status(201).json({
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Company creation failed",
      error: error.message,
    });
  }
};

const assignRecruiterToCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { recruiterId } = req.body;

    // Check recruiter ID
    if (!recruiterId) {
      return res.status(400).json({
        message: "Recruiter ID is required",
      });
    }

    // Find company
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Assign recruiter
    company.recruiter = recruiterId;

    await company.save();

    return res.status(200).json({
      message: "Recruiter assigned to company successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign recruiter",
      error: error.message,
    });
  }
};

module.exports = {
  createCompany,
  assignRecruiterToCompany,
};