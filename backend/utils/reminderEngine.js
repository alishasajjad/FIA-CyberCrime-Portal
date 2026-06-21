const Reminder = require("../models/Reminder");
const { createNotification } = require("./notify");

// Notification lead time — reminders due within this window (or already
// overdue) trigger a one-time in-app notification to the owning officer.
const DUE_WINDOW_MS = 15 * 60 * 1000;

/**
 * Sweep for pending reminders that are due/overdue and not yet notified,
 * creating a single in-app notification per reminder. Idempotent via the
 * `dueNotified` flag so officers are never spammed.
 */
async function runReminderSweep() {
  const now = new Date();
  const horizon = new Date(now.getTime() + DUE_WINDOW_MS);

  const due = await Reminder.find({
    completed: false,
    dueNotified: false,
    dueAt: { $lte: horizon },
  }).limit(200);

  let notified = 0;
  for (const r of due) {
    try {
      const overdue = r.dueAt < now;
      await createNotification({
        recipient: r.officer,
        title: overdue ? "Reminder overdue" : "Reminder due soon",
        message: `${r.title} is ${overdue ? "overdue" : "due"} (${new Date(
          r.dueAt
        ).toLocaleString()}).`,
        type: "System",
        meta: {
          reminderId: r._id,
          category: r.category,
          priority: r.priority,
          dueAt: r.dueAt,
        },
      });
      r.dueNotified = true;
      await r.save();
      notified += 1;
    } catch {
      // Best-effort; keep processing the rest of the batch.
    }
  }
  return { processed: due.length, notified };
}

module.exports = { runReminderSweep };
