const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const appConfig = require("../config/appConfig");

function buildSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: appConfig.session.secureCookie,
    sameSite: appConfig.session.sameSite,
    maxAge: appConfig.session.maxAgeMs,
    path: "/",
  };
}

async function createUserSession(user, req) {
  const sessionId = buildSessionId();
  const expiresAt = new Date(Date.now() + appConfig.session.maxAgeMs);

  await Session.create({
    sessionId,
    user: user._id,
    expiresAt,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
    ipAddress: String(req.ip || req.socket?.remoteAddress || ""),
  });

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      sid: sessionId,
    },
    appConfig.jwt.secret,
    { expiresIn: appConfig.jwt.expiresIn }
  );

  return { token, sessionId, expiresAt };
}

async function isSessionActive(sessionId) {
  if (!sessionId) return false;
  const session = await Session.findOne({
    sessionId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("_id");
  return !!session;
}

async function revokeSession(sessionId) {
  if (!sessionId) return;
  await Session.updateOne(
    { sessionId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

async function revokeAllUserSessions(userId) {
  await Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

function setSessionCookie(res, token) {
  res.cookie(appConfig.session.cookieName, token, getCookieOptions());
}

function clearSessionCookie(res) {
  res.clearCookie(appConfig.session.cookieName, {
    httpOnly: true,
    secure: appConfig.session.secureCookie,
    sameSite: appConfig.session.sameSite,
    path: "/",
  });
}

function extractTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookieName = appConfig.session.cookieName;
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }
  return null;
}

module.exports = {
  createUserSession,
  isSessionActive,
  revokeSession,
  revokeAllUserSessions,
  setSessionCookie,
  clearSessionCookie,
  extractTokenFromRequest,
  getCookieOptions,
};
