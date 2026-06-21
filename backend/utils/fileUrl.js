const path = require("path");

/**
 * Resolve a stored evidence filePath into a publicly reachable URL.
 *
 * - If filePath is already an absolute http(s) URL (e.g. a Cloudinary
 *   secure_url), it is returned as-is.
 * - Otherwise it is a local disk filename served from /uploads. The public
 *   origin is taken from PUBLIC_BASE_URL when set (production), falling back to
 *   http://localhost:<PORT> for local development.
 *
 * This replaces the previously hardcoded "http://localhost:5000" prefix so the
 * same code works locally and on a deployed API origin.
 */
function resolveFileUrl(filePath) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const base =
    process.env.PUBLIC_BASE_URL ||
    `http://localhost:${process.env.PORT || 5000}`;
  return `${base.replace(/\/+$/, "")}/uploads/${path.basename(filePath)}`;
}

module.exports = { resolveFileUrl };
