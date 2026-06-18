const express = require("express");
const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const upload = require("../middleware/upload");
const {
  validateUploadContentLength,
  validateUploadedFilesTotal,
} = require("../middleware/uploadValidation");
const evidenceController = require("../controllers/evidenceController");
const messageController = require("../controllers/messageController");

const router = express.Router();

// Submit complaint (Users)
router.post("/", authMiddleware, complaintController.submitComplaint);

// Search complaints (User: own cases, Officer: assigned cases, Admin: all)
router.get("/search", authMiddleware, complaintController.searchComplaints);

// Dashboard stats (Admin only)
router.get(
  "/stats",
  authMiddleware,
  requireRoles(["Admin", "User", "InvestigationOfficer"]),
  complaintController.getStats
);

// List assigned cases (Officer only)
router.get(
  "/assigned",
  authMiddleware,
  requireRoles(["InvestigationOfficer", "User", "Admin"]),
  complaintController.listAssigned
);

// City-level complaint analytics for the crime heat map (Admin only)
router.get(
  "/city-stats",
  authMiddleware,
  requireRoles(["Admin"]),
  complaintController.getCityStats
);

// Admin: assign complaint to an officer
router.post(
  "/:id/assign",
  authMiddleware,
  requireRoles(["Admin"]),
  complaintController.assignComplaint
);

// Update status/severity and append case notes (Admin + assigned Officer)
router.patch(
  "/:id/status",
  authMiddleware,
  complaintController.updateComplaintStatus
);

// Admin: delete complaint (and linked evidence/messages)
router.delete("/:id", authMiddleware, requireRoles(["Admin"]), complaintController.deleteComplaint);

// Evidence upload/list for a complaint
router.post(
  "/:id/evidence",
  authMiddleware,
  requireRoles(["Admin", "User", "InvestigationOfficer"]),
  validateUploadContentLength,
  upload.array("evidenceFiles"),
  validateUploadedFilesTotal,
  evidenceController.uploadEvidence
);
router.get(
  "/:id/evidence",
  authMiddleware,
  requireRoles(["Admin", "User", "InvestigationOfficer"]),
  evidenceController.listEvidence
);
router.delete(
  "/:id/evidence/:evidenceId",
  authMiddleware,
  requireRoles(["Admin"]),
  evidenceController.deleteEvidence
);

// Complaint messages (follow-up Q&A)
router.post(
  "/:id/messages",
  authMiddleware,
  requireRoles(["Admin", "User", "InvestigationOfficer"]),
  messageController.postMessage
);
router.get(
  "/:id/messages",
  authMiddleware,
  requireRoles(["Admin", "User", "InvestigationOfficer"]),
  messageController.getMessages
);

module.exports = router;

