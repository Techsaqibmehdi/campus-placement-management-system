const express = require("express");
const { createCompany } = require("../controllers/companyController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createCompany
);

module.exports = router;