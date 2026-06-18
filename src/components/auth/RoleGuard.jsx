import { Navigate } from "react-router-dom";
import {
  getAuthRole,
  defaultRouteForRole,
  clearSession,
  getRoleFromToken,
} from "utils/auth";

export default function RoleGuard({ allowedRoles, children }) {
  const token = localStorage.getItem("token") || "";
  const role = token ? getRoleFromToken(token) || getAuthRole() : null;

  if (!token) return <Navigate to="/auth/sign-in" replace />;
  if (!role) {
    clearSession();
    return <Navigate to="/auth/sign-in" replace />;
  }
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to={defaultRouteForRole(role)} replace />;
    }
  }

  return children;
}
