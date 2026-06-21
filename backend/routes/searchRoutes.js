const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const searchController = require("../controllers/searchController");

const router = express.Router();

// Global, role-aware dashboard search.
router.get(
  "/",
  authMiddleware,
  requireRoles(["Admin", "User", "InvestigationOfficer"]),
  searchController.globalSearch
);

module.exports = router;
