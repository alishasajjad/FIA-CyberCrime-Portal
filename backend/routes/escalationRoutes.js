const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const escalationController = require("../controllers/escalationController");

const router = express.Router();
const adminOnly = requireRoles(["Admin"]);

// Escalation engine — admin configuration, queue, history, analytics, manual control.
router.get("/config", authMiddleware, adminOnly, escalationController.getConfig);
router.put("/config", authMiddleware, adminOnly, escalationController.updateConfig);
router.get("/queue", authMiddleware, adminOnly, escalationController.getQueue);
router.get("/logs", authMiddleware, adminOnly, escalationController.getLogs);
router.get("/stats", authMiddleware, adminOnly, escalationController.getStats);
router.post("/run", authMiddleware, adminOnly, escalationController.runNow);
router.post("/:complaintId/reassign", authMiddleware, adminOnly, escalationController.manualReassign);

module.exports = router;
