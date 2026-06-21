const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const appConfig = require("../config/appConfig");

// Singleton Socket.IO server. All emit helpers are safe no-ops until init,
// so controllers/utilities can call them unconditionally (and in CLI/tests).
let io = null;

function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: appConfig.corsOrigin, credentials: true },
  });

  // JWT handshake auth — token via socket.handshake.auth.token or Authorization.
  io.use((socket, next) => {
    try {
      const headerToken = String(socket.handshake.headers?.authorization || "").replace(
        /^Bearer\s+/i,
        ""
      );
      const token = socket.handshake.auth?.token || headerToken;
      if (!token) return next(new Error("unauthorized"));
      const payload = jwt.verify(token, appConfig.jwt.secret);
      socket.data.userId = payload.userId ? String(payload.userId) : null;
      socket.data.role = payload.role || null;
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.data;
    // Personal room (per-user delivery) + role broadcast room.
    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);

    // Optional per-complaint room subscription for the Details page.
    socket.on("complaint:subscribe", (complaintId) => {
      if (complaintId) socket.join(`complaint:${complaintId}`);
    });
    socket.on("complaint:unsubscribe", (complaintId) => {
      if (complaintId) socket.leave(`complaint:${complaintId}`);
    });

    socket.emit("connected", { userId, role, at: Date.now() });
  });

  console.log("[Realtime] Socket.IO initialized");
  return io;
}

function getIo() {
  return io;
}

function emitToUser(userId, event, payload) {
  if (io && userId) io.to(`user:${String(userId)}`).emit(event, payload);
}

function emitToRole(role, event, payload) {
  if (io && role) io.to(`role:${role}`).emit(event, payload);
}

function emitToRoles(roles, event, payload) {
  (roles || []).forEach((r) => emitToRole(r, event, payload));
}

function emitToComplaint(complaintId, event, payload) {
  if (io && complaintId) io.to(`complaint:${String(complaintId)}`).emit(event, payload);
}

function emitToAll(event, payload) {
  if (io) io.emit(event, payload);
}

module.exports = {
  initRealtime,
  getIo,
  emitToUser,
  emitToRole,
  emitToRoles,
  emitToComplaint,
  emitToAll,
};
