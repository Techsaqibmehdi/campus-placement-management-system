const express = require("express");
const {
  createCompany,
  updateCompany,
  deleteCompany,
  assignRecruiterToCompany,
  getAllRecruiters,
  getMyCompany,
  updateMyCompany,
  getAllCompanies,
  getCompanyById,
} = require("../controllers/companyController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Recruiter company profile
router.get(
  "/my-company",
  protect,
  authorizeRoles("recruiter"),
  getMyCompany
);

router.put(
  "/my-company",
  protect,
  authorizeRoles("recruiter"),
  updateMyCompany
);

// Admin: Get all recruiters list for dropdown
router.get(
  "/recruiters-list",
  protect,
  authorizeRoles("admin"),
  getAllRecruiters
);

// All companies (Admin / Recruiter / Student)
router.get(
  "/",
  protect,
  getAllCompanies
);

router.get(
  "/:companyId",
  protect,
  getCompanyById
);

// Admin actions
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createCompany
);

router.put(
  "/:companyId",
  protect,
  authorizeRoles("admin"),
  updateCompany
);

router.delete(
  "/:companyId",
  protect,
  authorizeRoles("admin"),
  deleteCompany
);

router.put(
  "/:companyId/recruiter",
  protect,
  authorizeRoles("admin"),
  assignRecruiterToCompany
);

module.exports = router;