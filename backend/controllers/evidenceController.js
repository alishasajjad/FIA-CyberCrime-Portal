const path = require("path");
const fs = require("fs");
const Evidence = require("../models/Evidence");
const Complaint = require("../models/Complaint");
const appConfig = require("../config/appConfig");

function hasAccess(role, complaint, userId) {
  if (!complaint) return false;
  if (role === "Admin") return true;
  if (role === "User") {
    return complaint.createdBy?.toString?.() === userId?.toString?.();
  }
  if (role === "InvestigationOfficer") {
    return complaint.assignedTo?.toString?.() === userId?.toString?.();
  }
  return false;
}

function toEvidenceResponse(e) {
  const fileName = e.filePath ? path.basename(e.filePath) : "";
  return {
    _id: e._id,
    complaint: e.complaint,
    uploadedBy: e.uploadedBy,
    originalName: e.originalName,
    mimeType: e.mimeType,
    size: e.size,
    fileUrl: fileName ? `http://localhost:${process.env.PORT || 5000}/uploads/${fileName}` : null,
  };
}

async function uploadEvidence(req, res, next) {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (!hasAccess(role, complaint, userId)) return res.status(403).json({ message: "Forbidden" });

    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ message: "No files uploaded" });

    const evidenceDocs = files.map((f) => ({
      complaint: complaint._id,
      uploadedBy: userId,
      originalName: f.originalname,
      filePath: f.path,
      mimeType: f.mimetype,
      size: f.size,
    }));

    const saved = await Evidence.insertMany(evidenceDocs);

    // Persist references on complaint for quick lookups.
    complaint.evidence = [...(complaint.evidence || []), ...saved.map((e) => e._id)];
    await complaint.save();

    return res.status(201).json({
      evidence: saved.map((e) => toEvidenceResponse(e)),
    });
  } catch (err) {
    const files = req.files || [];
    for (const file of files) {
      if (file?.path) fs.unlink(file.path, () => null);
    }
    return next(err);
  }
}

async function listEvidence(req, res) {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (!hasAccess(role, complaint, userId)) return res.status(403).json({ message: "Forbidden" });

    const evidence = await Evidence.find({ complaint: id }).sort({ createdAt: -1 });
    return res.json({ evidence: evidence.map((e) => toEvidenceResponse(e)) });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to list evidence" });
  }
}

async function deleteEvidence(req, res) {
  try {
    const { evidenceId } = req.params;
    if (req.user?.role !== "Admin") return res.status(403).json({ message: "Forbidden" });

    await Evidence.findByIdAndDelete(evidenceId);
    return res.json({ message: "Evidence deleted" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Delete failed" });
  }
}

module.exports = { uploadEvidence, listEvidence, deleteEvidence };

