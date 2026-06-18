/**
 * Ensures MongoDB indexes exist for high-concurrency query performance.
 * Run: npm run ensure:indexes (from backend folder)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const appConfig = require("../config/appConfig");

const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Evidence = require("../models/Evidence");
const Session = require("../models/Session");
const Notification = require("../models/Notification");
const Assignment = require("../models/Assignment");

async function main() {
  if (!appConfig.mongo.uri) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(appConfig.mongo.uri, {
    maxPoolSize: appConfig.mongo.maxPoolSize,
    minPoolSize: appConfig.mongo.minPoolSize,
  });

  await Promise.all([
    User.syncIndexes(),
    Complaint.syncIndexes(),
    Evidence.syncIndexes(),
    Session.syncIndexes(),
    Notification.syncIndexes(),
    Assignment.syncIndexes(),
  ]);

  console.log("[Indexes] Synced indexes for users, complaints, evidence, sessions, notifications, assignments.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[Indexes] Failed:", err?.message || err);
  process.exit(1);
});
