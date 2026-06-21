const express = require("express");

const router = express.Router();
const { runEscalationCycle } = require("../utils/escalationEngine");
const { runReminderSweep } = require("../utils/reminderEngine");

/**
 * On a long-running host these sweeps run on setInterval timers (see server.js).
 * On serverless (Vercel) the process is ephemeral, so they are triggered over
 * HTTP by Vercel Cron — or any external scheduler (cron-job.org, UptimeRobot) —
 * hitting these endpoints. Protected by CRON_SECRET.
 *
 * Vercel Cron automatically sends "Authorization: Bearer <CRON_SECRET>" when the
 * CRON_SECRET env var is set. External pingers may instead pass ?key=<secret>.
 */
function authorizeCron(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ message: "CRON_SECRET is not configured" });
  }
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const provided = bearer || req.query.key || "";
  if (provided !== secret) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}

router.get("/escalation", authorizeCron, async (req, res) => {
  try {
    const result = await runEscalationCycle();
    return res.json({ ok: true, job: "escalation", result: result ?? null });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, job: "escalation", message: err?.message || "failed" });
  }
});

router.get("/reminders", authorizeCron, async (req, res) => {
  try {
    const result = await runReminderSweep();
    return res.json({ ok: true, job: "reminders", result: result ?? null });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, job: "reminders", message: err?.message || "failed" });
  }
});

module.exports = router;
