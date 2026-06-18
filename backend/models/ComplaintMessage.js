const mongoose = require("mongoose");

const complaintMessageSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["Admin", "InvestigationOfficer", "User"],
      required: true,
    },
    message: { type: String, required: true, trim: true, minlength: 1 },
  },
  { timestamps: true, collection: "complaintMessages" }
);

module.exports = mongoose.model("ComplaintMessage", complaintMessageSchema);

