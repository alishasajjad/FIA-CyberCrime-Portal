const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const AdminAnalytics = require("../models/AdminAnalytics");
const UserAnalytics = require("../models/UserAnalytics");

function matchForRole(role, userId) {
  if (role === "Admin") return {};
  if (role === "User") return { createdBy: new mongoose.Types.ObjectId(userId) };
  if (role === "InvestigationOfficer") {
    return { assignedTo: new mongoose.Types.ObjectId(userId) };
  }
  return { _id: null };
}

async function computeSourceFingerprint(match) {
  const row = await Complaint.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        maxUpdatedAt: { $max: "$updatedAt" },
      },
    },
  ]);
  if (!row.length) return { sourceCount: 0, sourceMaxUpdatedAt: null };
  return {
    sourceCount: row[0].count || 0,
    sourceMaxUpdatedAt: row[0].maxUpdatedAt || null,
  };
}

async function computeAnalyticsPayload(match) {
  const [monthly, yearly, category, status, total] = await Promise.all([
    Complaint.aggregate([
      { $match: match },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": -1, "_id.m": -1 } },
      { $limit: 24 },
    ]),
    Complaint.aggregate([
      { $match: match },
      {
        $group: {
          _id: { y: { $year: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": -1 } },
      { $limit: 10 },
    ]),
    Complaint.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$incidentType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    Complaint.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Complaint.countDocuments(match),
  ]);

  const monthlyCounts = monthly.map((x) => ({
    year: x._id.y,
    month: x._id.m,
    label: `${x._id.y}-${String(x._id.m).padStart(2, "0")}`,
    count: x.count,
  }));
  const yearlyCounts = yearly.map((x) => ({
    year: x._id.y,
    label: String(x._id.y),
    count: x.count,
  }));
  const categoryStats = category.map((x) => ({
    label: x._id || "Unknown",
    count: x.count,
  }));
  const statusSummary = status.map((x) => ({
    label: x._id || "Unknown",
    count: x.count,
  }));

  // Pie chart uses category distribution.
  const pieChartData = categoryStats;

  return {
    totalComplaints: total,
    monthlyCounts,
    yearlyCounts,
    categoryStats,
    pieChartData,
    statusSummary,
  };
}

function isSameFingerprint(doc, fp) {
  const docMax = doc?.sourceMaxUpdatedAt
    ? new Date(doc.sourceMaxUpdatedAt).getTime()
    : null;
  const fpMax = fp?.sourceMaxUpdatedAt ? new Date(fp.sourceMaxUpdatedAt).getTime() : null;
  return doc?.sourceCount === fp.sourceCount && docMax === fpMax;
}

async function getAdminAnalytics({ forceRefresh = false } = {}) {
  const scopeKey = "global";
  const match = {};
  const fingerprint = await computeSourceFingerprint(match);

  const existing = await AdminAnalytics.findOne({ scopeKey });
  if (!forceRefresh && existing && isSameFingerprint(existing, fingerprint)) {
    return existing;
  }

  const computed = await computeAnalyticsPayload(match);
  const updated = await AdminAnalytics.findOneAndUpdate(
    { scopeKey },
    {
      $set: {
        ...computed,
        sourceCount: fingerprint.sourceCount,
        sourceMaxUpdatedAt: fingerprint.sourceMaxUpdatedAt,
        generatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  return updated;
}

async function getUserAnalytics({ userId, role, forceRefresh = false }) {
  const match = matchForRole(role, userId);
  const fingerprint = await computeSourceFingerprint(match);

  const existing = await UserAnalytics.findOne({ user: userId, scopeRole: role });
  if (!forceRefresh && existing && isSameFingerprint(existing, fingerprint)) {
    return existing;
  }

  const computed = await computeAnalyticsPayload(match);
  const updated = await UserAnalytics.findOneAndUpdate(
    { user: userId, scopeRole: role },
    {
      $set: {
        user: userId,
        scopeRole: role,
        ...computed,
        sourceCount: fingerprint.sourceCount,
        sourceMaxUpdatedAt: fingerprint.sourceMaxUpdatedAt,
        generatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  return updated;
}

async function refreshAnalyticsForRoles(userId, role) {
  if (!userId || !role || role === "Admin") return;
  try {
    await getUserAnalytics({ userId, role, forceRefresh: true });
  } catch {
    // Best-effort cache refresh; ignore failures.
  }
}

module.exports = {
  getAdminAnalytics,
  getUserAnalytics,
  refreshAnalyticsForRoles,
};

