const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requesterName: { type: String, default: "" },
    requesterEmail: { type: String, default: "" },
    category: { type: String, default: "General" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Closed"],
      default: "Open",
    },
    adminReply: { type: String, default: "" },
    resolvedAt: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: "" },
  },
  { timestamps: true, collection: "supportTickets" }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);

