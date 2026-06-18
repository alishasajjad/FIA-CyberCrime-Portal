const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true, collection: "sessions" }
);

sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

module.exports = mongoose.model("Session", sessionSchema);
