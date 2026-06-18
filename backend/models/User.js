const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["Admin", "InvestigationOfficer", "PendingOfficer", "User"],
      default: "User",
    },
    isApprovedOfficer: { type: Boolean, default: false },
    officerRequestStatus: {
      type: String,
      enum: ["None", "Pending", "Approved", "Rejected"],
      default: "None",
    },
    officerRequestedAt: { type: Date },
    officerReviewedAt: { type: Date },
    officerReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    officerReviewReason: { type: String, default: "", trim: true },
    unit: { type: String, default: "" },
    phoneNumber: { type: String, default: "", trim: true },
    // Optional WhatsApp/phone verification flag (additive; never blocks auth).
    phoneVerified: { type: Boolean, default: false },
    cnic: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true, collection: "users" }
);

userSchema.index({ role: 1, officerRequestStatus: 1 });
userSchema.index({ status: 1 });

userSchema.set("toJSON", {
  transform: (_, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);

