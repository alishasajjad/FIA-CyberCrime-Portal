const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authMiddleware, notificationController.listMyNotifications);
router.patch("/read-all", authMiddleware, notificationController.markAllRead);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;
