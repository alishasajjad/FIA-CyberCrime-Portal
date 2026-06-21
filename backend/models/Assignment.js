const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Assigned", "In Progress", "Completed"],
      default: "Assigned",
    },
    // Officer acceptance lifecycle (additive; legacy docs default to "Pending").
    response: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    rejectionReason: { type: String, default: "" },
    respondedAt: { type: Date },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "assignments" }
);

module.exports = mongoose.model("Assignment", assignmentSchema);

