const fs = require("fs");
const Evidence = require("../models/Evidence");
const Complaint = require("../models/Complaint");
const appConfig = require("../config/appConfig");
const { createNotification } = require("../utils/notify");
const { recordAudit } = require("../utils/audit");
const { isCloudStorage, uploadBufferToCloud } = require("../utils/storage");
const { resolveFileUrl } = require("../utils/fileUrl");

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

function senderInfo(uploadedBy) {
  if (uploadedBy && typeof uploadedBy === "object" && uploadedBy.name) {
    return { _id: uploadedBy._id, name: uploadedBy.name, role: uploadedBy.role };
  }
  return uploadedBy ? { _id: uploadedBy } : null;
}

function toEvidenceResponse(e) {
  return {
    _id: e._id,
    complaint: e.complaint,
    uploadedBy: senderInfo(e.uploadedBy),
    originalName: e.originalName,
    mimeType: e.mimeType,
    size: e.size,
    message: e.message || "",
    createdAt: e.createdAt,
    fileUrl: resolveFileUrl(e.filePath),
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

    const message = String(req.body?.message || "").trim();

    let evidenceDocs;
    if (isCloudStorage()) {
      // Files are buffered in memory; stream each to Cloudinary and persist
      // the returned secure URL as filePath.
      evidenceDocs = await Promise.all(
        files.map(async (f) => {
          const result = await uploadBufferToCloud(f);
          return {
            complaint: complaint._id,
            uploadedBy: userId,
            originalName: f.originalname,
            filePath: result.secure_url,
            mimeType: f.mimetype,
            size: f.size || result.bytes || 0,
            message,
          };
        })
      );
    } else {
      evidenceDocs = files.map((f) => ({
        complaint: complaint._id,
        uploadedBy: userId,
        originalName: f.originalname,
        filePath: f.path,
        mimeType: f.mimetype,
        size: f.size,
        message,
      }));
    }

    const saved = await Evidence.insertMany(evidenceDocs);

    // Persist references on complaint for quick lookups.
    complaint.evidence = [...(complaint.evidence || []), ...saved.map((e) => e._id)];
    await complaint.save();

    // Re-fetch with sender details so the thread shows who submitted what.
    const populated = await Evidence.find({ _id: { $in: saved.map((e) => e._id) } })
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });

    // Notify the counterpart so the communication thread feels live (best-effort).
    try {
      const fileCount = saved.length;
      const summary = message
        ? `${fileCount} file(s) with a message`
        : `${fileCount} file(s)`;
      if (role === "InvestigationOfficer" && complaint.createdBy) {
        await createNotification({
          recipient: complaint.createdBy,
          title: "New case update",
          message: `An officer added ${summary} to complaint ${complaint.referenceId}.`,
          type: "Complaint",
          meta: { complaintId: complaint._id },
        });
      } else if (role === "User" && complaint.assignedTo) {
        await createNotification({
          recipient: complaint.assignedTo,
          title: "New evidence submitted",
          message: `The complainant added ${summary} to complaint ${complaint.referenceId}.`,
          type: "Complaint",
          meta: { complaintId: complaint._id },
        });
      }
    } catch {
      // Notification failure must not block evidence submission.
    }

    recordAudit({
      req,
      action: "EVIDENCE_UPLOADED",
      entityType: "Evidence",
      entityId: complaint._id,
      complaint: complaint._id,
      summary: `${saved.length} evidence file(s) uploaded to ${complaint.referenceId}`,
      meta: { count: saved.length, hasMessage: !!message },
    });

    return res.status(201).json({
      evidence: populated.map((e) => toEvidenceResponse(e)),
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

    const evidence = await Evidence.find({ complaint: id })
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });
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

