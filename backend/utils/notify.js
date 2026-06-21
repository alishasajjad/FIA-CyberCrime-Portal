const Notification = require("../models/Notification");
const { emitToUser } = require("./realtime");

async function createNotification({
  recipient,
  title,
  message,
  type = "System",
  channel = "InApp",
  meta = {},
}) {
  if (!recipient || !title || !message) return null;
  const notification = await Notification.create({
    recipient,
    title: String(title).trim(),
    message: String(message).trim(),
    type,
    channel,
    meta,
  });

  // Real-time delivery — every in-app notification reaches the recipient
  // instantly. Best-effort; never blocks the create.
  try {
    emitToUser(recipient, "notification:new", {
      notification: {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        meta: notification.meta,
        createdAt: notification.createdAt,
      },
    });
  } catch {
    /* realtime is optional */
  }

  return notification;
}

module.exports = { createNotification };
