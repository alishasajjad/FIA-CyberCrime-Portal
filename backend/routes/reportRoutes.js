const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  requireRoles(["Admin", "User", "InvestigationOfficer"]),
  reportController.getReportSummary
);

router.get(
  "/summary/admin",
  authMiddleware,
  requireRoles(["Admin"]),
  reportController.getAdminAnalyticsSummary
);

router.get(
  "/summary/user",
  authMiddleware,
  requireRoles(["User", "InvestigationOfficer"]),
  reportController.getUserAnalyticsSummary
);

// Phase 2 — Admin operations dashboards (read-only aggregations)
router.get(
  "/system-health",
  authMiddleware,
  requireRoles(["Admin"]),
  reportController.getSystemHealth
);

router.get(
  "/officer-performance",
  authMiddleware,
  requireRoles(["Admin"]),
  reportController.getOfficerPerformance
);

router.get(
  "/escalations",
  authMiddleware,
  requireRoles(["Admin"]),
  reportController.getEscalations
);

router.get(
  "/audit-log",
  authMiddleware,
  requireRoles(["Admin"]),
  reportController.getAuditLog
);

router.get(
  "/analytics",
  authMiddleware,
  requireRoles(["Admin"]),
  reportController.getAdvancedAnalytics
);

module.exports = router;
