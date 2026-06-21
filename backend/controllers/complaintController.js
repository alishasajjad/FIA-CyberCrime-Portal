const mongoose = require("mongoose");
const path = require("path");
const Complaint = require("../models/Complaint");
const Evidence = require("../models/Evidence");
const Assignment = require("../models/Assignment");
const ComplaintMessage = require("../models/ComplaintMessage");
const EscalationLog = require("../models/EscalationLog");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { createNotification } = require("../utils/notify");
const { recordAudit } = require("../utils/audit");
const { emitToRole, emitToUser, emitToComplaint } = require("../utils/realtime");
const { logEscalationResolved } = require("../utils/escalationEngine");
const {
  getAdminAnalytics,
  refreshAnalyticsForRoles,
} = require("../utils/analyticsStore");
const appConfig = require("../config/appConfig");
const memoryCache = require("../utils/memoryCache");

const STATUSES = [
  "Pending",
  "In Review",
  "Under Investigation",
  "Resolved",
  "Closed",
];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

function normalizeEvidenceLinks(evidenceLinks) {
  if (!evidenceLinks) return [];
  if (Array.isArray(evidenceLinks)) return evidenceLinks;
  // Allow a comma-separated string in request bodies.
  if (typeof evidenceLinks === "string") {
    return evidenceLinks
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function inferSeverity(incidentType, severity) {
  if (severity && SEVERITIES.includes(severity)) return severity;
  const text = String(incidentType || "").toLowerCase();
  if (text.includes("ransom") || text.includes("ransomware")) return "Critical";
  if (text.includes("fraud") || text.includes("scam") || text.includes("account"))
    return "High";
  if (text.includes("phishing") || text.includes("malware")) return "High";
  return "Medium";
}

function inferDepartment(incidentType) {
  const text = String(incidentType || "").toLowerCase();
  if (text.includes("phishing") || text.includes("scam")) return "Phishing";
  if (text.includes("fraud")) return "Financial Fraud";
  if (text.includes("account")) return "Account Security";
  if (text.includes("malware") || text.includes("ransom")) return "Malware Analysis";
  if (text.includes("harassment") || text.includes("abuse")) return "Harassment";
  return "General Cyber Crime";
}

function assertValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function canOfficerAccessComplaint(userId, complaint) {
  const assignedId =
    complaint?.assignedTo?._id?.toString?.() ||
    complaint?.assignedTo?.toString?.();
  return assignedId === userId?.toString?.();
}

async function refreshAnalyticsAfterComplaintChange(complaint) {
  try {
    await Promise.allSettled([
      getAdminAnalytics({ forceRefresh: true }),
      refreshAnalyticsForRoles(complaint?.createdBy, "User"),
      refreshAnalyticsForRoles(complaint?.assignedTo, "InvestigationOfficer"),
    ]);
  } catch {
    // Best effort only; complaint flow should not fail if analytics cache update fails.
  }

  // Real-time fan-out: nudge dashboards (stats) and any open complaint views.
  try {
    const cid = complaint?._id ? String(complaint._id) : null;
    const owner = complaint?.createdBy?._id || complaint?.createdBy;
    const officer = complaint?.assignedTo?._id || complaint?.assignedTo;
    emitToRole("Admin", "stats:changed", {});
    if (cid) {
      emitToRole("Admin", "complaint:updated", { complaintId: cid });
      emitToComplaint(cid, "complaint:updated", { complaintId: cid });
    }
    if (owner) {
      emitToUser(owner, "complaint:updated", { complaintId: cid });
      emitToUser(owner, "stats:changed", {});
    }
    if (officer) {
      emitToUser(officer, "complaint:updated", { complaintId: cid });
      emitToUser(officer, "stats:changed", {});
    }
  } catch {
    /* realtime optional */
  }
}

async function submitComplaint(req, res) {
  try {
    const {
      complainantName,
      email,
      phoneNumber,
      incidentType,
      city,
      incidentSummary,
      evidenceLinks,
      severity,
    } = req.body || {};

    // Role-based: only Users can submit new complaints.
    if (req.user?.role !== "User") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!complainantName || !email || !incidentType || !incidentSummary) {
      return res.status(400).json({
        message:
          "complainantName, email, incidentType, and incidentSummary are required",
      });
    }

    const complaint = await Complaint.create({
      complainantName: String(complainantName).trim(),
      email: String(email).toLowerCase().trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : "",
      incidentType: String(incidentType).trim(),
      department: inferDepartment(incidentType),
      city: city ? String(city).trim() : "",
      incidentSummary: String(incidentSummary).trim(),
      evidenceLinks: normalizeEvidenceLinks(evidenceLinks),
      severity: inferSeverity(incidentType, severity),
      status: "Pending",
      statusHistory: [{ status: "Pending", at: new Date(), by: req.user?.userId }],
      createdBy: req.user?.userId,
    });

    await createNotification({
      recipient: req.user?.userId,
      title: "Complaint submitted",
      message: `Your complaint ${complaint.referenceId} has been submitted successfully.`,
      type: "Complaint",
      meta: { complaintId: complaint._id, status: complaint.status },
    });

    recordAudit({
      req,
      action: "COMPLAINT_CREATED",
      entityType: "Complaint",
      entityId: complaint._id,
      complaint: complaint._id,
      summary: `Complaint ${complaint.referenceId} created — ${complaint.incidentType}${complaint.city ? ` (${complaint.city})` : ""}`,
      meta: { referenceId: complaint.referenceId, severity: complaint.severity },
    });

    await refreshAnalyticsAfterComplaintChange(complaint);

    return res.status(201).json({ complaint });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Submit failed" });
  }
}

async function searchComplaints(req, res) {
  try {
    const { complaintId, referenceId } = req.query || {};

    const role = req.user?.role;
    const userId = req.user?.userId;

    const filter = {};

    if (role === "User") {
      filter.createdBy = userId;
    } else if (role === "InvestigationOfficer") {
      filter.assignedTo = userId;
    } else if (role === "Admin") {
      // Admin can see all, no additional constraints.
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const normalizedComplaintId = String(complaintId || referenceId || "").trim();
    if (normalizedComplaintId) {
      // Prefer Mongo ObjectId if it parses, otherwise match by referenceId.
      if (assertValidId(normalizedComplaintId)) {
        filter._id = new mongoose.Types.ObjectId(normalizedComplaintId);
      } else {
        filter.referenceId = normalizedComplaintId;
      }
    }

    const results = await Complaint.find(filter)
      .populate("assignedTo", "name unit role")
      .populate("createdBy", "name role")
      .populate("statusHistory.by", "name role")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ complaints: results });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Search failed" });
  }
}

