const mongoose = require("mongoose");
const ComplaintDraft = require("../models/ComplaintDraft");

const MAX_DRAFTS_PER_USER = 25;

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function deriveTitle(data, fallback) {
  const t = data?.incidentType || data?.title || "";
  const city = data?.city ? ` · ${data.city}` : "";
  return (t ? `${t}${city}` : fallback || "Untitled draft").slice(0, 120);
}

async function listMyDrafts(req, res) {
  try {
    const drafts = await ComplaintDraft.find({ owner: req.user.userId })
      .sort({ updatedAt: -1 })
      .limit(MAX_DRAFTS_PER_USER);
    return res.json({ drafts });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load drafts" });
  }
}

async function getDraft(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid draft id" });
    const draft = await ComplaintDraft.findOne({ _id: id, owner: req.user.userId });
    if (!draft) return res.status(404).json({ message: "Draft not found" });
    return res.json({ draft });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to load draft" });
  }
}

// Create a new draft or update an existing one (upsert by optional id).
async function saveDraft(req, res) {
  try {
    const { id, data, title } = req.body || {};
    const safeData = data && typeof data === "object" ? data : {};
    const resolvedTitle = (title && String(title).trim()) || deriveTitle(safeData);

    if (id) {
      if (!isValidId(id)) return res.status(400).json({ message: "Invalid draft id" });
      const updated = await ComplaintDraft.findOneAndUpdate(
        { _id: id, owner: req.user.userId },
        { $set: { data: safeData, title: resolvedTitle } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Draft not found" });
      return res.json({ draft: updated });
    }

    // Enforce a sane per-user cap (prune oldest beyond the limit).
    const count = await ComplaintDraft.countDocuments({ owner: req.user.userId });
    if (count >= MAX_DRAFTS_PER_USER) {
      const oldest = await ComplaintDraft.find({ owner: req.user.userId })
        .sort({ updatedAt: 1 })
        .limit(count - MAX_DRAFTS_PER_USER + 1)
        .select("_id");
      await ComplaintDraft.deleteMany({ _id: { $in: oldest.map((d) => d._id) } });
    }

    const draft = await ComplaintDraft.create({
      owner: req.user.userId,
      data: safeData,
      title: resolvedTitle,
    });
    return res.status(201).json({ draft });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to save draft" });
  }
}

async function deleteDraft(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid draft id" });
    const deleted = await ComplaintDraft.findOneAndDelete({
      _id: id,
      owner: req.user.userId,
    });
    if (!deleted) return res.status(404).json({ message: "Draft not found" });
    return res.json({ message: "Draft deleted" });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to delete draft" });
  }
}

module.exports = { listMyDrafts, getDraft, saveDraft, deleteDraft };
