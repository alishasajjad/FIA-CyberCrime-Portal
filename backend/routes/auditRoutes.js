const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const auditController = require("../controllers/auditController");

const router = express.Router();

// Persistent audit trail — Admin only.
router.get(
  "/",
  authMiddleware,
  requireRoles(["Admin"]),
  auditController.listAuditLogs
);

module.exports = router;
