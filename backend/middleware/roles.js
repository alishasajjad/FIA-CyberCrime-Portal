module.exports = function requireRoles(allowedRoles) {
  return function roleMiddleware(req, res, next) {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: "Unauthorized" });
    if (role === "InvestigationOfficer" && !req.user?.isApprovedOfficer) {
      return res.status(403).json({ message: "Officer account is not approved" });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
};

