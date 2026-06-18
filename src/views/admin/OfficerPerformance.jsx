import React from "react";
import { apiFetch } from "services/api";
import { StatCard, SectionCard, TableSkeleton, EmptyState } from "components/ui";
import {
  MdLeaderboard,
  MdGroups,
  MdTaskAlt,
  MdTimer,
  MdRefresh,
  MdEmojiEvents,
} from "react-icons/md";

const WORKLOAD = (active) =>
  active >= 8
    ? { label: "Heavy", cls: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" }
    : active >= 4
    ? { label: "Moderate", cls: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" }
    : { label: "Light", cls: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" };

const OfficerPerformance = () => {
  const [officers, setOfficers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/reports/officer-performance");
      setOfficers(Array.isArray(data?.officers) ? data.officers : []);
    } catch (err) {
      setError(err?.message || "Failed to load officer performance.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalAssigned = officers.reduce((s, o) => s + o.assigned, 0);
  const totalResolved = officers.reduce((s, o) => s + o.resolved, 0);
  const respTimes = officers.filter((o) => o.avgResponseHours != null);
  const avgResp = respTimes.length
    ? Math.round(respTimes.reduce((s, o) => s + o.avgResponseHours, 0) / respTimes.length)
    : null;

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdLeaderboard className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Officer Performance Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Productivity analytics, workload indicators, and performance
              rankings for investigation officers.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
        >
          <MdRefresh className="h-4 w-4" aria-hidden /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdGroups} label="Officers" value={officers.length} accent="brand" loading={loading} />
        <StatCard icon={MdTaskAlt} label="Cases Assigned" value={totalAssigned} accent="blue" loading={loading} />
        <StatCard icon={MdEmojiEvents} label="Cases Resolved" value={totalResolved} accent="navy" loading={loading} />
        <StatCard icon={MdTimer} label="Avg Response" value={avgResp != null ? `${avgResp}h` : "—"} accent="amber" loading={loading} />
      </div>

      <SectionCard title="Performance Rankings" subtitle="Ranked by resolved cases and resolution rate">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : error ? (
          <EmptyState icon={MdLeaderboard} title="Could not load data" message={error} />
        ) : officers.length === 0 ? (
          <EmptyState icon={MdGroups} title="No officers found" message="Approved investigation officers will appear here with their metrics." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm dark:divide-white/10">
              <thead className="bg-green-50/50 dark:bg-navy-900">
                <tr>
                  {["#", "Officer", "Unit", "Assigned", "Active", "Resolved", "Resolution", "Avg Response", "Workload"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {officers.map((o, i) => {
                  const wl = WORKLOAD(o.active);
                  return (
                    <tr key={o.id} className="hover:bg-green-50/50 dark:hover:bg-navy-900/60">
                      <td className="px-4 py-3">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-gray-300"
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy-900 dark:text-white">
                        {o.name}
                        {!o.approved ? (
                          <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Pending</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{o.unit}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{o.assigned}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{o.active}</td>
                      <td className="px-4 py-3 font-semibold text-navy-900 dark:text-white">{o.resolved}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-900">
                            <div className="h-full rounded-full bg-brand-600" style={{ width: `${o.resolutionRate}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{o.resolutionRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {o.avgResponseHours != null ? `${o.avgResponseHours}h` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${wl.cls}`}>
                          {wl.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default OfficerPerformance;
