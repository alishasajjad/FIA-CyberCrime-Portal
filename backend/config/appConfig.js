/**
 * Central app configuration from environment variables.
 * Keeps limits and production settings in one place for viva/deployment docs.
 */
function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseMbToBytes(mb) {
  return parsePositiveInt(mb, 1) * 1024 * 1024;
}

// CORS_ORIGIN may be a single origin or a comma-separated allowlist (e.g. the
// production frontend URL plus Vercel preview URLs or an apex/www variant).
// Returns a string for a single origin (unchanged behaviour) or an array for
// several. Both forms are accepted by the cors package and Socket.IO.
function parseCorsOrigin(value) {
  const list = String(value || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 1 ? list : list[0];
}

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  isProduction,
  port: parsePositiveInt(process.env.PORT, 5000),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  trustProxy: process.env.TRUST_PROXY === "true" || isProduction,
  requestTimeoutMs: parsePositiveInt(process.env.REQUEST_TIMEOUT_MS, 30000),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "2mb",

  mongo: {
    uri: process.env.MONGO_URI,
    maxPoolSize: parsePositiveInt(process.env.MONGO_MAX_POOL_SIZE, 50),
    minPoolSize: parsePositiveInt(process.env.MONGO_MIN_POOL_SIZE, 5),
    serverSelectionTimeoutMS: parsePositiveInt(process.env.MONGO_SERVER_SELECTION_MS, 10000),
    socketTimeoutMS: parsePositiveInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 45000),
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || "ccrs_session",
    maxAgeMs: parsePositiveInt(process.env.SESSION_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000),
    secureCookie: process.env.SESSION_COOKIE_SECURE === "true" || isProduction,
    sameSite: process.env.SESSION_COOKIE_SAMESITE || "lax",
  },

  upload: {
    maxFilesPerRequest: parsePositiveInt(process.env.MAX_FILES_PER_REQUEST, 10),
    maxFileSizeBytes: parseMbToBytes(process.env.MAX_FILE_SIZE_MB || 100),
    maxTotalUploadBytes: parseMbToBytes(process.env.MAX_TOTAL_UPLOAD_MB || 1024),
    maxFileSizeMb: parsePositiveInt(process.env.MAX_FILE_SIZE_MB, 100),
    maxTotalUploadMb: parsePositiveInt(process.env.MAX_TOTAL_UPLOAD_MB, 1024),
  },

  rateLimit: {
    windowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    max: parsePositiveInt(process.env.RATE_LIMIT_MAX, 300),
    authMax: parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 20),
  },

  cache: {
    statsTtlMs: parsePositiveInt(process.env.CACHE_STATS_TTL_MS, 15000),
  },
};
