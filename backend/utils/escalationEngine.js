const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const EscalationConfig = require("../models/EscalationConfig");
const EscalationLog = require("../models/EscalationLog");
const { createNotification } = require("./notify");

const OPEN_STATUSES = ["Pending", "In Review", "Under Investigation"];
const DEFAULT_SLA = { Critical: 24, High: 48, Medium: 96, Low: 168 };

let running = false;

function hoursSince(date) {
  if (!date) return Infinity;
  return (Date.now() - new Date(date).getTime()) / 3600000;
}

// Build a ranked pool of eligible "senior" officers. Seniority is proxied by
// resolved-case volume (experience); ties broken by lighter current workload.
async function buildOfficerPool() {
  const [officers, resolvedAgg, openAgg] = await Promise.all([
    User.find(
      { role: "InvestigationOfficer", isApprovedOfficer: true, status: "Active" },
      { name: 1, unit: 1 }
    ).lean(),
    Complaint.aggregate([
      { $match: { assignedTo: { $ne: null }, status: { $in: ["Resolved", "Closed"] } } },
      { $group: { _id: "$assignedTo", c: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: { assignedTo: { $ne: null }, status: { $in: OPEN_STATUSES } } },
      { $group: { _id: "$assignedTo", c: { $sum: 1 } } },
    ]),
  ]);
  const resolved = {};
  resolvedAgg.forEach((r) => (resolved[String(r._id)] = r.c));
  const open = {};
  openAgg.forEach((r) => (open[String(r._id)] = r.c));
  return officers.map((o) => ({
    id: o._id,
    name: o.name,
    unit: o.unit || "",
    resolved: resolved[String(o._id)] || 0,
    open: open[String(o._id)] || 0,
  }));
}

function pickSeniorOfficer(pool, complaint) {
  const currentId = complaint.assignedTo ? String(complaint.assignedTo) : null;
  const dept = String(complaint.department || "").trim().toLowerCase();
  const eligible = pool.filter((o) => String(o.id) !== currentId);
  if (eligible.length === 0) return null;
  const sameDept = dept ? eligible.filter((o) => o.unit.trim().toLowerCase() === dept) : [];
  const candidates = sameDept.length > 0 ? sameDept : eligible;
  // Most experienced first, then least loaded.
  candidates.sort((a, b) => b.resolved - a.resolved || a.open - b.open);
  return candidates[0];
}

async function notifyAdmins(title, message, meta) {
  const admins = await User.find({ role: "Admin" }, { _id: 1 }).lean();
  await Promise.all(
    admins.map((a) =>
      createNotification({ recipient: a._id, title, message, type: "Status", meta })
    )
  );
}

// Core cycle — evaluates open complaints against SLA config and escalates.
async function runEscalationCycle(options = {}) {
  if (running) return { skipped: true, reason: "already-running" };
  running = true;
  const summary = { processed: 0, escalated: 0, reassigned: 0, queued: 0, warned: 0 };
  try {
    const config = await EscalationConfig.getGlobal();
    if (!config.enabled) {
      return { skipped: true, reason: "disabled" };
    }
    const sla = { ...DEFAULT_SLA, ...(config.slaHours || {}) };
    const trig = config.triggers || { unassigned: true, notUpdated: true, inactive: true };

    const open = await Complaint.find({ status: { $in: OPEN_STATUSES } })
      .select("referenceId severity department assignedTo createdAt updatedAt escalationLevel lastEscalatedAt slaWarnedAt city incidentType status")
      .limit(2000);

    if (open.length === 0) return summary;
    const pool = await buildOfficerPool();

    for (const c of open) {
      summary.processed += 1;
      const slaHours = sla[c.severity] || DEFAULT_SLA.Low;
      const ageHours = hoursSince(c.createdAt);
      const updatedAge = hoursSince(c.updatedAt);

      const unassignedBreach = !c.assignedTo && ageHours > slaHours;
      const notUpdatedBreach = updatedAge > slaHours;
      const inactiveBreach = !!c.assignedTo && updatedAge > slaHours;

      const qualifies =
        (trig.unassigned && unassignedBreach) ||
        (trig.notUpdated && notUpdatedBreach) ||
        (trig.inactive && inactiveBreach);

      // SLA warning (approaching) — fired once per complaint.
      if (!qualifies && !c.slaWarnedAt && ageHours > slaHours - (config.warnBeforeHours || 6)) {
        c.slaWarnedAt = new Date();
        await c.save();
        await EscalationLog.create({
          complaint: c._id, referenceId: c.referenceId, level: c.escalationLevel || 0,
          type: "Warning", reason: "SLA deadline approaching", severity: c.severity,
          slaHours, ageHours: Number(ageHours.toFixed(1)), city: c.city, category: c.incidentType,
        });
        if (config.notifyOfficers && c.assignedTo) {
          await createNotification({
            recipient: c.assignedTo, title: "SLA warning approaching",
            message: `Case ${c.referenceId} is approaching its ${slaHours}h SLA deadline.`,
            type: "Status", meta: { complaintId: c._id, slaHours },
          });
        }
        summary.warned += 1;
        continue;
      }

      if (!qualifies) continue;
      if ((c.escalationLevel || 0) >= (config.maxLevel || 3)) continue;
      // Respect reminder interval between escalations of the same case.
      if (c.lastEscalatedAt && hoursSince(c.lastEscalatedAt) < (config.reminderIntervalHours || 24)) {
        continue;
      }

      const newLevel = (c.escalationLevel || 0) + 1;
      const reason = unassignedBreach
        ? "Unassigned beyond SLA"
        : inactiveBreach
        ? "Investigation inactive beyond SLA"
        : "Not updated beyond SLA";
      const prevOfficer = c.assignedTo || null;

      // Triggered log (records the SLA violation details).
      await EscalationLog.create({
        complaint: c._id, referenceId: c.referenceId, level: newLevel, type: "Triggered",
        reason, severity: c.severity, slaHours, ageHours: Number(ageHours.toFixed(1)),
        fromOfficer: prevOfficer, city: c.city, category: c.incidentType,
      });

      let reassignedTo = null;
      if (config.autoReassign) {
        const senior = pickSeniorOfficer(pool, c);
        if (senior) {
          c.assignedTo = senior.id;
          reassignedTo = senior;
          await Assignment.updateOne(
            { complaint: c._id },
            { $set: { complaint: c._id, assignedTo: senior.id, status: "Assigned", notes: `Auto-escalation L${newLevel}: ${reason}` } },
            { upsert: true }
          );
          await EscalationLog.create({
            complaint: c._id, referenceId: c.referenceId, level: newLevel, type: "Reassigned",
            reason, severity: c.severity, slaHours, ageHours: Number(ageHours.toFixed(1)),
            fromOfficer: prevOfficer, toOfficer: senior.id, city: c.city, category: c.incidentType,
          });
          // reflect in officer pool load so the same cycle balances further picks
          senior.open += 1;
          summary.reassigned += 1;
          if (config.notifyOfficers) {
            await createNotification({
              recipient: senior.id, title: "Escalation reassigned to you",
              message: `Escalated case ${c.referenceId} (L${newLevel}, ${c.severity}) assigned to you: ${reason}.`,
              type: "Assignment", meta: { complaintId: c._id, level: newLevel },
            });
          }
        } else {
          await EscalationLog.create({
            complaint: c._id, referenceId: c.referenceId, level: newLevel, type: "Queued",
            reason: `${reason} (no eligible senior officer)`, severity: c.severity, slaHours,
            ageHours: Number(ageHours.toFixed(1)), fromOfficer: prevOfficer, city: c.city, category: c.incidentType,
          });
          summary.queued += 1;
        }
      } else {
        await EscalationLog.create({
          complaint: c._id, referenceId: c.referenceId, level: newLevel, type: "Queued",
          reason: `${reason} (auto-reassign disabled)`, severity: c.severity, slaHours,
          ageHours: Number(ageHours.toFixed(1)), fromOfficer: prevOfficer, city: c.city, category: c.incidentType,
        });
        summary.queued += 1;
      }

      c.escalated = true;
      c.escalationLevel = newLevel;
      c.lastEscalatedAt = new Date();
      await c.save();
      summary.escalated += 1;

      if (config.notifyAdmins) {
        await notifyAdmins(
          "SLA violation — complaint escalated",
          `Case ${c.referenceId} (${c.severity}) escalated to L${newLevel}: ${reason}.${reassignedTo ? ` Reassigned to ${reassignedTo.name}.` : " Placed in escalation queue."}`,
          { complaintId: c._id, level: newLevel, reason }
        );
      }
    }

    return summary;
  } catch (err) {
    console.error("[Escalation] cycle error:", err?.message || err);
    return { error: err?.message || "cycle failed", ...summary };
  } finally {
    running = false;
  }
}

// Called from complaint status updates to record resolution after escalation.
async function logEscalationResolved(complaint, byUserId) {
  try {
    if (!complaint?.escalated) return;
    await EscalationLog.create({
      complaint: complaint._id,
      referenceId: complaint.referenceId,
      level: complaint.escalationLevel || 1,
      type: "Resolved",
      reason: `Resolved after escalation (${complaint.status})`,
      severity: complaint.severity,
      city: complaint.city,
      category: complaint.incidentType,
      by: byUserId,
    });
  } catch (err) {
    console.warn("[Escalation] resolve log failed:", err?.message || err);
  }
}

module.exports = { runEscalationCycle, logEscalationResolved, OPEN_STATUSES };
