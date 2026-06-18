const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const { authLimiter } = require("../middleware/security");
const userController = require("../controllers/userController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", authLimiter, asyncHandler(userController.register));
router.post("/login", authLimiter, asyncHandler(userController.login));
router.post("/logout", asyncHandler(userController.logout));
router.post("/otp/verify", authMiddleware, userController.verifyOtpSimulation);
router.get("/me", authMiddleware, userController.me);
router.get("/", authMiddleware, requireRoles(["Admin"]), userController.listUsers);
router.get(
  "/officer-requests",
  authMiddleware,
  requireRoles(["Admin"]),
  userController.listPendingOfficerRequests
);
router.post(
  "/:id/officer-review",
  authMiddleware,
  requireRoles(["Admin"]),
  userController.reviewOfficerRequest
);
router.get(
  "/officer-approval-logs",
  authMiddleware,
  requireRoles(["Admin"]),
  userController.getOfficerApprovalLogs
);

// Admin-only user management (CRUD)
router.patch("/:id", authMiddleware, requireRoles(["Admin"]), userController.updateUser);
router.delete("/:id", authMiddleware, requireRoles(["Admin"]), userController.deleteUser);

// Admin-only: create additional admins through a protected API.
router.post(
  "/admin/create",
  authMiddleware,
  requireRoles(["Admin"]),
  userController.createAdmin
);

module.exports = router;

