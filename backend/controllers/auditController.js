const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Admin-only: paginated, filterable view of the persistent audit trail.
async function listAuditLogs(req, res) {
  try {
    const { q, action, entityType, actor, from, to } = req.query || {};
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(2000, Math.max(1, Number(req.query.limit) || 25));

    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actor && mongoose.Types.ObjectId.isValid(actor)) {
      filter.actor = new mongoose.Types.ObjectId(actor);
    }
    if (from || to) {
      filter.createdAt = {};
      if (from && !Number.isNaN(new Date(from).getTime())) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to && !Number.isNaN(new Date(to).getTime())) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [{ summary: rx }, { actorName: rx }, { action: rx }];
    }

    const [logs, total, actions, entityTypes] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
      AuditLog.distinct("action"),
      AuditLog.distinct("entityType"),
    ]);

    return res.json({
      logs,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      facets: {
        actions: actions.filter(Boolean).sort(),
        entityTypes: entityTypes.filter(Boolean).sort(),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load audit logs" });
  }
}

module.exports = { listAuditLogs };
