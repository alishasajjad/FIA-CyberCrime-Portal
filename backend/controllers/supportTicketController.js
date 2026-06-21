const SupportTicket = require("../models/SupportTicket");
const { createNotification } = require("../utils/notify");
const { recordAudit } = require("../utils/audit");
const { emitToRole } = require("../utils/realtime");
const Faq = require("../models/Faq");

async function createTicket(req, res) {
  try {
    const { requesterName, requesterEmail, subject, message, category } = req.body || {};
    if (!subject || !message) {
      return res.status(400).json({ message: "subject and message are required" });
    }

    const saved = await SupportTicket.create({
      requester: req.user?.userId,
      requesterName: requesterName || "",
      requesterEmail: requesterEmail || "",
      category: category || "General",
      subject: String(subject).trim(),
      message: String(message).trim(),
      status: "Open",
    });

    await createNotification({
      recipient: req.user?.userId,
      title: "Support ticket created",
      message: `Ticket "${saved.subject}" has been created with status Open.`,
      type: "Support",
      meta: { ticketId: saved._id, status: saved.status },
    });

    recordAudit({
      req,
      action: "SUPPORT_TICKET_CREATED",
      entityType: "SupportTicket",
      entityId: saved._id,
      summary: `Support ticket created — "${saved.subject}" (${saved.category})`,
      meta: { ticketId: saved._id },
    });

    emitToRole("Admin", "ticket:updated", { ticketId: String(saved._id), status: saved.status });

    return res.status(201).json({ ticket: saved });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to create ticket" });
  }
}

async function listTickets(req, res) {
  try {
    const role = req.user?.role;
    const filter = role === "User" ? { requester: req.user?.userId } : {};
    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({ tickets });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to list tickets" });
  }
}

async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body || {};
    const update = {};
    if (status) update.status = status;
    if (adminReply !== undefined) update.adminReply = String(adminReply || "").trim();
    if (status === "Closed") update.resolvedAt = new Date();
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      update,
      { returnDocument: "after" }
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.requester) {
      await createNotification({
        recipient: ticket.requester,
        title: "Support ticket updated",
        message: `Ticket "${ticket.subject}" is now ${ticket.status}.`,
        type: "Support",
        meta: { ticketId: ticket._id, status: ticket.status },
      });
    }

    recordAudit({
      req,
      action: "SUPPORT_TICKET_UPDATED",
      entityType: "SupportTicket",
      entityId: ticket._id,
      summary: `Support ticket "${ticket.subject}" updated to ${ticket.status}`,
      meta: { ticketId: ticket._id, status: ticket.status },
    });

    emitToRole("Admin", "ticket:updated", { ticketId: String(ticket._id), status: ticket.status });

    return res.json({ ticket });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to update ticket" });
  }
}

async function deleteTicket(req, res) {
  try {
    const { id } = req.params;
    const result = await SupportTicket.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: "Ticket not found" });
    return res.json({ message: "Ticket deleted" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Delete failed" });
  }
}

async function submitFeedback(req, res) {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body || {};
    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.requester?.toString() !== req.user?.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (ticket.status !== "Closed") {
      return res.status(400).json({ message: "Feedback is allowed only for closed tickets" });
    }
    ticket.rating = Number(rating);
    ticket.feedback = String(feedback || "").trim();
    await ticket.save();
    return res.json({ ticket });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to submit feedback" });
  }
}

async function listFaq(req, res) {
  try {
    const faqs = await Faq.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .limit(50);
    return res.json({ faqs });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load FAQ" });
  }
}

module.exports = {
  createTicket,
  listTickets,
  updateTicket,
  deleteTicket,
  submitFeedback,
  listFaq,
};

