const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const Evidence = require("../models/Evidence");
const Assignment = require("../models/Assignment");
const ComplaintMessage = require("../models/ComplaintMessage");
const User = require("../models/User");
const { createNotification } = require("../utils/notify");
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
        complaint.statusHistory.push({ status, at: new Date(), by: userId });
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
  listAssigned,
};

