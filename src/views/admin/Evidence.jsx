import React from "react";
import { apiFetch } from "services/api";
import {
  SectionCard,
  EmptyState,
  TableSkeleton,
  StatusBadge,
  SeverityBadge,
} from "components/ui";
import EvidenceThread from "components/ui/EvidenceThread";
import {
  MdFolderSpecial,
  MdRefresh,
  MdCloudUpload,
  MdAttachFile,
} from "react-icons/md";

const Evidence = () => {
  const [cases, setCases] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [evidence, setEvidence] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [evidenceLoading, setEvidenceLoading] = React.useState(false);

  const fetchCases = async () => {
    const data = await apiFetch("/complaints/assigned");
    const list = Array.isArray(data?.complaints) ? data.complaints : [];
    setCases(list);
    setSelectedId((prev) => {
      if (prev && list.some((c) => c._id === prev)) return prev;
      return list[0]?._id || "";
    });
  };

  const fetchEvidence = async (caseId) => {
    if (!caseId) {
      setEvidence([]);
      return;
    }
    setEvidenceLoading(true);
    try {
      const data = await apiFetch(`/complaints/${caseId}/evidence`);
      setEvidence(Array.isArray(data?.evidence) ? data.evidence : []);
    } finally {
      setEvidenceLoading(false);
    }
  };

  React.useEffect(() => {
    const run = async () => {
      try {
        await fetchCases();
      } catch (err) {
        window.alert(err?.message || "Load error");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (selectedId) {
      fetchEvidence(selectedId).catch((err) =>
        window.alert(err?.message || "Evidence load error")
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleUpload = async () => {
    if (!selectedId) return;
    const input = document.getElementById("evidenceFiles");
    const files = input?.files ? Array.from(input.files) : [];
    const note = document.getElementById("evidenceMessage")?.value?.trim() || "";
    if (files.length === 0) {
      window.alert("Choose at least one file.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("evidenceFiles", f));
      if (note) formData.append("message", note);

      await apiFetch(`/complaints/${selectedId}/evidence`, {
        method: "POST",
        body: formData,
      });

      await fetchEvidence(selectedId);
      input.value = "";
      const msgEl = document.getElementById("evidenceMessage");
      if (msgEl) msgEl.value = "";
    } catch (err) {
      window.alert(err?.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  const activeCase = cases.find((c) => c._id === selectedId);

  return (
    <div className="mt-3 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdFolderSpecial className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Evidence & Case Communication
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Submit files together with a written note to build a complete,
              secure case record.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchCases().catch((e) => window.alert(e?.message))}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
        >
          <MdRefresh className="h-4 w-4" aria-hidden /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Upload panel */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Submit Evidence">
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">
                  Case
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                >
                  {cases.length === 0 ? <option value="">No cases available</option> : null}
                  {cases.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.referenceId || c._id} — {c.incidentType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">
                  Files
                </label>
                <input
                  id="evidenceFiles"
                  type="file"
                  multiple
                  className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Images, PDF, ZIP, TXT, CSV supported.
                </p>
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">
                  Message / Comment
                </label>
                <textarea
                  id="evidenceMessage"
                  rows="3"
                  placeholder="Describe what this evidence shows (optional)…"
                  className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !selectedId}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                <MdCloudUpload className="h-4 w-4" aria-hidden />
                {loading ? "Submitting…" : "Submit Evidence"}
              </button>
            </div>
          </SectionCard>

          {activeCase ? (
            <SectionCard title="Selected Case">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-navy-900 dark:text-white">
                    {activeCase.referenceId || activeCase._id}
                  </span>
                  <SeverityBadge severity={activeCase.severity} />
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {activeCase.incidentType}
                  {activeCase.city ? ` · ${activeCase.city}` : ""}
                </p>
                <StatusBadge status={activeCase.status} />
              </div>
            </SectionCard>
          ) : null}
        </div>

        {/* Thread panel */}
        <div className="lg:col-span-3">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <MdAttachFile className="h-5 w-5 text-brand-600" /> Evidence Thread
              </span>
            }
            subtitle="Files and notes submitted for this case, newest first."
          >
            {evidenceLoading ? (
              <TableSkeleton rows={3} cols={1} />
            ) : !selectedId ? (
              <EmptyState
                icon={MdFolderSpecial}
                title="No case selected"
                message="Select a case to view and submit evidence."
              />
            ) : (
              <EvidenceThread
                items={evidence}
                emptyHint="No evidence submitted yet. Use the form to add the first file."
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Evidence;
