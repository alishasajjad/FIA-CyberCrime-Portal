import React from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "services/api";
import { SectionCard, EmptyState, TableSkeleton } from "components/ui";
import {
  MdDrafts,
  MdPlayArrow,
  MdDelete,
  MdAdd,
  MdLocationCity,
} from "react-icons/md";

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/drafts");
      setDrafts(Array.isArray(data?.drafts) ? data.drafts : []);
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    try {
      await apiFetch(`/drafts/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      window.alert(err?.message || "Failed to delete draft");
    }
  };

  const continueDraft = (id) => navigate(`/admin/report-crime?draft=${id}`);

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdDrafts className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              My Draft Complaints
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Continue an unfinished complaint or remove drafts you no longer
              need. Drafts auto-save while you type.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/report-crime")}
          className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500"
        >
          <MdAdd className="h-4 w-4" aria-hidden /> New Complaint
        </button>
      </div>

      <SectionCard
        title="Saved Drafts"
        subtitle={loading ? undefined : `${drafts.length} draft${drafts.length === 1 ? "" : "s"} saved`}
      >
        {loading ? (
          <TableSkeleton rows={4} cols={1} />
        ) : drafts.length === 0 ? (
          <EmptyState
            icon={MdDrafts}
            title="No drafts yet"
            message="Start a complaint and it will be saved here automatically until you submit it."
            action={
              <button
                type="button"
                onClick={() => navigate("/admin/report-crime")}
                className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                File a complaint
              </button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {drafts.map((d) => {
              const data = d.data || {};
              return (
                <li
                  key={d._id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-150 bg-gray-50/60 p-4 transition-colors hover:border-brand-200 dark:border-navy-700 dark:bg-navy-900/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy-900 dark:text-white">
                      {d.title || data.incidentType || "Untitled draft"}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {data.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MdLocationCity className="h-3.5 w-3.5" aria-hidden />
                          {data.city}
                        </span>
                      ) : null}
                      <span>Updated {new Date(d.updatedAt).toLocaleString()}</span>
                    </p>
                    {data.incidentSummary ? (
                      <p className="mt-1 max-w-xl truncate text-xs text-gray-500 dark:text-gray-400">
                        {data.incidentSummary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => continueDraft(d._id)}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <MdPlayArrow className="h-4 w-4" aria-hidden /> Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(d._id)}
                      aria-label="Delete draft"
                      className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-navy-800"
                    >
                      <MdDelete className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default Drafts;
