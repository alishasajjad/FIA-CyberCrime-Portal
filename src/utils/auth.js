const TOKEN_KEY = "token";

export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token) {
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
}

export function getAuthRole() {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  return getRoleFromToken(token) || null;
}

export function defaultRouteForRole(role) {
  if (role === "Admin") return "/admin/dashboard";
  if (role === "InvestigationOfficer") return "/admin/investigations";
  if (role === "User") return "/admin/report-crime";
  return "/auth/sign-in";
}

export function persistSession({ token, user }) {
  // Per requirement: only persist JWT/session token on client.
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export async function clearSession() {
  try {
    const { apiFetch } = await import("services/api");
    await apiFetch("/users/logout", { method: "POST" });
  } catch {
    // Still clear local token even if server logout fails (offline/expired).
  }
  localStorage.removeItem(TOKEN_KEY);
}
