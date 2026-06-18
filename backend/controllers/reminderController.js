const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");

const CATEGORIES = Reminder.REMINDER_CATEGORIES;

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sanitize(body) {
  const out = {};
  if (body.title != null) out.title = String(body.title).trim();
  if (body.category != null) {
    out.category = CATEGORIES.includes(body.category) ? body.category : "Custom";
  }
  if (body.notes != null) out.notes = String(body.notes).trim();
  if (body.dueAt != null) {
    const d = new Date(body.dueAt);
    if (!Number.isNaN(d.getTime())) out.dueAt = d;
  }
  if (body.allDay != null) out.allDay = !!body.allDay;
  if (body.complaintRef != null) out.complaintRef = String(body.complaintRef).trim();
  if (body.complaint && isValidId(body.complaint)) out.complaint = body.complaint;
  return out;
}

// List the officer's own reminders, optionally within a date range.
async function listMyReminders(req, res) {
  try {
    const filter = { officer: req.user.userId };
    const { from, to, category, status } = req.query || {};
    if (from || to) {
      filter.dueAt = {};
      if (from && !Number.isNaN(new Date(from).getTime())) filter.dueAt.$gte = new Date(from);
      if (to && !Number.isNaN(new Date(to).getTime())) filter.dueAt.$lte = new Date(to);
    }
    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (status === "completed") filter.completed = true;
    if (status === "pending") filter.completed = false;

    const reminders = await Reminder.find(filter).sort({ dueAt: 1 }).limit(500);
    return res.json({ reminders });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load reminders" });
  }
}

async function createReminder(req, res) {
  try {
    const data = sanitize(req.body || {});
    if (!data.title) return res.status(400).json({ message: "Title is required" });
    if (!data.dueAt) return res.status(400).json({ message: "A valid due date/time is required" });
    const reminder = await Reminder.create({ ...data, officer: req.user.userId });
    return res.status(201).json({ reminder });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to create reminder" });
  }
}

async function updateReminder(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid reminder id" });
    const data = sanitize(req.body || {});
    if (typeof req.body?.completed === "boolean") {
      data.completed = req.body.completed;
      data.completedAt = req.body.completed ? new Date() : null;
    }
    const updated = await Reminder.findOneAndUpdate(
      { _id: id, officer: req.user.userId },
      { $set: data },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Reminder not found" });
    return res.json({ reminder: updated });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to update reminder" });
  }
}

async function deleteReminder(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid reminder id" });
    const deleted = await Reminder.findOneAndDelete({ _id: id, officer: req.user.userId });
    if (!deleted) return res.status(404).json({ message: "Reminder not found" });
    return res.json({ message: "Reminder deleted" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to delete reminder" });
  }
}

module.exports = {
  listMyReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};
