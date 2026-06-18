const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const reminderController = require("../controllers/reminderController");

const router = express.Router();

// Investigation calendar/reminders — officers (and admins) only, owner-scoped.
const allow = requireRoles(["InvestigationOfficer", "Admin"]);

router.get("/", authMiddleware, allow, reminderController.listMyReminders);
router.post("/", authMiddleware, allow, reminderController.createReminder);
router.patch("/:id", authMiddleware, allow, reminderController.updateReminder);
router.delete("/:id", authMiddleware, allow, reminderController.deleteReminder);

module.exports = router;
