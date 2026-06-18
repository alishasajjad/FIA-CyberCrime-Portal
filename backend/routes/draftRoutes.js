const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const draftController = require("../controllers/draftController");

const router = express.Router();

// Drafts are owned by the authenticated complainant. Officers/Admins may also
// keep drafts, but ownership scoping ensures users only see their own.
router.get("/", authMiddleware, draftController.listMyDrafts);
router.post("/", authMiddleware, draftController.saveDraft);
router.get("/:id", authMiddleware, draftController.getDraft);
router.delete("/:id", authMiddleware, draftController.deleteDraft);

module.exports = router;
