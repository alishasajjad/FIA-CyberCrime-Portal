/**
 * Lightweight in-memory TTL cache for read-heavy endpoints (e.g. dashboard stats).
 * Not shared across multiple server instances — use Redis in multi-node production.
 */
const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function del(key) {
  store.delete(key);
}

function clear() {
  store.clear();
}

// Periodic cleanup prevents Map growth if keys are never read again.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60 * 1000);
cleanupTimer.unref?.();

module.exports = { get, set, del, clear };
