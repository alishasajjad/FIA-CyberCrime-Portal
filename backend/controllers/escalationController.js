const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const EscalationConfig = require("../models/EscalationConfig");
const EscalationLog = require("../models/EscalationLog");
const { createNotification } = require("../utils/notify");
const { runEscalationCycle } = require("../utils/escalationEngine");

const OPEN_STATUSES = ["Pending", "In Review", "Under Investigation"];
const isId = (id) => mongoose.Types.ObjectId.isValid(id);

async function getConfig(req, res) {
  try {
    const config = await EscalationConfig.getGlobal();
    return res.json({ config });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load config" });
  }
}

async function updateConfig(req, res) {
  try {
    const b = req.body || {};
    const config = await EscalationConfig.getGlobal();
    if (typeof b.enabled === "boolean") config.enabled = b.enabled;
    if (typeof b.autoReassign === "boolean") config.autoReassign = b.autoReassign;
    if (typeof b.notifyAdmins === "boolean") config.notifyAdmins = b.notifyAdmins;
    if (typeof b.notifyOfficers === "boolean") config.notifyOfficers = b.notifyOfficers;
    if (b.warnBeforeHours != null) config.warnBeforeHours = Math.max(0, Number(b.warnBeforeHours) || 0);
    if (b.reminderIntervalHours != null) config.reminderIntervalHours = Math.max(1, Number(b.reminderIntervalHours) || 24);
    if (b.maxLevel != null) config.maxLevel = Math.min(10, Math.max(1, Number(b.maxLevel) || 3));
    if (b.slaHours && typeof b.slaHours === "object") {
      ["Critical", "High", "Medium", "Low"].forEach((k) => {
        if (b.slaHours[k] != null) config.slaHours[k] = Math.max(1, Number(b.slaHours[k]) || config.slaHours[k]);
      });
    }
    if (b.triggers && typeof b.triggers === "object") {
      ["unassigned", "notUpdated", "inactive"].forEach((k) => {
        if (typeof b.triggers[k] === "boolean") config.triggers[k] = b.triggers[k];
      });
    }
    config.updatedBy = req.user.userId;
    await config.save();
    return res.json({ config });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to update config" });
  }
}

async function getQueue(req, res) {
  try {
    const cases = await Complaint.find({ escalated: true, status: { $in: OPEN_STATUSES } })
      .select("referenceId incidentType city severity status escalationLevel lastEscalatedAt assignedTo createdAt")
      .populate("assignedTo", "name unit")
      .sort({ escalationLevel: -1, lastEscalatedAt: -1 })
      .limit(200)
      .lean();
    return res.json({ cases });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load queue" });
  }
}

async function getLogs(req, res) {
  try {
    const { type, limit } = req.query || {};
    const filter = {};
    if (type) filter.type = type;
    const logs = await EscalationLog.find(filter)
      .populate("fromOfficer", "name")
      .populate("toOfficer", "name")
      .populate("by", "name")
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 300))
      .lean();
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load logs" });
  }
}

async function runNow(req, res) {
  try {
    const summary = await runEscalationCycle({ triggeredBy: req.user.userId });
    return res.json({ summary });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Run failed" });
  }
}

async function manualReassign(req, res) {
  try {
    const { complaintId } = req.params;
    const { officerId } = req.body || {};
    if (!isId(complaintId) || !isId(officerId)) {
      return res.status(400).json({ message: "Invalid complaint or officer id" });
    }
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    const officer = await User.findOne({
      _id: officerId,
      role: "InvestigationOfficer",
      isApprovedOfficer: true,
      status: "Active",
    });
    if (!officer) return res.status(400).json({ message: "Officer not eligible" });

    const from = complaint.assignedTo || null;
    complaint.assignedTo = officer._id;
    complaint.escalated = true;
    await complaint.save();

    await Assignment.updateOne(
      { complaint: complaint._id },
      { $set: { complaint: complaint._id, assignedTo: officer._id, status: "Assigned", notes: "Admin override reassignment" } },
      { upsert: true }
    );

    await EscalationLog.create({
      complaint: complaint._id, referenceId: complaint.referenceId,
      level: complaint.escalationLevel || 1, type: "AdminOverride",
      reason: "Manual reassignment by admin", severity: complaint.severity,
      fromOfficer: from, toOfficer: officer._id, adminOverride: true, by: req.user.userId,
      city: complaint.city, category: complaint.incidentType,
    });

    await createNotification({
      recipient: officer._id,
      title: "Case manually assigned to you",
      message: `Admin assigned escalated case ${complaint.referenceId} to you.`,
      type: "Assignment",
      meta: { complaintId: complaint._id },
    });

    return res.json({ complaint: { _id: complaint._id, assignedTo: officer._id } });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Reassignment failed" });
  }
}

async function getStats(req, res) {
  try {
    const [
      activeEscalations,
      totalEscalated,
      resolvedTotal,
      resolvedEscalated,
      byTypeAgg,
      trendAgg,
      byCityAgg,
      byCategoryAgg,
      byOfficerAgg,
      avgAfterAgg,
    ] = await Promise.all([
      Complaint.countDocuments({ escalated: true, status: { $in: OPEN_STATUSES } }),
      Complaint.countDocuments({ escalationLevel: { $gt: 0 } }),
      Complaint.countDocuments({ status: { $in: ["Resolved", "Closed"] } }),
      Complaint.countDocuments({ status: { $in: ["Resolved", "Closed"] }, escalationLevel: { $gt: 0 } }),
      EscalationLog.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      EscalationLog.aggregate([
        { $match: { type: "Triggered" } },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      EscalationLog.aggregate([
        { $match: { type: "Triggered" } },
        { $group: { _id: { $ifNull: ["$city", "Unspecified"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      EscalationLog.aggregate([
        { $match: { type: "Triggered" } },
        { $group: { _id: { $ifNull: ["$category", "Other"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      EscalationLog.aggregate([
        { $match: { type: "Reassigned", toOfficer: { $ne: null } } },
        { $group: { _id: "$toOfficer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "o" } },
        { $unwind: "$o" },
        { $project: { name: "$o.name", count: 1 } },
      ]),
      Complaint.aggregate([
        { $match: { escalationLevel: { $gt: 0 }, status: { $in: ["Resolved", "Closed"] }, resolvedAt: { $ne: null } } },
        { $group: { _id: null, avgHours: { $avg: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 3600000] } } } },
      ]),
    ]);

    const slaCompliance = resolvedTotal
      ? Number((((resolvedTotal - resolvedEscalated) / resolvedTotal) * 100).toFixed(1))
      : 100;
    const monthLabel = (d) => `${String(d._id.m).padStart(2, "0")}/${d._id.y}`;

    return res.json({
      activeEscalations,
      totalEscalated,
      slaCompliance,
      avgResolutionHoursAfterEscalation: avgAfterAgg[0]?.avgHours
        ? Number(avgAfterAgg[0].avgHours.toFixed(1))
        : null,
      byType: byTypeAgg.map((t) => ({ type: t._id, count: t.count })),
      trend: trendAgg.map((d) => ({ label: monthLabel(d), count: d.count })),
      byCity: byCityAgg.map((c) => ({ city: c._id, count: c.count })),
      byCategory: byCategoryAgg.map((c) => ({ category: c._id, count: c.count })),
      byOfficer: byOfficerAgg.map((o) => ({ name: o.name, count: o.count })),
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Stats failed" });
  }
}

module.exports = {
  getConfig,
  updateConfig,
  getQueue,
  getLogs,
  runNow,
  manualReassign,
  getStats,
};
