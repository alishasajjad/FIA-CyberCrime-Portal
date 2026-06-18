const Notification = require("../models/Notification");

async function createNotification({
  recipient,
  title,
  message,
  type = "System",
  channel = "InApp",
  meta = {},
}) {
  if (!recipient || !title || !message) return null;
  return Notification.create({
    recipient,
    title: String(title).trim(),
    message: String(message).trim(),
    type,
    channel,
    meta,
  });
}

module.exports = { createNotification };
