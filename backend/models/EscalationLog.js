const mongoose = require("mongoose");

// Append-only escalation history. Nothing is ever overwritten — every event
// (trigger, reassignment, queue, warning, violation, resolution, override) is
// recorded as a new immutable row for full audit traceability.
const escalationLogSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true, index: true },
    referenceId: { type: String, default: "" },
    level: { type: Number, default: 1 },
    type: {
      type: String,
      enum: ["Triggered", "Reassigned", "Queued", "Warning", "Violation", "Resolved", "AdminOverride"],
      required: true,
    },
    reason: { type: String, default: "" },
    severity: { type: String, default: "" },
    slaHours: { type: Number },
    ageHours: { type: Number },
    fromOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminOverride: { type: Boolean, default: false },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city: { type: String, default: "" },
    category: { type: String, default: "" },
  },
  { timestamps: true, collection: "escalationlogs" }
);

escalationLogSchema.index({ createdAt: -1 });
escalationLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("EscalationLog", escalationLogSchema);
