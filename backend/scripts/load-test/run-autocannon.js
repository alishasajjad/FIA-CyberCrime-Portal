/**
 * Load test helper (autocannon) for ~1000 concurrent-style traffic simulation.
 *
 * Prerequisites:
 *   1) Backend running: cd backend && npm run start
 *   2) Install deps at project root: npm install
 *
 * Examples:
 *   cd backend
 *   npm run load:test:smoke
 *   npm run load:test
 *
 * Custom:
 *   node scripts/load-test/run-autocannon.js --url http://localhost:5000 --connections 1000 --duration 30
 *
 * Why this helps:
 * - Rate limiting prevents auth brute-force floods.
 * - Mongo pool + indexes reduce connection/query bottlenecks.
 * - Compression + timeouts avoid memory spikes from hanging requests.
 * - Session revocation prevents unauthorized token reuse after logout.
 */
const autocannon = require("autocannon");

function parseArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || !process.argv[idx + 1]) return fallback;
  return process.argv[idx + 1];
}

const baseUrl = parseArg("--url", "http://localhost:5000");
const connections = Number(parseArg("--connections", "1000"));
const duration = Number(parseArg("--duration", "30"));
const pipelining = Number(parseArg("--pipelining", "1"));

const scenarios = [
  {
    name: "health",
    url: `${baseUrl}/api/health`,
    method: "GET",
  },
  {
    name: "login",
    url: `${baseUrl}/api/users/login`,
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: process.env.LOAD_TEST_EMAIL || "admin@cybercrime.local",
      password: process.env.LOAD_TEST_PASSWORD || "AdminPassword123!",
    }),
  },
  {
    name: "complaints-stats",
    url: `${baseUrl}/api/complaints/stats`,
    method: "GET",
    headers: {
      authorization: `Bearer ${process.env.LOAD_TEST_TOKEN || ""}`,
    },
  },
  {
    name: "complaints-search",
    url: `${baseUrl}/api/complaints/search`,
    method: "GET",
    headers: {
      authorization: `Bearer ${process.env.LOAD_TEST_TOKEN || ""}`,
    },
  },
];

async function runScenario(scenario) {
  console.log(`\n[LoadTest] Running: ${scenario.name}`);
  const result = await autocannon({
    url: scenario.url,
    method: scenario.method,
    headers: scenario.headers,
    body: scenario.body,
    connections,
    duration,
    pipelining,
  });
  autocannon.printResult(result);
}

async function main() {
  console.log("[LoadTest] autocannon settings", { baseUrl, connections, duration, pipelining });
  for (const scenario of scenarios) {
    await runScenario(scenario);
  }
  console.log("\n[LoadTest] Completed. Review latency, timeouts, and non-2xx counts.");
}

main().catch((err) => {
  console.error("[LoadTest] Failed:", err?.message || err);
  process.exit(1);
});
