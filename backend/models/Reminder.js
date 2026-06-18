const mongoose = require("mongoose");

// Officer investigation calendar events / reminders. Fully additive — owned by
// the creating officer and never referenced by existing complaint workflows.
const REMINDER_CATEGORIES = [
  "EvidenceReview",
  "UserMeeting",
  "InvestigationDeadline",
  "CaseFollowUp",
  "InternalReview",
  "Custom",
];

const reminderSchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: REMINDER_CATEGORIES,
      default: "Custom",
    },
    notes: { type: String, default: "", trim: true },
    // Optional link to a complaint the officer is working on.
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
    complaintRef: { type: String, default: "", trim: true },
    dueAt: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: "reminders" }
);

reminderSchema.index({ officer: 1, dueAt: 1 });
reminderSchema.index({ officer: 1, completed: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);
module.exports.REMINDER_CATEGORIES = REMINDER_CATEGORIES;