async function getStats(req, res) {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    const cacheKey = `stats:${role}:${userId}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return res.json(cached);

    const scope = {};
    if (role === "User") scope.createdBy = userId;
    if (role === "InvestigationOfficer") scope.assignedTo = userId;

    const totalComplaints = await Complaint.countDocuments(scope);
    const pendingCases = await Complaint.countDocuments({
      ...scope,
      status: { $in: ["Pending", "In Review", "Under Investigation"] },
    });
    const resolvedCases = await Complaint.countDocuments({
      ...scope,
      status: { $in: ["Resolved", "Closed"] },
    });

    const highSeverityAlerts = await Complaint.countDocuments({
      ...scope,
      severity: { $in: ["High", "Critical"] },
      status: { $nin: ["Resolved", "Closed"] },
    });

    const payload = {
      totalComplaints,
      pendingCases,
      resolvedCases,
      highSeverityAlerts,
    };
    memoryCache.set(cacheKey, payload, appConfig.cache.statsTtlMs);
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Stats failed" });
  }
}

async function assignComplaint(req, res) {
  try {
    const role = req.user?.role;
    if (role !== "Admin") return res.status(403).json({ message: "Forbidden" });

    const { officerId, notes } = req.body || {};
    const { id } = req.params;

    if (!assertValidId(id)) return res.status(400).json({ message: "Invalid complaint id" });
    if (!assertValidId(officerId)) return res.status(400).json({ message: "Invalid officer id" });

    const [complaint, officers] = await Promise.all([
      Complaint.findById(id),
      User.findById(officerId),
    ]);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (
      !officers ||
      officers.role !== "InvestigationOfficer" ||
      !officers.isApprovedOfficer ||
      officers.status !== "Active"
    ) {
      return res.status(400).json({ message: "officerId must be an approved InvestigationOfficer" });
    }
    const officerDepartment = String(officers.unit || "").trim().toLowerCase();
    const complaintDepartment = String(complaint.department || inferDepartment(complaint.incidentType))
      .trim()
      .toLowerCase();
    if (!officerDepartment) {
      return res.status(400).json({ message: "Officer must have a department" });
    }
    if (officerDepartment !== complaintDepartment) {
      return res.status(400).json({
        message: `Officer department mismatch. Complaint belongs to ${complaint.department}.`,
      });
    }

    // Upsert assignment
    await Assignment.updateOne(
      { complaint: complaint._id },
      {
        $set: {
          complaint: complaint._id,
          assignedTo: officers._id,
          status: "Assigned",
          response: "Pending",
          rejectionReason: "",
          respondedAt: null,
          notes: notes ? String(notes).trim() : "",
        },
      },
      { upsert: true }
    );

    complaint.assignedTo = officers._id;
    complaint.status = "Under Investigation";

    if (notes && String(notes).trim().length > 0) {
      complaint.caseNotes.push({ author: req.user.userId, text: String(notes).trim() });
    }

    // Record the assignment transition so the user timeline shows who/when.
    if (!Array.isArray(complaint.statusHistory)) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: "Under Investigation",
      at: new Date(),
      by: req.user.userId,
      note: notes ? String(notes).trim() : "Assigned to an investigation officer.",
    });

    await complaint.save();

    await Promise.all([
      createNotification({
        recipient: officers._id,
        title: "New assignment",
        message: `Complaint ${complaint.referenceId} has been assigned to you.`,
        type: "Assignment",
        meta: { complaintId: complaint._id },
      }),
      complaint.createdBy
        ? createNotification({
            recipient: complaint.createdBy,
            title: "Complaint assigned",
            message: `Your complaint ${complaint.referenceId} is now under investigation.`,
            type: "Status",
            meta: { complaintId: complaint._id, status: complaint.status },
          })
        : Promise.resolve(null),
    ]);

    recordAudit({
      req,
      action: "COMPLAINT_ASSIGNED",
      entityType: "Complaint",
      entityId: complaint._id,
      complaint: complaint._id,
      summary: `Complaint ${complaint.referenceId} assigned to ${officers.name}`,
      meta: { officerId: officers._id, officerName: officers.name },
    });

    await refreshAnalyticsAfterComplaintChange(complaint);

    return res.json({ complaint });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Assign failed" });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, severity, notes } = req.body || {};

    if (!assertValidId(id)) return res.status(400).json({ message: "Invalid complaint id" });
    if (status && !STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status value" });
    if (severity && !SEVERITIES.includes(severity)) return res.status(400).json({ message: "Invalid severity value" });

    const complaint = await Complaint.findById(id).populate("assignedTo", "role");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const role = req.user?.role;
    const userId = req.user?.userId;

    if (role === "Admin") {
      // allowed
    } else if (role === "InvestigationOfficer") {
      if (!canOfficerAccessComplaint(userId, complaint)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const update = {};
    if (status) {
      update.status = status;
      if (status === "Resolved" || status === "Closed") update.resolvedAt = new Date();
      // Record the transition only when the status actually changes.
      if (status !== complaint.status) {
        if (!Array.isArray(complaint.statusHistory)) complaint.statusHistory = [];
        complaint.statusHistory.push({
          status,
          at: new Date(),
          by: userId,
          note: notes ? String(notes).trim() : "",
        });
      }
    }
    if (severity) update.severity = severity;

    if (notes && String(notes).trim().length > 0) {
      complaint.caseNotes.push({ author: userId, text: String(notes).trim() });
    }

    Object.assign(complaint, update);
    await complaint.save();

    // Record resolution of a previously escalated case (additive audit trail).
    if (status && ["Resolved", "Closed"].includes(status) && complaint.escalated) {
      await logEscalationResolved(complaint, userId);
    }

    if (status) {
      await createNotification({
        recipient: complaint.createdBy,
        title: "Complaint status updated",
        message: `Complaint ${complaint.referenceId} status changed to ${status}.`,
        type: "Status",
        meta: { complaintId: complaint._id, status },
      });
    }

    recordAudit({
      req,
      action: status ? "STATUS_CHANGED" : "COMPLAINT_UPDATED",
      entityType: "Complaint",
      entityId: complaint._id,
      complaint: complaint._id,
      summary: status
        ? `Status of ${complaint.referenceId} changed to ${status}`
        : `Complaint ${complaint.referenceId} updated`,
      meta: { status: status || undefined, severity: severity || undefined },
    });

    // Also update assignment notes/status when officer/admin updates.
    if (role === "InvestigationOfficer") {
      await Assignment.updateOne(
        { complaint: complaint._id },
        {
          $set: {
            status:
              status === "Resolved" || status === "Closed"
                ? "Completed"
                : "In Progress",
            notes: notes ? String(notes).trim() : "",
          },
        }
      );
    }

    await refreshAnalyticsAfterComplaintChange(complaint);

    return res.json({ complaint });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Update failed" });
  }
}

// Officer accepts or rejects an assigned complaint.
// Accept -> assignment moves to "In Progress".
// Reject -> requires a reason; complaint is returned to the admin assignment
// queue (unassigned, status reset to Pending) and all admins are notified.
async function respondToAssignment(req, res) {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (role !== "InvestigationOfficer") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;
    const { action, reason } = req.body || {};
    if (!assertValidId(id)) return res.status(400).json({ message: "Invalid complaint id" });

    const normalizedAction = String(action || "").toLowerCase();
    if (!["accept", "reject"].includes(normalizedAction)) {
      return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (!canOfficerAccessComplaint(userId, complaint)) {
      return res.status(403).json({ message: "This complaint is not assigned to you" });
    }

    const officer = await User.findById(userId).select("name");
    const officerName = officer?.name || "An officer";

    if (normalizedAction === "accept") {
      await Assignment.updateOne(
        { complaint: complaint._id },
        { $set: { status: "In Progress", response: "Accepted", respondedAt: new Date() } }
      );

      complaint.caseNotes.push({
        author: userId,
        text: "Officer accepted the assignment and started the investigation.",
      });
      await complaint.save();

      if (complaint.createdBy) {
        await createNotification({
          recipient: complaint.createdBy,
          title: "Investigation started",
          message: `An officer has accepted your complaint ${complaint.referenceId} and begun the investigation.`,
          type: "Status",
          meta: { complaintId: complaint._id, status: complaint.status },
        });
      }

      recordAudit({
        req,
        action: "ASSIGNMENT_ACCEPTED",
        entityType: "Complaint",
        entityId: complaint._id,
        complaint: complaint._id,
        summary: `${officerName} accepted assignment of ${complaint.referenceId}`,
      });

      await refreshAnalyticsAfterComplaintChange(complaint);
      return res.json({ complaint, response: "Accepted" });
    }

    // Reject — reason is mandatory.
    const trimmedReason = String(reason || "").trim();
    if (trimmedReason.length < 3) {
      return res.status(400).json({ message: "A rejection reason is required" });
    }

    const previousOfficerId = complaint.assignedTo;

    complaint.assignedTo = null;
    complaint.status = "Pending";
    if (!Array.isArray(complaint.statusHistory)) complaint.statusHistory = [];
    complaint.statusHistory.push({ status: "Pending", at: new Date(), by: userId });
    complaint.caseNotes.push({
      author: userId,
      text: `Assignment rejected by ${officerName}: ${trimmedReason}`,
    });
    await complaint.save();

    // Remove the assignment so the complaint returns to the unassigned queue.
    await Assignment.deleteOne({ complaint: complaint._id });

    // Notify every active admin with the rejection reason.
    const admins = await User.find({ role: "Admin", status: "Active" }).select("_id");
    await Promise.all(
      admins.map((a) =>
        createNotification({
          recipient: a._id,
          title: "Assignment rejected",
          message: `${officerName} rejected complaint ${complaint.referenceId}. Reason: ${trimmedReason}`,
          type: "Assignment",
          meta: {
            complaintId: complaint._id,
            referenceId: complaint.referenceId,
            reason: trimmedReason,
            rejectedBy: userId,
            previousOfficer: previousOfficerId,
          },
        })
      )
    );

    recordAudit({
      req,
      action: "ASSIGNMENT_REJECTED",
      entityType: "Complaint",
      entityId: complaint._id,
      complaint: complaint._id,
      summary: `${officerName} rejected assignment of ${complaint.referenceId}`,
      meta: { reason: trimmedReason },
    });

    await refreshAnalyticsAfterComplaintChange(complaint);
    return res.json({ complaint, response: "Rejected" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Assignment response failed" });
  }
}

// Aggregated detail for the Complaint Details page. RBAC: Admin (all),
// User (own), assigned Officer. Bundles timeline, evidence, messages,
// assignment, escalation history, related notifications, audit history,
// and a resolution summary in a single call.
async function getComplaintDetails(req, res) {
  try {
    const { id } = req.params;
    if (!assertValidId(id)) return res.status(400).json({ message: "Invalid complaint id" });

    const role = req.user?.role;
    const userId = req.user?.userId;

    const complaint = await Complaint.findById(id)
      .populate("assignedTo", "name unit role email phoneNumber")
      .populate("createdBy", "name role email")
      .populate("statusHistory.by", "name role")
      .populate("caseNotes.author", "name role");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    if (role === "User") {
      const ownerId = complaint.createdBy?._id?.toString?.() || complaint.createdBy?.toString?.();
      if (ownerId !== userId?.toString?.()) return res.status(403).json({ message: "Forbidden" });
    } else if (role === "InvestigationOfficer") {
      if (!canOfficerAccessComplaint(userId, complaint)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const complaintObjId = new mongoose.Types.ObjectId(id);
    const [evidenceDocs, messages, assignment, escalationHistory, notifications, auditHistory] =
      await Promise.all([
        Evidence.find({ complaint: id }).populate("uploadedBy", "name role").sort({ createdAt: -1 }),
        ComplaintMessage.find({ complaint: id }).populate("sender", "name role").sort({ createdAt: 1 }).limit(200),
        Assignment.findOne({ complaint: id }).populate("assignedTo", "name unit role email"),
        EscalationLog.find({ complaint: id })
          .populate("fromOfficer", "name")
          .populate("toOfficer", "name")
          .sort({ createdAt: -1 }),
        Notification.find({
          recipient: userId,
          $or: [{ "meta.complaintId": id }, { "meta.complaintId": complaintObjId }],
        })
          .sort({ createdAt: -1 })
          .limit(20),
        role === "Admin"
          ? AuditLog.find({ complaint: id }).populate("actor", "name role").sort({ createdAt: -1 }).limit(50)
          : Promise.resolve([]),
      ]);

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    const evidence = evidenceDocs.map((e) => ({
      _id: e._id,
      originalName: e.originalName,
      mimeType: e.mimeType,
      size: e.size,
      message: e.message || "",
      createdAt: e.createdAt,
      uploadedBy: e.uploadedBy
        ? { _id: e.uploadedBy._id, name: e.uploadedBy.name, role: e.uploadedBy.role }
        : null,
      fileUrl: e.filePath ? `${baseUrl}/uploads/${path.basename(e.filePath)}` : null,
    }));

    // Resolution summary derived from history (no schema changes).
    let resolutionSummary = null;
    if (["Resolved", "Closed"].includes(complaint.status)) {
      const hist = Array.isArray(complaint.statusHistory) ? complaint.statusHistory : [];
      const resolvedEntry = [...hist].reverse().find((h) => ["Resolved", "Closed"].includes(h.status));
      const lastNote = complaint.caseNotes?.length
        ? complaint.caseNotes[complaint.caseNotes.length - 1]
        : null;
      resolutionSummary = {
        status: complaint.status,
        resolvedAt: complaint.resolvedAt || resolvedEntry?.at || null,
        resolvedBy: resolvedEntry?.by?.name || complaint.assignedTo?.name || null,
        note: resolvedEntry?.note || lastNote?.text || "",
      };
    }

    return res.json({
      complaint,
      evidence,
      messages,
      assignment,
      escalationHistory,
      notifications,
      auditHistory,
      resolutionSummary,
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load complaint details" });
  }
}

async function deleteComplaint(req, res) {
  try {
    if (req.user?.role !== "Admin") return res.status(403).json({ message: "Forbidden" });

    const { id } = req.params;
    if (!assertValidId(id)) return res.status(400).json({ message: "Invalid complaint id" });

    const complaint = await Complaint.findById(id);

    await Promise.all([
      Evidence.deleteMany({ complaint: id }),
      ComplaintMessage.deleteMany({ complaint: id }),
      Assignment.deleteMany({ complaint: id }),
      Complaint.findByIdAndDelete(id),
    ]);

    recordAudit({
      req,
      action: "COMPLAINT_DELETED",
      entityType: "Complaint",
      entityId: id,
      summary: `Complaint ${complaint?.referenceId || id} deleted`,
    });

    await refreshAnalyticsAfterComplaintChange(complaint);

    return res.json({ message: "Complaint deleted" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Delete failed" });
  }
}

async function listAssigned(req, res) {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!["Admin", "InvestigationOfficer", "User"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const filter =
      role === "Admin"
        ? {}
        : role === "User"
          ? { createdBy: userId }
          : { assignedTo: userId };
    const results = await Complaint.find(filter)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name unit")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ complaints: results });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "List assigned failed" });
  }
}

// Admin-only: aggregate complaint counts by city for regional analytics / heat map.
async function getCityStats(req, res) {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const rows = await Complaint.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$city", ""] },
          total: { $sum: 1 },
          open: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Pending", "In Review", "Under Investigation"]] },
                1,
                0,
              ],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0],
            },
          },
          highSeverity: {
            $sum: {
              $cond: [{ $in: ["$severity", ["High", "Critical"]] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const cities = rows.map((r) => ({
      city: r._id || "Unspecified",
      total: r.total,
      open: r.open,
      resolved: r.resolved,
      highSeverity: r.highSeverity,
    }));

    return res.json({ cities });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "City stats failed" });
  }
}

module.exports = {
  submitComplaint,
  searchComplaints,
  getStats,
  getCityStats,
  updateComplaintStatus,
  deleteComplaint,
  assignComplaint,
  respondToAssignment,
  listAssigned,
  getComplaintDetails,
};

