const express = require("express");
const {
  createCompany,
  assignRecruiterToCompany,
} = require("../controllers/companyController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createCompany
);

router.put(
  "/:companyId/recruiter",
  protect,
  authorizeRoles("admin"),
  assignRecruiterToCompany
);

module.exports = router;