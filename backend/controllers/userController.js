const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const OfficerApprovalLog = require("../models/OfficerApprovalLog");
const { createNotification } = require("../utils/notify");
const { recordAudit } = require("../utils/audit");
const { isPhoneVerified } = require("./otpController");
const appConfig = require("../config/appConfig");
const {
  createUserSession,
  setSessionCookie,
  clearSessionCookie,
  extractTokenFromRequest,
  revokeSession,
} = require("../utils/sessionService");

const SALT_ROUNDS = 10;

async function register(req, res) {
  try {
    const {
      name,
      fullName,
      email,
      password,
      role,
      unit,
      phoneNumber,
      cnic,
      officerEnrollmentToken,
    } = req.body || {};
    const normalizedName = String(name || fullName || "").trim();
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (cnic && String(cnic).trim().length < 5) {
      return res.status(400).json({ message: "Invalid CNIC" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const normalizedRole = role || "User";
    if (!["User", "InvestigationOfficer"].includes(normalizedRole)) {
      return res.status(400).json({
        message: "role must be either 'User' or 'InvestigationOfficer'",
      });
    }

    const normalizedUnit = String(unit || "").trim();
    const requestedOfficer = normalizedRole === "InvestigationOfficer";

    if (requestedOfficer && !normalizedUnit) {
      return res.status(400).json({ message: "Department is required for officer signup" });
    }

    const requiredEnrollmentToken = String(process.env.OFFICER_ENROLLMENT_TOKEN || "").trim();
    if (requestedOfficer && requiredEnrollmentToken) {
      const providedToken = String(officerEnrollmentToken || "").trim();
      const normalizedProvidedToken = providedToken.toLowerCase();
      const normalizedRequiredToken = requiredEnrollmentToken.toLowerCase();
      console.log("[OfficerSignup] Token check", {
        requestedOfficer,
        hasConfiguredToken: !!requiredEnrollmentToken,
        providedTokenLength: providedToken.length,
        configuredTokenLength: requiredEnrollmentToken.length,
        tokenMatched: normalizedProvidedToken === normalizedRequiredToken,
      });
      if (!providedToken || normalizedProvidedToken !== normalizedRequiredToken) {
        return res.status(403).json({
          message: "Invalid officer enrollment token",
        });
      }
    } else if (requestedOfficer) {
      console.log("[OfficerSignup] Token skipped (OFFICER_ENROLLMENT_TOKEN not configured)");
    }

    // Optional, non-blocking: flag the phone as verified if the user completed
    // OTP verification during signup. Registration never fails on this.
    const trimmedPhone = phoneNumber ? String(phoneNumber).trim() : "";
    let phoneVerified = false;
    if (trimmedPhone) {
      try {
        phoneVerified = await isPhoneVerified(trimmedPhone);
      } catch {
        phoneVerified = false;
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: requestedOfficer ? "PendingOfficer" : "User",
      isApprovedOfficer: false,
      officerRequestStatus: requestedOfficer ? "Pending" : "None",
      officerRequestedAt: requestedOfficer ? new Date() : undefined,
      // Use "unit" as the officer department field.
      unit: normalizedUnit,
      phoneNumber: trimmedPhone,
      phoneVerified,
      cnic: cnic ? String(cnic).trim() : "",
    });

    await createNotification({
      recipient: user._id,
      title: "Account created",
      message: requestedOfficer
        ? "Your account has been created. Officer access is pending admin approval."
        : "Your account has been created successfully.",
      type: "System",
      channel: "Email",
      meta: { userId: user._id, role: user.role, officerRequestStatus: user.officerRequestStatus },
    });
    await createNotification({
      recipient: user._id,
      title: "Account created",
      message: requestedOfficer
        ? "Your officer enrollment request is pending admin review."
        : "Your account has been created successfully.",
      type: "System",
      channel: "SMS",
      meta: { userId: user._id, role: user.role, officerRequestStatus: user.officerRequestStatus },
    });

    if (requestedOfficer) {
      const admins = await User.find({ role: "Admin" }, { _id: 1 });
      await Promise.all(
        admins.map((admin) =>
          createNotification({
            recipient: admin._id,
            title: "Officer approval required",
            message: `New officer request from ${user.name} (${user.email}) in ${user.unit}.`,
            type: "System",
            channel: "InApp",
            meta: { requestedUserId: user._id, department: user.unit },
          })
        )
      );
    }

    console.log("[OfficerSignup] User created", {
      userId: user._id?.toString?.(),
      role: user.role,
      officerRequestStatus: user.officerRequestStatus,
      department: user.unit,
    });

    recordAudit({
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user._id,
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      summary: `${user.role} account registered (${user.email})`,
      req,
    });

    return res.status(201).json({
      user,
      message: requestedOfficer
        ? "Officer enrollment request submitted and pending admin approval."
        : "Account created successfully.",
    });
  } catch (err) {
    console.error("[Register] Failed", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      errInfo: err?.errInfo,
      errors: err?.errors,
    });
    return res.status(500).json({ message: err?.message || "Registration failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.role === "PendingOfficer") {
      if (user.officerRequestStatus === "Rejected") {
        return res.status(403).json({
          message: "Officer enrollment request was rejected by admin.",
        });
      }
      return res.status(403).json({
        message: "Officer enrollment request is pending admin approval.",
      });
    }

    // Login notifications for audit trail (in-app + channel structure)
    createNotification({
      recipient: user._id,
      title: "Login successful",
      message: "A successful login occurred on your account.",
      type: "System",
      channel: "InApp",
      meta: { userId: user._id, role: user.role },
    }).catch(() => null);

    const { token } = await createUserSession(user, req);
    setSessionCookie(res, token);

    recordAudit({
      action: "USER_LOGIN",
      entityType: "Session",
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      summary: `${user.name} signed in`,
      req,
    });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        officerRequestStatus: user.officerRequestStatus,
        isApprovedOfficer: user.isApprovedOfficer,
        unit: user.unit,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        cnic: user.cnic,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Login failed" });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.userId, { passwordHash: 0 });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        officerRequestStatus: user.officerRequestStatus,
        isApprovedOfficer: user.isApprovedOfficer,
        unit: user.unit,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        cnic: user.cnic,
        status: user.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load profile" });
  }
}

async function verifyOtpSimulation(req, res) {
  try {
    await Promise.all([
      createNotification({
        recipient: req.user?.userId,
        title: "OTP verification successful",
        message: "Your OTP verification was simulated via Email channel.",
        type: "OTP",
        channel: "Email",
      }),
      createNotification({
        recipient: req.user?.userId,
        title: "OTP verification successful",
        message: "Your OTP verification was simulated via SMS channel.",
        type: "OTP",
        channel: "SMS",
      }),
    ]);
    return res.json({ message: "OTP verified (simulated email/SMS)." });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "OTP verification failed" });
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.find({}, { passwordHash: 0 })
      .populate("officerReviewedBy", "name email role")
      .sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to list users" });
  }
}

async function createAdmin(req, res) {
  try {
    // Requirement: only one seeded Admin account exists.
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      return res.status(403).json({
        message: "Admin creation is disabled. Only the seeded Admin is allowed.",
      });
    }
    const { name, email, password, unit, phoneNumber, cnic } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }
    if (cnic && String(cnic).trim().length < 5) {
      return res.status(400).json({ message: "Invalid CNIC" });
    }
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: "Admin",
      unit: unit || "",
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : "",
      cnic: cnic ? String(cnic).trim() : "",
      status: "Active",
    });

    return res.status(201).json({ user });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to create admin" });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, role, unit, status, phoneNumber, cnic } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (unit !== undefined) update.unit = String(unit).trim();
    if (phoneNumber !== undefined) update.phoneNumber = String(phoneNumber).trim();
    if (cnic !== undefined) {
      const normalizedCnic = String(cnic).trim();
      if (normalizedCnic && normalizedCnic.length < 5) {
        return res.status(400).json({ message: "Invalid CNIC" });
      }
      update.cnic = normalizedCnic;
    }
    if (status !== undefined) {
      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      update.status = status;
    }
    if (role !== undefined) {
      if (!["Admin", "InvestigationOfficer", "PendingOfficer", "User"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      update.role = role;
      if (role === "InvestigationOfficer") {
        update.isApprovedOfficer = true;
        update.officerRequestStatus = "Approved";
      }
      if (role === "PendingOfficer") {
        update.isApprovedOfficer = false;
        update.officerRequestStatus = "Pending";
        update.officerRequestedAt = new Date();
      }
      if (role === "User") {
        update.isApprovedOfficer = false;
      }
    }

    if (
      (update.role === "InvestigationOfficer" || role === "InvestigationOfficer") &&
      (update.unit === undefined ? unit : update.unit) === ""
    ) {
      return res.status(400).json({ message: "Department is required for officers" });
    }

    const user = await User.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      select: "-passwordHash",
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    recordAudit({
      req,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: user._id,
      summary: `Admin updated user ${user.name}`,
      meta: { changes: Object.keys(update) },
    });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Update failed" });
  }
}

