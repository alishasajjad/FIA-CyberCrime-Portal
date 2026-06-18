const mongoose = require("mongoose");

// Singleton configuration document for the escalation engine (admin-editable).
const escalationConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    enabled: { type: Boolean, default: true },
    slaHours: {
      Critical: { type: Number, default: 24 },
      High: { type: Number, default: 48 },
      Medium: { type: Number, default: 96 },
      Low: { type: Number, default: 168 },
    },
    triggers: {
      unassigned: { type: Boolean, default: true },
      notUpdated: { type: Boolean, default: true },
      inactive: { type: Boolean, default: true },
    },
    autoReassign: { type: Boolean, default: true },
    warnBeforeHours: { type: Number, default: 6 },
    reminderIntervalHours: { type: Number, default: 24 },
    maxLevel: { type: Number, default: 3 },
    notifyAdmins: { type: Boolean, default: true },
    notifyOfficers: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "escalationconfigs" }
);

// Returns the global config, creating defaults on first use.
escalationConfigSchema.statics.getGlobal = async function () {
  let doc = await this.findOne({ key: "global" });
  if (!doc) doc = await this.create({ key: "global" });
  return doc;
};

module.exports = mongoose.model("EscalationConfig", escalationConfigSchema);
