import React from "react";
import { apiFetch } from "services/api";
import { SectionCard, TableSkeleton, EmptyState, StatCard } from "components/ui";
import {
  MdHistory,
  MdPersonAdd,
  MdReport,
  MdCheckCircle,
  MdAssignmentInd,
  MdAttachFile,
  MdChat,
  MdManageAccounts,
  MdSearch,
  MdRefresh,
  MdDownload,
  MdPriorityHigh,
} from "react-icons/md";

const TYPE_META = {
  Registration: { icon: MdPersonAdd, color: "text-blue-600 bg-blue-500/10" },
  Complaint: { icon: MdReport, color: "text-brand-600 bg-brand-600/10" },
  Resolution: { icon: MdCheckCircle, color: "text-green-600 bg-green-500/10" },
  Assignment: { icon: MdAssignmentInd, color: "text-amber-600 bg-amber-500/10" },
  Evidence: { icon: MdAttachFile, color: "text-purple-600 bg-purple-500/10" },
  Message: { icon: MdChat, color: "text-cyan-600 bg-cyan-500/10" },
  Escalation: { icon: MdPriorityHigh, color: "text-red-600 bg-red-500/10" },
  Account: { icon: MdManageAccounts, color: "text-gray-600 bg-gray-500/10" },
};
const FILTERS = ["All", "Registration", "Complaint", "Resolution", "Assignment", "Evidence", "Message", "Escalation", "Account"];

function relativeTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (Number.isNaN(diff)) return "";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const AuditLog = () => {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [filter, setFilter] = React.useState("All");
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/reports/audit-log?limit=200");
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (err) {
      setError(err?.message || "Failed to load audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = events.filter((e) => {
    if (filter !== "All" && e.type !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(e.summary || "").toLowerCase().includes(q) ||
      String(e.actor || "").toLowerCase().includes(q) ||
      String(e.ref || "").toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    const rows = [
      ["Timestamp", "Type", "Actor", "Summary", "Reference"],
      ...filtered.map((e) => [
        new Date(e.ts).toISOString(),
        e.type,
        e.actor,
        e.summary,
        e.ref || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fia-audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdHistory className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Audit Log Center
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Chronological record of all critical platform actions across users,
              complaints, assignments, evidence, and messaging.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
          >
            <MdRefresh className="h-4 w-4" aria-hidden /> Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            <MdDownload className="h-4 w-4" aria-hidden /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={MdHistory} label="Total Events" value={events.length} accent="brand" loading={loading} />
        <StatCard icon={MdReport} label="Complaints" value={events.filter((e) => e.type === "Complaint").length} accent="navy" loading={loading} />
        <StatCard icon={MdAssignmentInd} label="Assignments" value={events.filter((e) => e.type === "Assignment").length} accent="amber" loading={loading} />
        <StatCard icon={MdPersonAdd} label="Registrations" value={events.filter((e) => e.type === "Registration").length} accent="blue" loading={loading} />
      </div>

      <SectionCard>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <MdSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, actors, references…"
              className="w-full rounded-xl border border-gray-200 bg-lightPrimary py-2.5 pl-9 pr-3 text-sm text-navy-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  filter === f
                    ? "bg-brand-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={1} />
        ) : error ? (
          <EmptyState icon={MdHistory} title="Could not load audit log" message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={MdHistory} title="No matching events" message="Adjust your search or filter to see activity." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {filtered.map((e, i) => {
              const meta = TYPE_META[e.type] || TYPE_META.Account;
              const Icon = meta.icon;
              return (
                <li key={i} className="flex items-start gap-3 py-3.5">
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3">
                      <p className="text-sm font-semibold text-navy-900 dark:text-white">
                        {e.summary}
                      </p>
                      <span className="text-xs text-gray-400">{relativeTime(e.ts)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold uppercase tracking-wider text-gray-500 dark:bg-navy-900 dark:text-gray-400">
                        {e.type}
                      </span>
                      <span>{e.actor}</span>
                      {e.ref ? <span className="font-mono">· {e.ref}</span> : null}
                      <span>· {new Date(e.ts).toLocaleString()}</span>
                    </div>
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

export default AuditLog;
