const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  "http://localhost:5000/api";

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
