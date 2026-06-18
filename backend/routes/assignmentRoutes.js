const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const assignmentController = require("../controllers/assignmentController");

const router = express.Router();

router.get("/my", authMiddleware, requireRoles(["InvestigationOfficer"]), assignmentController.listMyAssignments);
router.get("/", authMiddleware, requireRoles(["Admin"]), assignmentController.listAssignments);
router.post("/", authMiddleware, requireRoles(["Admin"]), assignmentController.createAssignment);
router.patch("/:id", authMiddleware, assignmentController.updateAssignment);
router.delete("/:id", authMiddleware, requireRoles(["Admin"]), assignmentController.deleteAssignment);

module.exports = router;

