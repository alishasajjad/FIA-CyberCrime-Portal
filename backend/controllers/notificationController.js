const Notification = require("../models/Notification");

async function listMyNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ notifications });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to load notifications" });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const updated = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.userId },
      { $set: { read: true } },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    return res.json({ notification: updated });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to update notification" });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, read: false },
      { $set: { read: true } }
    );
    return res.json({ message: "All notifications marked as read" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to mark notifications" });
  }
}

module.exports = { listMyNotifications, markAsRead, markAllRead };
