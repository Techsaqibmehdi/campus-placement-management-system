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

module.exports = {
  createCompany,
};