const path = require("path");
const dotenv = require("dotenv");

// Load .env before appConfig or any module that reads process.env
dotenv.config({ path: path.join(__dirname, ".env") });

const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const appConfig = require("./config/appConfig");
const security = require("./middleware/security");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const userRoutes = require("./routes/userRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const supportTicketRoutes = require("./routes/supportTicketRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const draftRoutes = require("./routes/draftRoutes");
const otpRoutes = require("./routes/otpRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const escalationRoutes = require("./routes/escalationRoutes");
const searchRoutes = require("./routes/searchRoutes");
const auditRoutes = require("./routes/auditRoutes");
const { runEscalationCycle } = require("./utils/escalationEngine");
const { runReminderSweep } = require("./utils/reminderEngine");
const { initRealtime, emitToRole } = require("./utils/realtime");
const { seedDefaultAdmin } = require("./utils/seedAdmin");
const { seedDefaultFaq } = require("./utils/seedFaq");

const app = express();

if (appConfig.trustProxy) {
  app.set("trust proxy", 1);
}

// Production middleware stack (order matters)
app.use(security.helmet);
app.use(security.compression);
app.use(
  cors({
    origin: appConfig.corsOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: appConfig.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: appConfig.jsonBodyLimit }));
app.use(security.requestTimeout(appConfig.requestTimeoutMs));
app.use(security.generalLimiter);

// Lightweight API write logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const write = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
    if (!write) return;
    const user = req.user ? `${req.user.userId} (${req.user.role})` : "anonymous";
    console.log(
      `[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms) user=${user}`
    );
  });
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/escalations", escalationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/audit-logs", auditRoutes);

app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    uptimeSec: Math.floor(process.uptime()),
    mongoState: mongoose.connection.readyState,
  })
);

app.use(notFoundHandler);
app.use(errorHandler);

const mongoUri = appConfig.mongo.uri;
if (!mongoUri) {
  console.error("[MongoDB] Missing MONGO_URI in environment.");
  process.exit(1);
}
if (!appConfig.jwt.secret) {
  console.error("[Auth] Missing JWT_SECRET in environment.");
  process.exit(1);
}

mongoose.connection.on("connected", () => {
  console.log(
    `[MongoDB] Connected to ${mongoose.connection.host}/${mongoose.connection.name}`
  );
});
mongoose.connection.on("error", (err) => {
  console.error("[MongoDB] Runtime error:", err?.message || err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Disconnected");
});

let server;
let escalationTimer = null;
let reminderTimer = null;
let heartbeatTimer = null;

// Background escalation scheduler — evaluates SLA breaches on an interval.
function startEscalationScheduler() {
  const minutes = Math.max(1, Number(process.env.ESCALATION_INTERVAL_MIN) || 15);
  const intervalMs = minutes * 60 * 1000;
  // Initial pass shortly after boot, then on a fixed interval.
  setTimeout(() => {
    runEscalationCycle().catch((e) => console.warn("[Escalation] initial run:", e?.message || e));
  }, 20 * 1000).unref();
  escalationTimer = setInterval(() => {
    runEscalationCycle().catch((e) => console.warn("[Escalation] scheduled run:", e?.message || e));
  }, intervalMs);
  escalationTimer.unref?.();
  console.log(`[Escalation] Scheduler started (every ${minutes} min)`);
}

// Background reminder scheduler — notifies officers of due/overdue reminders.
function startReminderScheduler() {
  const minutes = Math.max(1, Number(process.env.REMINDER_INTERVAL_MIN) || 5);
  const intervalMs = minutes * 60 * 1000;
  setTimeout(() => {
    runReminderSweep().catch((e) => console.warn("[Reminder] initial run:", e?.message || e));
  }, 25 * 1000).unref();
  reminderTimer = setInterval(() => {
    runReminderSweep().catch((e) => console.warn("[Reminder] scheduled run:", e?.message || e));
  }, intervalMs);
  reminderTimer.unref?.();
  console.log(`[Reminder] Scheduler started (every ${minutes} min)`);
}

// Lightweight realtime heartbeat — nudges admin System Health dashboards to
// refresh live without per-client polling.
function startRealtimeHeartbeat() {
  heartbeatTimer = setInterval(() => {
    emitToRole("Admin", "health:tick", { at: Date.now() });
  }, 15 * 1000);
  heartbeatTimer.unref?.();
}

async function bootstrap() {
  await mongoose.connect(mongoUri, {
    maxPoolSize: appConfig.mongo.maxPoolSize,
    minPoolSize: appConfig.mongo.minPoolSize,
    serverSelectionTimeoutMS: appConfig.mongo.serverSelectionTimeoutMS,
    socketTimeoutMS: appConfig.mongo.socketTimeoutMS,
  });

  // Index sync improves query speed under concurrent dashboard/tracking traffic.
  try {
    const User = require("./models/User");
    const Complaint = require("./models/Complaint");
    const Evidence = require("./models/Evidence");
    const Session = require("./models/Session");
    await Promise.all([
      User.syncIndexes(),
      Complaint.syncIndexes(),
      Evidence.syncIndexes(),
      Session.syncIndexes(),
    ]);
    console.log("[MongoDB] Indexes synced");
  } catch (err) {
    console.warn("[MongoDB] Index sync warning:", err?.message || err);
  }

  await seedDefaultAdmin().catch((err) =>
    console.warn("[SeedAdmin] Seed failed:", err?.message || err)
  );
  await seedDefaultFaq().catch((err) =>
    console.warn("[SeedFAQ] Seed failed:", err?.message || err)
  );

  const httpServer = http.createServer(app);
  initRealtime(httpServer);

  server = httpServer.listen(appConfig.port, () => {
    console.log(`[Server] Listening on port ${appConfig.port}`);
    console.log(
      `[Upload Limits] per-file=${appConfig.upload.maxFileSizeMb}MB total=${appConfig.upload.maxTotalUploadMb}MB files=${appConfig.upload.maxFilesPerRequest}`
    );
    console.log(
      `[Session] httpOnly cookie "${appConfig.session.cookieName}" enabled (JWT RBAC preserved)`
    );
    startEscalationScheduler();
    startReminderScheduler();
    startRealtimeHeartbeat();
  });
}

bootstrap().catch((err) => {
  console.error("[Bootstrap] Failed:", err?.message || err);
  process.exit(1);
});

function gracefulShutdown(signal) {
  console.warn(`[Server] ${signal} received. Shutting down gracefully...`);
  if (escalationTimer) clearInterval(escalationTimer);
  if (reminderTimer) clearInterval(reminderTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (!server) {
    mongoose.connection.close().finally(() => process.exit(0));
    return;
  }
  server.close(() => {
    mongoose.connection.close().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("[Process] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught exception:", err);
  gracefulShutdown("uncaughtException");
});
