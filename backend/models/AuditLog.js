const mongoose = require("mongoose");

// Persistent, append-only audit trail of critical platform actions.
// `action` is a free-form string (not a strict enum) so audit writes never
// fail validation; the canonical set is documented below.
//
// Canonical actions:
//   USER_REGISTERED, USER_LOGIN, USER_LOGOUT,
//   COMPLAINT_CREATED, COMPLAINT_UPDATED, STATUS_CHANGED, COMPLAINT_ASSIGNED,
//   ASSIGNMENT_ACCEPTED, ASSIGNMENT_REJECTED, COMPLAINT_DELETED,
//   EVIDENCE_UPLOADED, ESCALATION,
//   SUPPORT_TICKET_CREATED, SUPPORT_TICKET_UPDATED,
//   OFFICER_APPROVAL, USER_UPDATED, USER_DELETED, ADMIN_ACTION
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: ["User", "Complaint", "Assignment", "Evidence", "SupportTicket", "Session", "System"],
      default: "System",
    },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    // Optional complaint linkage powers the per-complaint audit history.
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    summary: { type: String, default: "", trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true, collection: "auditLogs" }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
