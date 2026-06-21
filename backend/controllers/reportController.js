const mongoose = require("mongoose");
const {
  getAdminAnalytics,
  getUserAnalytics,
} = require("../utils/analyticsStore");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Evidence = require("../models/Evidence");
const ComplaintMessage = require("../models/ComplaintMessage");
const OfficerApprovalLog = require("../models/OfficerApprovalLog");
const Notification = require("../models/Notification");
const Session = require("../models/Session");
const EscalationLog = require("../models/EscalationLog");
const memoryCache = require("../utils/memoryCache");

// SLA targets (hours) by severity — used for escalation/overdue detection.
const SLA_HOURS = { Critical: 24, High: 48, Medium: 96, Low: 168 };
const OPEN_STATUSES = ["Pending", "In Review", "Under Investigation"];

async function getReportSummary(req, res) {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    const forceRefresh = String(req.query?.refresh || "").toLowerCase() === "true";

    let doc;
    if (role === "Admin") {
      doc = await getAdminAnalytics({ forceRefresh });
    } else if (role === "User" || role === "InvestigationOfficer") {
      doc = await getUserAnalytics({ userId, role, forceRefresh });
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Keep response backward-compatible while adding richer payload.
    return res.json({
      monthly: doc.monthlyCounts || [],
      yearly: doc.yearlyCounts || [],
      category: doc.categoryStats || [],
      pieChartData: doc.pieChartData || [],
      statusSummary: doc.statusSummary || [],
      totalComplaints: doc.totalComplaints || 0,
      generatedAt: doc.generatedAt || null,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to generate reports" });
  }
}

async function getAdminAnalyticsSummary(req, res) {
  try {
    const forceRefresh = String(req.query?.refresh || "").toLowerCase() === "true";
    const doc = await getAdminAnalytics({ forceRefresh });
    return res.json({
      totalComplaints: doc.totalComplaints || 0,
      monthly: doc.monthlyCounts || [],
      yearly: doc.yearlyCounts || [],
      category: doc.categoryStats || [],
      pieChartData: doc.pieChartData || [],
      statusSummary: doc.statusSummary || [],
      generatedAt: doc.generatedAt || null,
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to fetch admin analytics" });
  }
}

async function getUserAnalyticsSummary(req, res) {
  try {
    const forceRefresh = String(req.query?.refresh || "").toLowerCase() === "true";
    const doc = await getUserAnalytics({
      userId: req.user.userId,
      role: req.user.role,
      forceRefresh,
    });
    return res.json({
      totalComplaints: doc.totalComplaints || 0,
      monthly: doc.monthlyCounts || [],
      yearly: doc.yearlyCounts || [],
      category: doc.categoryStats || [],
      pieChartData: doc.pieChartData || [],
      statusSummary: doc.statusSummary || [],
      generatedAt: doc.generatedAt || null,
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to fetch user analytics" });
  }
}

// ------------------------------------------------------------------
//  Phase 2 — Admin operations dashboards (additive, read-only)
// ------------------------------------------------------------------

// System Health: platform-wide operational summary.
async function getSystemHealth(req, res) {
  try {
    const [
      totalComplaints,
      pendingCases,
      resolvedCases,
      highSeverity,
      byStatusAgg,
      bySeverityAgg,
      byMonthAgg,
      userRoleAgg,
      activeUsers,
      totalNotifications,
      unreadNotifications,
    ] = await Promise.all([
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: { $in: OPEN_STATUSES } }),
      Complaint.countDocuments({ status: { $in: ["Resolved", "Closed"] } }),
      Complaint.countDocuments({
        severity: { $in: ["High", "Critical"] },
        status: { $nin: ["Resolved", "Closed"] },
      }),
      Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
      Complaint.aggregate([
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      User.countDocuments({ status: "Active" }),
      Notification.countDocuments({}),
      Notification.countDocuments({ read: false }),
    ]);

    const roleMap = {};
    userRoleAgg.forEach((r) => (roleMap[r._id] = r.count));
    const activeOfficers = await User.countDocuments({
      role: "InvestigationOfficer",
      isApprovedOfficer: true,
      status: "Active",
    });
    const assignedOpen = await Complaint.countDocuments({
      assignedTo: { $ne: null },
      status: { $in: OPEN_STATUSES },
    });

    const months = byMonthAgg.slice(-6).map((d) => ({
      label: `${String(d._id.m).padStart(2, "0")}/${d._id.y}`,
      count: d.count,
    }));

    // --- Phase C: production-style health signals (read-only, safe) ---
    const now = new Date();
    const since = (ms) => new Date(Date.now() - ms);
    const [
      throughput24h,
      throughput7d,
      throughput30d,
      evidenceAgg,
      userGrowthAgg,
      activeSessions,
      onlineOfficersAgg,
      officerWorkloadAgg,
    ] = await Promise.all([
      Complaint.countDocuments({ createdAt: { $gte: since(864e5) } }),
      Complaint.countDocuments({ createdAt: { $gte: since(7 * 864e5) } }),
      Complaint.countDocuments({ createdAt: { $gte: since(30 * 864e5) } }),
      Evidence.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, bytes: { $sum: "$size" } } },
      ]),
      User.aggregate([
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      Session.countDocuments({
        $or: [{ revokedAt: null }, { revokedAt: { $exists: false } }],
        expiresAt: { $gt: now },
      }),
      Session.aggregate([
        { $match: { $or: [{ revokedAt: null }, { revokedAt: { $exists: false } }], expiresAt: { $gt: now } } },
        { $group: { _id: "$user" } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } },
        { $unwind: "$u" },
        { $match: { "u.role": "InvestigationOfficer" } },
        { $count: "n" },
      ]),
      Complaint.aggregate([
        { $match: { assignedTo: { $ne: null }, status: { $in: OPEN_STATUSES } } },
        { $group: { _id: "$assignedTo", open: { $sum: 1 } } },
        { $sort: { open: -1 } },
        { $limit: 8 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "officer" } },
        { $unwind: "$officer" },
        { $project: { name: "$officer.name", unit: "$officer.unit", open: 1 } },
      ]),
    ]);

    const evidence = evidenceAgg[0] || { count: 0, bytes: 0 };
    const userGrowth = userGrowthAgg.slice(-6).map((d) => ({
      label: `${String(d._id.m).padStart(2, "0")}/${d._id.y}`,
      count: d.count,
    }));
    const dbStateNum = mongoose.connection.readyState;
    const dbLabel =
      ["disconnected", "connected", "connecting", "disconnecting"][dbStateNum] || "unknown";

    // Escalation health (additive).
    const [escalatedOpen, resolvedEscalated] = await Promise.all([
      Complaint.countDocuments({ escalated: true, status: { $in: OPEN_STATUSES } }),
      Complaint.countDocuments({ status: { $in: ["Resolved", "Closed"] }, escalationLevel: { $gt: 0 } }),
    ]);
    const slaCompliance = resolvedCases
      ? Number((((resolvedCases - resolvedEscalated) / resolvedCases) * 100).toFixed(1))
      : 100;

    return res.json({
      totals: {
        totalComplaints,
        pendingCases,
        resolvedCases,
        highSeverity,
        totalUsers: Object.values(roleMap).reduce((a, b) => a + b, 0),
        activeUsers,
      },
      byStatus: byStatusAgg.map((s) => ({ status: s._id || "Unknown", count: s.count })),
      bySeverity: bySeverityAgg.map((s) => ({ severity: s._id || "Unknown", count: s.count })),
      byMonth: months,
      users: {
        admins: roleMap.Admin || 0,
        officers: roleMap.InvestigationOfficer || 0,
        pendingOfficers: roleMap.PendingOfficer || 0,
        users: roleMap.User || 0,
      },
      officerUtilization: {
        activeOfficers,
        assignedOpenCases: assignedOpen,
        avgOpenPerOfficer: activeOfficers ? Number((assignedOpen / activeOfficers).toFixed(1)) : 0,
      },
      notifications: { total: totalNotifications, unread: unreadNotifications },
      resolutionRate: totalComplaints
        ? Number(((resolvedCases / totalComplaints) * 100).toFixed(1))
        : 0,
      // --- Phase C additive fields (backward compatible) ---
      app: {
        uptimeSec: Math.floor(process.uptime()),
        nodeEnv: process.env.NODE_ENV || "development",
      },
      db: { state: dbStateNum, label: dbLabel },
      throughput: { last24h: throughput24h, last7d: throughput7d, last30d: throughput30d },
      sessions: { active: activeSessions, onlineOfficers: onlineOfficersAgg[0]?.n || 0 },
      uploads: { evidenceCount: evidence.count, totalBytes: evidence.bytes || 0 },
      userGrowth,
      officerWorkload: officerWorkloadAgg.map((o) => ({
        name: o.name,
        unit: o.unit || "—",
        open: o.open,
      })),
      escalation: { active: escalatedOpen, slaCompliance },
      meta: {
        actual: [
          "complaints",
          "users",
          "officers",
          "notifications",
          "uploads",
          "activeSessions",
          "dbStatus",
          "uptime",
          "throughput",
          "escalations",
        ],
        estimated: ["onlineOfficers (derived from active sessions)"],
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "System health failed" });
  }
}

// Officer Performance: per-officer productivity metrics.
async function getOfficerPerformance(req, res) {
  try {
    const officers = await User.find(
      { role: "InvestigationOfficer" },
      { name: 1, email: 1, unit: 1, status: 1, isApprovedOfficer: 1 }
    ).lean();

    const perf = await Promise.all(
      officers.map(async (o) => {
        const cases = await Complaint.find(
          { assignedTo: o._id },
          { status: 1, severity: 1, createdAt: 1, resolvedAt: 1 }
        ).lean();
        const assigned = cases.length;
        const resolved = cases.filter((c) =>
          ["Resolved", "Closed"].includes(c.status)
        ).length;
        const active = cases.filter((c) => OPEN_STATUSES.includes(c.status)).length;

        const resolvedWithTimes = cases.filter(
          (c) => c.resolvedAt && c.createdAt
        );
        const avgResponseHours = resolvedWithTimes.length
          ? Number(
              (
                resolvedWithTimes.reduce(
                  (sum, c) =>
                    sum + (new Date(c.resolvedAt) - new Date(c.createdAt)) / 36e5,
                  0
                ) / resolvedWithTimes.length
              ).toFixed(1)
            )
          : null;

        return {
          id: o._id,
          name: o.name,
          unit: o.unit || "—",
          status: o.status,
          approved: !!o.isApprovedOfficer,
          assigned,
          resolved,
          active,
          avgResponseHours,
          resolutionRate: assigned ? Number(((resolved / assigned) * 100).toFixed(0)) : 0,
        };
      })
    );

    perf.sort((a, b) => b.resolved - a.resolved || b.resolutionRate - a.resolutionRate);
    return res.json({ officers: perf });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Officer performance failed" });
  }
}

// Escalations: open cases with age + SLA/overdue status.
async function getEscalations(req, res) {
  try {
    const open = await Complaint.find(
      { status: { $in: OPEN_STATUSES } },
      {
        referenceId: 1,
        incidentType: 1,
        city: 1,
        severity: 1,
        status: 1,
        createdAt: 1,
        assignedTo: 1,
      }
    )
      .populate("assignedTo", "name unit")
      .sort({ createdAt: 1 })
      .lean();

    const now = Date.now();
    const cases = open.map((c) => {
      const ageHours = Math.max(0, (now - new Date(c.createdAt)) / 36e5);
      const sla = SLA_HOURS[c.severity] || SLA_HOURS.Low;
      const pct = Math.min(100, Math.round((ageHours / sla) * 100));
      return {
        id: c._id,
        referenceId: c.referenceId,
        incidentType: c.incidentType,
        city: c.city || "Unspecified",
        severity: c.severity,
        status: c.status,
        createdAt: c.createdAt,
        assignedTo: c.assignedTo ? c.assignedTo.name : null,
        ageHours: Number(ageHours.toFixed(1)),
        slaHours: sla,
        slaUsedPct: pct,
        overdue: ageHours > sla,
        unassigned: !c.assignedTo,
      };
    });

    cases.sort((a, b) => b.slaUsedPct - a.slaUsedPct);
    return res.json({ slaHours: SLA_HOURS, cases });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Escalations failed" });
  }
}

// Audit Log: unified chronological feed of real platform events.
async function getAuditLog(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 150, 400);
    const per = 60;

    const [users, complaints, assignments, evidence, messages, approvals, escalations] =
      await Promise.all([
        User.find({}, { name: 1, email: 1, role: 1, createdAt: 1 })
          .sort({ createdAt: -1 })
          .limit(per)
          .lean(),
        Complaint.find(
          {},
          { referenceId: 1, incidentType: 1, city: 1, status: 1, createdAt: 1, resolvedAt: 1 }
        )
          .sort({ createdAt: -1 })
          .limit(per)
          .lean(),
        Assignment.find({})
          .populate("assignedTo", "name")
          .populate("complaint", "referenceId")
          .sort({ updatedAt: -1 })
          .limit(per)
          .lean(),
        Evidence.find({}, { originalName: 1, complaint: 1, createdAt: 1 })
          .populate("complaint", "referenceId")
          .sort({ createdAt: -1 })
          .limit(per)
          .lean(),
        ComplaintMessage.find({}, { senderRole: 1, complaint: 1, createdAt: 1 })
          .populate("complaint", "referenceId")
          .sort({ createdAt: -1 })
          .limit(per)
          .lean(),
        OfficerApprovalLog.find({})
          .populate("officer", "name")
          .sort({ createdAt: -1 })
          .limit(per)
          .lean(),
        EscalationLog.find({})
          .populate("toOfficer", "name")
          .sort({ createdAt: -1 })
          .limit(per)
          .lean(),
      ]);

    const events = [];

    users.forEach((u) =>
      events.push({
        ts: u.createdAt,
        type: "Registration",
        actor: u.name || u.email,
        summary: `${u.role} account registered`,
        ref: u.email,
      })
    );
    complaints.forEach((c) => {
      events.push({
        ts: c.createdAt,
        type: "Complaint",
        actor: "Citizen",
        summary: `Complaint submitted — ${c.incidentType}${c.city ? ` (${c.city})` : ""}`,
        ref: c.referenceId,
      });
      if (c.resolvedAt)
        events.push({
          ts: c.resolvedAt,
          type: "Resolution",
          actor: "System",
          summary: `Complaint marked ${c.status}`,
          ref: c.referenceId,
        });
    });
    assignments.forEach((a) =>
      events.push({
        ts: a.updatedAt || a.createdAt,
        type: "Assignment",
        actor: a.assignedTo?.name || "Officer",
        summary: `Case assigned to ${a.assignedTo?.name || "officer"} (${a.status})`,
        ref: a.complaint?.referenceId || "",
      })
    );
    evidence.forEach((e) =>
      events.push({
        ts: e.createdAt,
        type: "Evidence",
        actor: "Uploader",
        summary: `Evidence "${e.originalName}" uploaded`,
        ref: e.complaint?.referenceId || "",
      })
    );
    messages.forEach((m) =>
      events.push({
        ts: m.createdAt,
        type: "Message",
        actor: m.senderRole || "Participant",
        summary: `${m.senderRole || "Participant"} posted a message`,
        ref: m.complaint?.referenceId || "",
      })
    );
    approvals.forEach((a) =>
      events.push({
        ts: a.createdAt,
        type: "Account",
        actor: a.officer?.name || "Officer",
        summary: `Officer enrollment ${a.action}`,
        ref: "",
      })
    );
    escalations.forEach((e) =>
      events.push({
        ts: e.createdAt,
        type: "Escalation",
        actor: e.adminOverride ? "Admin" : "Escalation Engine",
        summary: `${e.type}${e.level ? ` (L${e.level})` : ""}${e.reason ? ` — ${e.reason}` : ""}${e.toOfficer?.name ? ` → ${e.toOfficer.name}` : ""}`,
        ref: e.referenceId || "",
      })
    );

    events.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return res.json({ events: events.slice(0, limit) });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Audit log failed" });
  }
}

// ------------------------------------------------------------------
//  Phase C — Advanced filtered analytics (single source of truth)
// ------------------------------------------------------------------
async function getAdvancedAnalytics(req, res) {
  try {
    const { from, to, city, category, officer, status, department } = req.query || {};

    // Cache by the exact filter set (short TTL — read-heavy dashboard).
    const cacheKey = `analytics:${JSON.stringify({ from, to, city, category, officer, status, department })}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return res.json(cached);

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from && !Number.isNaN(new Date(from).getTime())) match.createdAt.$gte = new Date(from);
      if (to && !Number.isNaN(new Date(to).getTime())) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }
    if (city) match.city = city;
    if (category) match.incidentType = category;
    if (status) match.status = status;
    if (department) match.department = department;
    if (officer && mongoose.Types.ObjectId.isValid(officer)) {
      match.assignedTo = new mongoose.Types.ObjectId(officer);
    }

    const now = new Date();
    const groupCount = (field) => [
      { $match: match },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const [
      total,
      byCityAgg,
      byCategoryAgg,
      byDepartmentAgg,
      bySeverityAgg,
      byStatusAgg,
      byMonthAgg,
      pendingCount,
      resolvedCount,
      officerCompAgg,
      overdueAgg,
      severityTrendAgg,
      notifByTypeAgg,
      notifByMonthAgg,
      cities,
      categories,
      departments,
      officers,
    ] = await Promise.all([
      Complaint.countDocuments(match),
      Complaint.aggregate(groupCount("city")),
      Complaint.aggregate(groupCount("incidentType")),
      Complaint.aggregate(groupCount("department")),
      Complaint.aggregate(groupCount("severity")),
      Complaint.aggregate(groupCount("status")),
      Complaint.aggregate([
        { $match: match },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      Complaint.countDocuments({ ...match, status: { $in: OPEN_STATUSES } }),
      Complaint.countDocuments({ ...match, status: { $in: ["Resolved", "Closed"] } }),
      Complaint.aggregate([
        { $match: { ...match, assignedTo: { $ne: null } } },
        {
          $group: {
            _id: "$assignedTo",
            assigned: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0] } },
          },
        },
        { $sort: { assigned: -1 } },
        { $limit: 12 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "officer" } },
        { $unwind: "$officer" },
        { $project: { name: "$officer.name", unit: "$officer.unit", assigned: 1, resolved: 1 } },
      ]),
      Complaint.aggregate([
        { $match: { ...match, status: { $in: OPEN_STATUSES } } },
        {
          $addFields: {
            ageHours: { $divide: [{ $subtract: [now, "$createdAt"] }, 3600000] },
            sla: {
              $switch: {
                branches: [
                  { case: { $eq: ["$severity", "Critical"] }, then: SLA_HOURS.Critical },
                  { case: { $eq: ["$severity", "High"] }, then: SLA_HOURS.High },
                  { case: { $eq: ["$severity", "Medium"] }, then: SLA_HOURS.Medium },
                ],
                default: SLA_HOURS.Low,
              },
            },
          },
        },
        { $match: { $expr: { $gt: ["$ageHours", "$sla"] } } },
        { $count: "n" },
      ]),
      Complaint.aggregate([
        { $match: { ...match, severity: { $in: ["High", "Critical"] } } },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      Notification.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Notification.aggregate([
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      Complaint.distinct("city"),
      Complaint.distinct("incidentType"),
      Complaint.distinct("department"),
      User.find({ role: "InvestigationOfficer" }, { name: 1, unit: 1 }).lean(),
    ]);

    const monthLabel = (d) => `${String(d._id.m).padStart(2, "0")}/${d._id.y}`;
    const officerComparison = officerCompAgg.map((o) => ({
      name: o.name,
      unit: o.unit || "—",
      assigned: o.assigned,
      resolved: o.resolved,
      resolutionRate: o.assigned ? Number(((o.resolved / o.assigned) * 100).toFixed(0)) : 0,
    }));

    const payload = {
      total,
      byCity: byCityAgg.map((c) => ({ city: c._id || "Unspecified", count: c.count })),
      byCategory: byCategoryAgg.map((c) => ({ category: c._id || "Other", count: c.count })),
      byDepartment: byDepartmentAgg.map((c) => ({ department: c._id || "Unassigned", count: c.count })),
      bySeverity: bySeverityAgg.map((c) => ({ severity: c._id || "Unknown", count: c.count })),
      byStatus: byStatusAgg.map((c) => ({ status: c._id || "Unknown", count: c.count })),
      byMonth: byMonthAgg.map((d) => ({ label: monthLabel(d), count: d.count })),
      pendingVsResolved: { pending: pendingCount, resolved: resolvedCount },
      resolutionRate: total ? Number(((resolvedCount / total) * 100).toFixed(1)) : 0,
      officerComparison,
      escalations: {
        overdue: overdueAgg[0]?.n || 0,
        trend: severityTrendAgg.map((d) => ({ label: monthLabel(d), count: d.count })),
      },
      notifications: {
        byType: notifByTypeAgg.map((n) => ({ type: n._id || "System", count: n.count })),
        byMonth: notifByMonthAgg.map((d) => ({ label: monthLabel(d), count: d.count })),
      },
      filterOptions: {
        cities: cities.filter(Boolean).sort(),
        categories: categories.filter(Boolean).sort(),
        departments: departments.filter(Boolean).sort(),
        statuses: ["Pending", "In Review", "Under Investigation", "Resolved", "Closed"],
        officers: officers.map((o) => ({ id: o._id, name: o.name, unit: o.unit || "" })),
      },
      generatedAt: new Date().toISOString(),
    };

    memoryCache.set(cacheKey, payload, 30000);
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Advanced analytics failed" });
  }
}

module.exports = {
  getReportSummary,
  getAdminAnalyticsSummary,
  getUserAnalyticsSummary,
  getSystemHealth,
  getOfficerPerformance,
  getEscalations,
  getAuditLog,
  getAdvancedAnalytics,
};
