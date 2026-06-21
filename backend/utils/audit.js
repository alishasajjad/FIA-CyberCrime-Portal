const AuditLog = require("../models/AuditLog");
const { emitToRole } = require("./realtime");

/**
 * Record an audit-trail entry. Best-effort and fully isolated — it must never
 * throw or block the request flow it is observing.
 *
 * @param {object} opts
 * @param {object} [opts.req] Express request (used to derive actor + ip).
 * @param {string} opts.action Canonical action string (see AuditLog model).
 * @param {string} [opts.entityType]
 * @param {*} [opts.entityId]
 * @param {*} [opts.complaint] Complaint id for complaint-scoped history.
 * @param {string} [opts.summary]
 * @param {object} [opts.meta]
 * @param {*} [opts.actor] Explicit actor id (overrides req.user).
 * @param {string} [opts.actorName]
 * @param {string} [opts.actorRole]
 */
async function recordAudit(opts = {}) {
  try {
    const { req } = opts;
    const ip =
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      "";

    const log = await AuditLog.create({
      action: opts.action,
      entityType: opts.entityType || "System",
      entityId: opts.entityId || undefined,
      complaint: opts.complaint || undefined,
      actor: opts.actor || req?.user?.userId || undefined,
      actorName: opts.actorName || req?.user?.name || "",
      actorRole: opts.actorRole || req?.user?.role || "",
      summary: opts.summary || "",
      meta: opts.meta || {},
      ip,
    });

    // Live admin audit feed.
    emitToRole("Admin", "audit:new", {
      log: {
        _id: log._id,
        action: log.action,
        entityType: log.entityType,
        actorName: log.actorName,
        actorRole: log.actorRole,
        summary: log.summary,
        createdAt: log.createdAt,
      },
    });
  } catch {
    // Auditing must never break the action being audited.
  }
}

module.exports = { recordAudit };
