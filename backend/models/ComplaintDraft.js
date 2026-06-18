const mongoose = require("mongoose");

// Database-backed complaint drafts for authenticated users. Persist across
// refresh, browser close, and logout/login. Fully additive — does not touch
// the live `complaints` collection until the user submits.
const complaintDraftSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "Untitled draft", trim: true },
    // Free-form snapshot of the report form fields.
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "complaintdrafts" }
);

complaintDraftSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model("ComplaintDraft", complaintDraftSchema);
