const mongoose = require("mongoose");
const appConfig = require("../config/appConfig");

/**
 * Cached Mongo connection for serverless (Vercel).
 *
 * Serverless functions are invoked per-request and may reuse a "warm" instance.
 * We cache the connection promise on globalThis so repeated invocations reuse a
 * single connection instead of opening a new one each time (which would quickly
 * exhaust Atlas connection limits). Seeds run once per warm instance.
 *
 * This module is NOT used by the long-running server.js path — that keeps its
 * own bootstrap() connect — so local behaviour is unchanged.
 */
let cached = globalThis.__ccrsMongoose;
if (!cached) {
  cached = globalThis.__ccrsMongoose = { conn: null, promise: null, seeded: false };
}

async function runSeeds() {
  try {
    const { seedDefaultAdmin } = require("../utils/seedAdmin");
    const { seedDefaultFaq } = require("../utils/seedFaq");
    await seedDefaultAdmin();
    await seedDefaultFaq();
  } catch (err) {
    console.warn("[Seed] warning:", err?.message || err);
  }
}

async function connectToDatabase() {
  if (!appConfig.mongo.uri) {
    throw new Error("Missing MONGO_URI in environment.");
  }
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(appConfig.mongo.uri, {
        // Each warm serverless instance handles low concurrency, and many
        // instances may run at once. Keep a small pool so we don't exhaust the
        // Atlas connection limit (free M0 caps at 500). Override with
        // MONGO_MAX_POOL_SIZE if needed.
        maxPoolSize: Math.min(appConfig.mongo.maxPoolSize, 10),
        // Serverless: don't hold idle connections open between invocations.
        minPoolSize: 0,
        serverSelectionTimeoutMS: appConfig.mongo.serverSelectionTimeoutMS,
        socketTimeoutMS: appConfig.mongo.socketTimeoutMS,
      })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Don't leave a rejected promise cached, or every subsequent warm
    // invocation would re-await the same failure. Clear it so the next
    // request retries a fresh connect once Atlas is reachable again.
    cached.promise = null;
    throw err;
  }

  if (!cached.seeded) {
    cached.seeded = true;
    await runSeeds();
  }

  return cached.conn;
}

module.exports = { connectToDatabase };