async function listPendingOfficerRequests(req, res) {
  try {
    const users = await User.find(
      {
        role: "PendingOfficer",
        officerRequestStatus: "Pending",
        isApprovedOfficer: false,
      },
      { passwordHash: 0 }
    ).sort({ officerRequestedAt: -1, createdAt: -1 });
    console.log("[OfficerRequests] Pending count", users.length);
    return res.json({ users });
  } catch (err) {
    console.error("[OfficerRequests] Failed", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      errInfo: err?.errInfo,
    });
    return res.status(500).json({ message: err?.message || "Failed to list officer requests" });
  }
}

async function reviewOfficerRequest(req, res) {
  try {
    const { id } = req.params;
    const { action, department, reason } = req.body || {};
    const normalizedAction = String(action || "").trim();
    const normalizedDepartment = String(department || "").trim();
    const normalizedReason = String(reason || "").trim();

    if (!["approve", "reject"].includes(normalizedAction)) {
      return res.status(400).json({ message: "action must be approve or reject" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "PendingOfficer" && user.officerRequestStatus !== "Pending") {
      return res.status(400).json({ message: "User is not a pending officer request" });
    }

    if (normalizedAction === "approve") {
      const finalDepartment = normalizedDepartment || String(user.unit || "").trim();
      if (!finalDepartment) {
        return res.status(400).json({ message: "Department is required to approve officer" });
      }
      user.role = "InvestigationOfficer";
      user.isApprovedOfficer = true;
      user.officerRequestStatus = "Approved";
      user.unit = finalDepartment;
    } else {
      user.role = "PendingOfficer";
      user.isApprovedOfficer = false;
      user.officerRequestStatus = "Rejected";
    }

    user.officerReviewedAt = new Date();
    user.officerReviewedBy = req.user.userId;
    user.officerReviewReason = normalizedReason;
    await user.save();

    await OfficerApprovalLog.create({
      officer: user._id,
      admin: req.user.userId,
      action: normalizedAction === "approve" ? "Approved" : "Rejected",
      department: user.unit || "",
      reason: normalizedReason,
    });

    await createNotification({
      recipient: user._id,
      title:
        normalizedAction === "approve" ? "Officer request approved" : "Officer request rejected",
      message:
        normalizedAction === "approve"
          ? `Your officer account is approved for department ${user.unit}.`
          : "Your officer enrollment request was rejected by admin.",
      type: "System",
      channel: "InApp",
      meta: {
        reviewedBy: req.user.userId,
        officerRequestStatus: user.officerRequestStatus,
        department: user.unit,
      },
    });

    recordAudit({
      req,
      action: "OFFICER_APPROVAL",
      entityType: "User",
      entityId: user._id,
      summary: `Officer request ${normalizedAction === "approve" ? "approved" : "rejected"} for ${user.name}`,
      meta: { decision: user.officerRequestStatus, department: user.unit, reason: normalizedReason },
    });

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to review officer request" });
  }
}

async function getOfficerApprovalLogs(req, res) {
  try {
    const logs = await OfficerApprovalLog.find({})
      .populate("officer", "name email unit role officerRequestStatus")
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load officer logs" });
  }
}

async function logout(req, res) {
  try {
    const token = extractTokenFromRequest(req);
    if (token) {
      try {
        const payload = jwt.verify(token, appConfig.jwt.secret);
        await revokeSession(payload.sid);
      } catch {
        // Token already invalid/expired — still clear cookie for client safety.
      }
    }
    clearSessionCookie(res);
    recordAudit({
      req,
      action: "USER_LOGOUT",
      entityType: "Session",
      summary: `${req.user?.role || "User"} signed out`,
    });
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Logout failed" });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const result = await User.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: "User not found" });
    recordAudit({
      req,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
      summary: `Admin deleted user ${result.name || id}`,
    });
    return res.json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Delete failed" });
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  verifyOtpSimulation,
  listUsers,
  createAdmin,
  updateUser,
  deleteUser,
  listPendingOfficerRequests,
  reviewOfficerRequest,
  getOfficerApprovalLogs,
};

