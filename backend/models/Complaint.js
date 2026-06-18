const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    referenceId: { type: String, unique: true, index: true },
    complainantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, default: "" },

    incidentType: { type: String, required: true, trim: true },
    department: { type: String, default: "", trim: true },
    // City of the incident/complainant — used for regional crime analytics & heat map.
    city: { type: String, default: "", trim: true },
    incidentSummary: { type: String, required: true, trim: true },

    evidenceLinks: { type: [String], default: [] },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "High",
    },

    status: {
      type: String,
      enum: ["Pending", "In Review", "Under Investigation", "Resolved", "Closed"],
      default: "Pending",
    },

    // Case notes are appended by admin/officers and displayed in user tracking.
    caseNotes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true, trim: true },
      },
    ],

    // Append-only progress trail powering the order-tracking-style timeline.
    // Backward compatible: legacy complaints without history fall back to
    // { status, createdAt } on the client.
    statusHistory: [
      {
        status: { type: String, trim: true },
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },

    // Escalation engine state (Phase D — additive, defaults keep legacy docs valid).
    escalationLevel: { type: Number, default: 0 },
    escalated: { type: Boolean, default: false },
    lastEscalatedAt: { type: Date },
    slaWarnedAt: { type: Date },

    evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evidence" }],
  },
  { timestamps: true, collection: "complaints" }
);

complaintSchema.index({ createdBy: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, createdAt: -1 });
complaintSchema.index({ status: 1, severity: 1 });
complaintSchema.index({ department: 1 });
complaintSchema.index({ city: 1 });
complaintSchema.index({ escalated: 1, status: 1 });

complaintSchema.pre("validate", function () {
  if (this.referenceId) return;
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  this.referenceId = `CR-${now.getFullYear()}-${month}-${rand}`;
});

module.exports = mongoose.model("Complaint", complaintSchema);

