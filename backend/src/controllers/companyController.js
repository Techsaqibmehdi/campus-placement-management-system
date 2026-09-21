const Company = require("../models/Company");
const User = require("../models/User");

// Admin: Onboard New Company Partner
const createCompany = async (req, res) => {
  try {
    const { name, description, website, industry, location, logoUrl, recruiter, recruiterId } =
      req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Company name is required",
      });
    }

    const existingCompany = await Company.findOne({
      name: new RegExp(`^${name.trim()}$`, "i"),
    });

    if (existingCompany) {
      return res.status(400).json({
        message: "A corporate partner with this name already exists",
      });
    }

    const targetRecruiter =
      recruiterId && recruiterId !== "none" ? recruiterId : recruiter || null;

    const company = await Company.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      website: website ? website.trim() : "",
      industry: industry ? industry.trim() : "Technology",
      location: location ? location.trim() : "Delhi-NCR",
      logoUrl: logoUrl || null,
      recruiter: targetRecruiter,
    });

    await company.populate(
      "recruiter",
      "name email designation contactNumber companyName status"
    );

    res.status(201).json({
      message: "Corporate partner onboarded successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Company creation failed",
      error: error.message,
    });
  }
};

// Admin: Update Existing Corporate Partner Profile & Assigned Recruiter
const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, description, website, industry, location, logoUrl, recruiterId } =
      req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    if (name && name.trim()) company.name = name.trim();
    if (description !== undefined) company.description = description.trim();
    if (website !== undefined) company.website = website.trim();
    if (industry !== undefined) company.industry = industry.trim();
    if (location !== undefined) company.location = location.trim();
    if (logoUrl !== undefined) company.logoUrl = logoUrl;

    if (recruiterId !== undefined) {
      company.recruiter =
        recruiterId && recruiterId !== "none" ? recruiterId : null;
    }

    await company.save();
    await company.populate(
      "recruiter",
      "name email designation contactNumber companyName status"
    );

    res.status(200).json({
      message: "Company details updated successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update company",
      error: error.message,
    });
  }
};

// Admin: Remove / Delete Corporate Partner
const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findByIdAndDelete(companyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.status(200).json({
      message: "Corporate partner removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove company",
      error: error.message,
    });
  }
};

// Admin: Assign / Unassign Recruiter to Company
const assignRecruiterToCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { recruiterId } = req.body;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    company.recruiter =
      recruiterId && recruiterId !== "none" ? recruiterId : null;
    await company.save();
    await company.populate(
      "recruiter",
      "name email designation contactNumber companyName status"
    );

    return res.status(200).json({
      message: company.recruiter
        ? "Recruiter assigned to company successfully"
        : "Recruiter unassigned; company is now a Direct TPO Partner",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign recruiter",
      error: error.message,
    });
  }
};

// Admin: Fetch all registered recruiters for simple dropdown selection
const getAllRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({ role: "recruiter" })
      .select("name email designation companyName status contactNumber")
      .sort({ name: 1 });

    res.status(200).json({
      count: recruiters.length,
      recruiters,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recruiters list",
      error: error.message,
    });
  }
};

// Recruiter: Get own company profile
const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ recruiter: req.user.id });

    if (!company) {
      return res.status(404).json({
        message: "No company assigned to your recruiter account",
      });
    }

    return res.status(200).json({
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch company",
      error: error.message,
    });
  }
};

// Recruiter: Update own company profile
const updateMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ recruiter: req.user.id });

    if (!company) {
      return res.status(404).json({
        message: "No company assigned to your recruiter account",
      });
    }

    const allowedUpdates = [
      "description",
      "website",
      "industry",
      "location",
      "logoUrl",
    ];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();

    return res.status(200).json({
      message: "Company profile updated successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update company profile",
      error: error.message,
    });
  }
};

// All authenticated users: Get directory of all Corporate Partners
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate(
        "recruiter",
        "name email designation contactNumber companyName status"
      )
      .sort({ name: 1 });

    return res.status(200).json({
      count: companies.length,
      companies,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch companies",
      error: error.message,
    });
  }
};

// All authenticated: Get specific company details
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId).populate(
      "recruiter",
      "name email designation contactNumber companyName status"
    );

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json({
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch company details",
      error: error.message,
    });
  }
};

module.exports = {
  createCompany,
  updateCompany,
  deleteCompany,
  assignRecruiterToCompany,
  getAllRecruiters,
  getMyCompany,
  updateMyCompany,
  getAllCompanies,
  getCompanyById,
};