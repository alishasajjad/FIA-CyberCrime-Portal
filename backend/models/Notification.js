const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Complaint", "Status", "Assignment", "OTP", "Support", "System"],
      default: "System",
    },
    channel: {
      type: String,
      enum: ["InApp", "Email", "SMS"],
      default: "InApp",
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "notifications" }
);

module.exports = mongoose.model("Notification", notificationSchema);

