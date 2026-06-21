// Vercel serverless entry point.
//
// All requests are rewritten to this function (see vercel.json). It ensures a
// (cached) Mongo connection is ready, then delegates to the shared Express app.
// Socket.IO and the in-process setInterval schedulers are NOT started here —
// they require a long-running process. Realtime degrades to client polling, and
// the SLA escalation / reminder sweeps run via Vercel Cron -> /api/cron/* .
const app = require("../app");
const { connectToDatabase } = require("../lib/db");

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error("[Serverless] DB connection failed:", err?.message || err);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({ message: "Service unavailable: database connection failed" })
    );
  }
  return app(req, res);
};
