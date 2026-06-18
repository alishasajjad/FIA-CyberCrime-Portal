import React from "react";
import { apiFetch } from "services/api";

const Evidence = () => {
  const [cases, setCases] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [evidence, setEvidence] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

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
    const data = await apiFetch(`/complaints/${caseId}/evidence`);
    setEvidence(Array.isArray(data?.evidence) ? data.evidence : []);
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
    if (files.length === 0) {
      window.alert("Choose at least one file.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("evidenceFiles", f));

      await apiFetch(`/complaints/${selectedId}/evidence`, {
        method: "POST",
        body: formData,
      });

      window.alert("Evidence uploaded.");
      await fetchEvidence(selectedId);
      input.value = "";
    } catch (err) {
      window.alert(err?.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Evidence Intake
            </h2>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Upload files for cases assigned to you. Evidence is stored securely against
              the selected complaint.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all dark:bg-brand-600 dark:hover:bg-brand-500"
            onClick={() => fetchCases().catch((e) => window.alert(e?.message))}
          >
            Refresh Cases
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">
              Assigned Case
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {cases.length === 0 ? (
                <option value="">No assigned cases</option>
              ) : null}
              {cases.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.referenceId || c._id} — {c.incidentType}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">
              Upload Evidence Files
            </label>
            <input
              id="evidenceFiles"
              type="file"
              multiple
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="button"
              className="rounded-xl bg-green-700 hover:bg-green-800 px-6 py-3 text-sm font-bold text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500"
              onClick={handleUpload}
              disabled={loading || !selectedId}
            >
              {loading ? "Uploading…" : "Upload Evidence"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">
          Evidence Files
        </h3>
        {evidence.length === 0 ? (
          <p className="mt-2 text-sm text-gray-650 dark:text-gray-300">
            No evidence uploaded yet for this case.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-white/10">
              <thead className="bg-green-50/50 dark:bg-navy-900">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                    Size
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {evidence.map((e) => (
                  <tr
                    key={e._id}
                    className="hover:bg-green-50/40 dark:hover:bg-navy-900/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-navy-900 dark:text-white">
                      {e.originalName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {e.mimeType}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">
                      {e.size.toLocaleString()} bytes
                    </td>
                    <td className="px-4 py-3">
                      {e.fileUrl ? (
                        <a
                          href={e.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-green-700 hover:text-green-800 hover:underline dark:text-green-400 dark:hover:text-green-300"
                        >
                          View File
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500 font-medium">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evidence;
