const Assignment = require("../models/Assignment");
const Complaint = require("../models/Complaint");
const User = require("../models/User");

async function listMyAssignments(req, res) {
  try {
    const userId = req.user.userId;
    const assignments = await Assignment.find({ assignedTo: userId })
      .populate("complaint", "referenceId incidentType status severity createdBy")
      .sort({ createdAt: -1 });
    return res.json({ assignments });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load assignments" });
  }
}

async function listAssignments(req, res) {
  try {
    const assignments = await Assignment.find({})
      .populate("assignedTo", "name email role")
      .populate("complaint", "referenceId incidentType status severity")
      .sort({ createdAt: -1 });
    return res.json({ assignments });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load assignments" });
  }
}

async function createAssignment(req, res) {
  try {
    const { complaintId, officerId, notes } = req.body || {};
    if (!complaintId || !officerId) {
      return res.status(400).json({ message: "complaintId and officerId are required" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const officer = await User.findById(officerId);
    if (
      !officer ||
      officer.role !== "InvestigationOfficer" ||
      !officer.isApprovedOfficer ||
      officer.status !== "Active"
    ) {
      return res.status(400).json({ message: "officerId must be an approved InvestigationOfficer" });
    }
    if (!String(officer.unit || "").trim()) {
      return res.status(400).json({ message: "Officer must have a department" });
    }
    const officerDepartment = String(officer.unit || "").trim().toLowerCase();
    const complaintDepartment = String(complaint.department || "").trim().toLowerCase();
    if (complaintDepartment && officerDepartment !== complaintDepartment) {
      return res.status(400).json({
        message: "Officer department does not match complaint department",
      });
    }

    const assignment = await Assignment.findOneAndUpdate(
      { complaint: complaint._id },
      {
        $set: {
          complaint: complaint._id,
          assignedTo: officer._id,
          status: "Assigned",
          notes: notes ? String(notes).trim() : "",
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    complaint.assignedTo = officer._id;
    complaint.status = "Under Investigation";
    if (notes && String(notes).trim().length > 0) {
      complaint.caseNotes.push({ author: req.user.userId, text: String(notes).trim() });
    }
    await complaint.save();

    return res.status(201).json({ assignment, complaint });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to create assignment" });
  }
}

async function updateAssignment(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};

    const assignment = await Assignment.findById(id).populate("assignedTo", "role");
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const role = req.user.role;
    const userId = req.user.userId;

    if (role !== "Admin") {
      if (role !== "InvestigationOfficer") return res.status(403).json({ message: "Forbidden" });
      if (assignment.assignedTo?._id?.toString?.() !== userId?.toString?.()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (notes !== undefined) assignment.notes = String(notes);
    if (status !== undefined) assignment.status = status;
    await assignment.save();

    return res.json({ assignment });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to update assignment" });
  }
}

async function deleteAssignment(req, res) {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    return res.json({ message: "Assignment deleted" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to delete assignment" });
  }
}

module.exports = {
  listMyAssignments,
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};

