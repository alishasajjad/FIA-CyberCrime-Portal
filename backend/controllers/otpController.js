const bcrypt = require("bcrypt");
const OtpVerification = require("../models/OtpVerification");
const { sendOtp, isProduction } = require("../utils/otpProvider");

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;
const SALT_ROUNDS = 10;

function normalizePhone(raw) {
  const cleaned = String(raw || "").replace(/[^\d+]/g, "");
  return cleaned;
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtp(req, res) {
  try {
    const phone = normalizePhone(req.body?.phone);
    const purpose = String(req.body?.purpose || "registration").trim();
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "A valid phone number is required." });
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await OtpVerification.findOneAndUpdate(
      { phone, purpose },
      {
        $set: {
          codeHash,
          expiresAt,
          attempts: 0,
          verified: false,
          lastSentAt: new Date(),
        },
        $setOnInsert: { phone, purpose },
      },
      { upsert: true, new: true }
    );

    const result = await sendOtp(phone, code);

    return res.json({
      message: "Verification code sent.",
      expiresInSec: CODE_TTL_MS / 1000,
      provider: result.provider,
      // Only surface the code in non-production console mode to aid testing.
      devCode: result.devCodeExposed && !isProduction() ? code : undefined,
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to send code" });
  }
}

async function resendOtp(req, res) {
  try {
    const phone = normalizePhone(req.body?.phone);
    const purpose = String(req.body?.purpose || "registration").trim();
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "A valid phone number is required." });
    }

    const record = await OtpVerification.findOne({ phone, purpose });
    if (!record) {
      // No prior request — treat as a fresh request.
      return requestOtp(req, res);
    }
    if (record.lastSentAt && Date.now() - new Date(record.lastSentAt).getTime() < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: "Please wait before requesting another code." });
    }
    if (record.resendCount >= MAX_RESENDS) {
      return res.status(429).json({ message: "Resend limit reached. Try again later." });
    }

    const code = generateCode();
    record.codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    record.expiresAt = new Date(Date.now() + CODE_TTL_MS);
    record.attempts = 0;
    record.verified = false;
    record.resendCount += 1;
    record.lastSentAt = new Date();
    await record.save();

    const result = await sendOtp(phone, code);
    return res.json({
      message: "Verification code resent.",
      expiresInSec: CODE_TTL_MS / 1000,
      provider: result.provider,
      devCode: result.devCodeExposed && !isProduction() ? code : undefined,
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to resend code" });
  }
}

async function verifyOtp(req, res) {
  try {
    const phone = normalizePhone(req.body?.phone);
    const purpose = String(req.body?.purpose || "registration").trim();
    const code = String(req.body?.code || "").trim();
    if (!isValidPhone(phone) || !code) {
      return res.status(400).json({ message: "Phone and code are required." });
    }

    const record = await OtpVerification.findOne({ phone, purpose }).select("+codeHash");
    if (!record) {
      return res.status(404).json({ message: "No verification in progress for this number." });
    }
    if (record.verified) {
      return res.json({ verified: true, message: "Already verified." });
    }
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: "Code expired. Please request a new one." });
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many attempts. Please request a new code." });
    }

    const ok = await bcrypt.compare(code, record.codeHash);
    if (!ok) {
      record.attempts += 1;
      await record.save();
      const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
      return res.status(400).json({ message: `Invalid code. ${remaining} attempt(s) left.` });
    }

    record.verified = true;
    record.verifiedAt = new Date();
    await record.save();
    return res.json({ verified: true, message: "Phone number verified." });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Verification failed" });
  }
}

// Helper used by registration to mark a freshly verified phone.
async function isPhoneVerified(phone, purpose = "registration") {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) return false;
  const record = await OtpVerification.findOne({ phone: normalized, purpose });
  return !!(record && record.verified);
}

module.exports = { requestOtp, resendOtp, verifyOtp, isPhoneVerified };
