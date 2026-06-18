const mongoose = require("mongoose");

// Tracks phone-verification OTP lifecycle. One active record per phone+purpose.
const otpVerificationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true, trim: true },
    purpose: { type: String, default: "registration", trim: true },
    codeHash: { type: String, required: true, select: false },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
  },
  { timestamps: true, collection: "otpverifications" }
);

otpVerificationSchema.index({ phone: 1, purpose: 1 });

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);
