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
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "assignments" }
);

module.exports = mongoose.model("Assignment", assignmentSchema);

