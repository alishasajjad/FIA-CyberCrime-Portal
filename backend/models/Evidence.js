const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "evidence" }
);

evidenceSchema.index({ complaint: 1, createdAt: -1 });

module.exports = mongoose.model("Evidence", evidenceSchema);

