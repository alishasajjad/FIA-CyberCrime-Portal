const jwt = require("jsonwebtoken");
const User = require("../models/User");
const appConfig = require("../config/appConfig");
const { extractTokenFromRequest, isSessionActive } = require("../utils/sessionService");

module.exports = async function authMiddleware(req, res, next) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "Missing Authorization token" });
  }

  try {
    const payload = jwt.verify(token, appConfig.jwt.secret);

    // New logins include sid; legacy tokens without sid remain valid until JWT expiry.
    if (payload.sid) {
      const sessionOk = await isSessionActive(payload.sid);
      if (!sessionOk) {
        return res.status(401).json({
          message: "Session expired or revoked. Please sign in again.",
        });
      }
    }

    const user = await User.findById(payload.userId, {
      role: 1,
      status: 1,
      isApprovedOfficer: 1,
      officerRequestStatus: 1,
      unit: 1,
    }).lean();
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.status === "Inactive") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    req.user = {
      userId: payload.userId,
      role: user.role,
      isApprovedOfficer: !!user.isApprovedOfficer,
      officerRequestStatus: user.officerRequestStatus || "None",
      unit: user.unit || "",
      sessionId: payload.sid,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
