const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const SupportTicket = require("../models/SupportTicket");
const Notification = require("../models/Notification");

const MIN_QUERY_LENGTH = 2;
const GROUP_LIMIT = 8;

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function complaintSummary(c) {
  return {
    _id: c._id,
    referenceId: c.referenceId,
    incidentType: c.incidentType,
    status: c.status,
    severity: c.severity,
    city: c.city || "",
    department: c.department || "",
    createdAt: c.createdAt,
    assignedTo: c.assignedTo ? { _id: c.assignedTo._id, name: c.assignedTo.name } : null,
  };
}

/**
 * Role-aware global search powering the dashboard navbar search bar.
 * - User: their own complaints, their notifications, their support tickets.
 * - InvestigationOfficer: complaints assigned to them, assignments, notifications, own tickets.
 * - Admin: complaints, users/officers, assignments, support tickets, notifications.
 */
async function globalSearch(req, res) {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    const raw = String(req.query?.q || "").trim();

    if (raw.length < MIN_QUERY_LENGTH) {
      return res.json({ query: raw, groups: {}, total: 0 });
    }

    const rx = new RegExp(escapeRegex(raw), "i");
    const groups = {};

    // ---- Complaints (scoped by role) ----
    const complaintScope =
      role === "User"
        ? { createdBy: userId }
        : role === "InvestigationOfficer"
          ? { assignedTo: userId }
          : {};
    const complaints = await Complaint.find({
      ...complaintScope,
      $or: [
        { referenceId: rx },
        { complainantName: rx },
        { email: rx },
        { incidentType: rx },
        { department: rx },
        { city: rx },
        { status: rx },
        { incidentSummary: rx },
      ],
    })
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .limit(GROUP_LIMIT)
      .lean();
    groups.complaints = complaints.map(complaintSummary);

    // ---- Notifications (always own) ----
    const notifications = await Notification.find({
      recipient: userId,
      $or: [{ title: rx }, { message: rx }, { type: rx }],
    })
      .sort({ createdAt: -1 })
      .limit(GROUP_LIMIT)
      .lean();
    groups.notifications = notifications.map((n) => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
    }));

    // ---- Support tickets ----
    const ticketScope = role === "Admin" ? {} : { requester: userId };
    const tickets = await SupportTicket.find({
      ...ticketScope,
      $or: [
        { subject: rx },
        { message: rx },
        { category: rx },
        { status: rx },
        { requesterName: rx },
        { requesterEmail: rx },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(GROUP_LIMIT)
      .lean();
    groups.supportTickets = tickets.map((t) => ({
      _id: t._id,
      subject: t.subject,
      category: t.category,
      status: t.status,
      requesterName: t.requesterName,
      createdAt: t.createdAt,
    }));

    // ---- Users / officers (Admin only) ----
    if (role === "Admin") {
      const users = await User.find({
        $or: [{ name: rx }, { email: rx }, { unit: rx }, { cnic: rx }, { phoneNumber: rx }],
      })
        .select("name email role unit status isApprovedOfficer")
        .sort({ createdAt: -1 })
        .limit(GROUP_LIMIT)
        .lean();
      groups.users = users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        unit: u.unit || "",
        status: u.status,
        isApprovedOfficer: u.isApprovedOfficer,
      }));
    }

    // ---- Assignments (Admin + Officer) ----
    if (role === "Admin" || role === "InvestigationOfficer") {
      const assignmentScope = role === "Admin" ? {} : { assignedTo: userId };
      const assignments = await Assignment.find(assignmentScope)
        .populate("complaint", "referenceId incidentType status")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 })
        .limit(40)
        .lean();
      groups.assignments = assignments
        .filter((a) => {
          const c = a.complaint;
          if (!c) return false;
          return (
            rx.test(c.referenceId || "") ||
            rx.test(c.incidentType || "") ||
            rx.test(c.status || "") ||
            rx.test(a.status || "")
          );
        })
        .slice(0, GROUP_LIMIT)
        .map((a) => ({
          _id: a._id,
          status: a.status,
          complaint: a.complaint
            ? {
                _id: a.complaint._id,
                referenceId: a.complaint.referenceId,
                incidentType: a.complaint.incidentType,
                status: a.complaint.status,
              }
            : null,
          assignedTo: a.assignedTo ? { _id: a.assignedTo._id, name: a.assignedTo.name } : null,
        }));
    }

    const total = Object.values(groups).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    return res.json({ query: raw, groups, total });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Search failed" });
  }
}

module.exports = { globalSearch };
