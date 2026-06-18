const Complaint = require("../models/Complaint");
const ComplaintMessage = require("../models/ComplaintMessage");

function hasAccess(role, complaint, userId) {
  if (!complaint) return false;
  if (role === "Admin") return true;
  if (role === "User") return complaint.createdBy?.toString?.() === userId?.toString?.();
  if (role === "InvestigationOfficer") {
    return complaint.assignedTo?.toString?.() === userId?.toString?.();
  }
  return false;
}

async function postMessage(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body || {};

    if (!message || String(message).trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!hasAccess(role, complaint, userId)) return res.status(403).json({ message: "Forbidden" });

    const saved = await ComplaintMessage.create({
      complaint: complaint._id,
      sender: userId,
      senderRole: role,
      message: String(message).trim(),
    });

    return res.status(201).json({ message: saved });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to post message" });
  }
}

async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (!hasAccess(role, complaint, userId)) return res.status(403).json({ message: "Forbidden" });

    const messages = await ComplaintMessage.find({ complaint: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name email role");

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to fetch messages" });
  }
}

module.exports = { postMessage, getMessages };

