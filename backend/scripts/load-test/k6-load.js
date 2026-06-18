/**
 * k6 load test (optional) — install k6 separately: https://k6.io/docs/get-started/installation/
 *
 * Run:
 *   k6 run backend/scripts/load-test/k6-load.js
 *
 * With token for protected routes:
 *   k6 run -e LOAD_TEST_TOKEN=your_jwt backend/scripts/load-test/k6-load.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 200 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:5000";
const TOKEN = __ENV.LOAD_TEST_TOKEN || "";

export default function () {
  const authHeaders = TOKEN
    ? { Authorization: `Bearer ${TOKEN}` }
    : {};

  check(http.get(`${BASE}/api/health`), { "health ok": (r) => r.status === 200 });

  const loginRes = http.post(
    `${BASE}/api/users/login`,
    JSON.stringify({
      email: __ENV.LOAD_TEST_EMAIL || "admin@cybercrime.local",
      password: __ENV.LOAD_TEST_PASSWORD || "AdminPassword123!",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(loginRes, { "login status": (r) => r.status === 200 || r.status === 403 });

  check(http.get(`${BASE}/api/complaints/stats`, { headers: authHeaders }), {
    "stats status": (r) => r.status === 200 || r.status === 401,
  });

  check(http.get(`${BASE}/api/complaints/search`, { headers: authHeaders }), {
    "search status": (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
