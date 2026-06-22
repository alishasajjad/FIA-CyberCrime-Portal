// Resolve the API base. REACT_APP_API_URL (set at build time) always wins.
// Without it, fall back to localhost ONLY when actually running on localhost;
// on any deployed domain fall back to the production backend so a build that
// is missing the env var can never silently call localhost in production.
function resolveApiBase() {
  const envUrl =
    typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL;
  if (envUrl && String(envUrl).trim()) return String(envUrl).trim();

  const host =
    typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1|::1)$/i.test(host);
  return isLocal
    ? "http://localhost:5000/api"
    : "https://fia-cyber-crime-portal-backend.vercel.app/api";
}

const API_BASE = resolveApiBase();

export { API_BASE };

export function authHeaders(extra = {}) {
  const token = localStorage.getItem("token") || "";
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * @param {string} path - path relative to API_BASE (e.g. "/complaints/search")
 * @param {RequestInit} options
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const { headers: optHeaders, ...rest } = options;
  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;
  const headers = authHeaders(optHeaders || {});
  let body = rest.body;
  if (
    !isFormData &&
    body &&
    typeof body === "object" &&
    !(body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(url, {
    ...rest,
    body,
    headers,
    credentials: "include",
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && data.message) ||
      (typeof data === "string" ? data : res.statusText);
    const err = new Error(msg || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
