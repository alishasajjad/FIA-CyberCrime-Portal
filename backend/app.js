const path = require("path");
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
const cronRoutes = require("./routes/cronRoutes");

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
// Cron-triggered background sweeps (used on serverless; harmless elsewhere).
app.use("/api/cron", cronRoutes);

app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    uptimeSec: Math.floor(process.uptime()),
    mongoState: mongoose.connection.readyState,
  })
);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
