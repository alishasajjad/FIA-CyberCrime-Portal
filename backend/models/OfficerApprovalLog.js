const mongoose = require("mongoose");

const officerApprovalLogSchema = new mongoose.Schema(
  {
    officer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["Approved", "Rejected"],
      required: true,
    },
    department: { type: String, default: "", trim: true },
    reason: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "officerApprovalLogs" }
);

module.exports = mongoose.model("OfficerApprovalLog", officerApprovalLogSchema);
