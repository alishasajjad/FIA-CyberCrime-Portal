import React from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "services/api";
import {
  StatCard,
  SectionCard,
  TableSkeleton,
  EmptyState,
  SeverityBadge,
  StatusBadge,
} from "components/ui";
import { LineTrend, BarList } from "components/ui/charts";
import {
  MdPriorityHigh,
  MdWarningAmber,
  MdTimer,
  MdPersonOff,
  MdRefresh,
  MdOpenInNew,
  MdRule,
  MdPlayCircle,
  MdHistory,
  MdVerifiedUser,
} from "react-icons/md";

const PRIORITY_ORDER = ["Critical", "High", "Medium", "Low"];

const LOG_TYPE_STYLES = {
  Triggered: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  Reassigned: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  Queued: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Warning: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  Resolved: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  AdminOverride: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
};

function slaColor(pct, overdue) {
  if (overdue) return "bg-red-600";
  if (pct >= 75) return "bg-orange-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-green-500";
}

function ageLabel(hours) {
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
}

const Escalations = () => {
  const [cases, setCases] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [priority, setPriority] = React.useState("All");
  const [running, setRunning] = React.useState(false);
  const [runMsg, setRunMsg] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [liveData, statsData, logsData] = await Promise.all([
        apiFetch("/reports/escalations"),
        apiFetch("/escalations/stats").catch(() => null),
        apiFetch("/escalations/logs?limit=25").catch(() => null),
      ]);
      setCases(Array.isArray(liveData?.cases) ? liveData.cases : []);
      setStats(statsData);
      setLogs(Array.isArray(logsData?.logs) ? logsData.logs : []);
    } catch (err) {
      setError(err?.message || "Failed to load escalations.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const runNow = async () => {
    setRunning(true);
    setRunMsg("");
    try {
      const d = await apiFetch("/escalations/run", { method: "POST" });
      const s = d.summary || {};
      setRunMsg(
        s.skipped
          ? `Engine skipped (${s.reason}).`
          : `Processed ${s.processed ?? 0} · escalated ${s.escalated ?? 0} · reassigned ${s.reassigned ?? 0} · queued ${s.queued ?? 0}.`
      );
      await load();
    } catch (err) {
      setRunMsg(err?.message || "Run failed.");
    } finally {
      setRunning(false);
    }
  };

  const overdue = cases.filter((c) => c.overdue).length;
  const unassigned = cases.filter((c) => c.unassigned).length;
  const critical = cases.filter((c) => c.severity === "Critical").length;

  const filtered =
    priority === "All" ? cases : cases.filter((c) => c.severity === priority);

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <MdPriorityHigh className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Priority &amp; Escalation Management
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              SLA tracking for open cases. Overdue and unassigned high-priority
              complaints are flagged for immediate action.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/escalation-rules"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
          >
            <MdRule className="h-4 w-4" aria-hidden /> Rules
          </Link>
          <button
            type="button"
            onClick={runNow}
            disabled={running}
            className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            <MdPlayCircle className="h-4 w-4" aria-hidden /> {running ? "Running…" : "Run engine"}
          </button>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
          >
            <MdRefresh className="h-4 w-4" aria-hidden /> Refresh
          </button>
        </div>
      </div>

      {runMsg ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 dark:border-brand-900/40 dark:bg-brand-900/10 dark:text-brand-200">
          {runMsg}
        </div>
      ) : null}

      {/* Escalation engine analytics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdPriorityHigh} label="Active Escalations" value={stats?.activeEscalations ?? 0} accent="red" loading={loading} />
        <StatCard icon={MdVerifiedUser} label="SLA Compliance" value={`${stats?.slaCompliance ?? 100}%`} accent="navy" loading={loading} />
        <StatCard icon={MdHistory} label="Total Escalated" value={stats?.totalEscalated ?? 0} accent="amber" loading={loading} />
        <StatCard icon={MdTimer} label="Avg Resolve (esc.)" value={stats?.avgResolutionHoursAfterEscalation != null ? `${stats.avgResolutionHoursAfterEscalation}h` : "—"} accent="brand" loading={loading} />
      </div>

      {stats ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Escalation Trend" subtitle="Triggered escalations over time">
            <LineTrend points={stats.trend || []} color="#ef4444" />
          </SectionCard>
          <SectionCard title="Escalations by City">
            <BarList items={(stats.byCity || []).map((c) => ({ label: c.city, count: c.count }))} />
          </SectionCard>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdTimer} label="Open Cases" value={cases.length} accent="brand" loading={loading} />
        <StatCard icon={MdWarningAmber} label="Overdue (SLA)" value={overdue} accent="red" loading={loading} />
        <StatCard icon={MdPriorityHigh} label="Critical" value={critical} accent="amber" loading={loading} />
        <StatCard icon={MdPersonOff} label="Unassigned" value={unassigned} accent="navy" loading={loading} />
      </div>

      <SectionCard
        title="Open Case Queue"
        subtitle="Sorted by SLA consumption — most urgent first"
        action={
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-gray-200 bg-lightPrimary px-3 py-2 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
          >
            <option value="All">All priorities</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        }
      >
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <EmptyState icon={MdPriorityHigh} title="Could not load escalations" message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MdTimer}
            title={cases.length === 0 ? "No open cases" : "No cases match this priority"}
            message={cases.length === 0 ? "All complaints are resolved or closed." : "Try a different priority filter."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm dark:divide-white/10">
              <thead className="bg-green-50/50 dark:bg-navy-900">
                <tr>
                  {["Reference", "Type", "City", "Priority", "Status", "Age", "SLA", "Assigned", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id} className={`hover:bg-green-50/50 dark:hover:bg-navy-900/60 ${c.overdue ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-navy-900 dark:text-white">
                      {c.referenceId}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.incidentType}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.city}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={c.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{ageLabel(c.ageHours)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-900">
                          <div className={`h-full rounded-full ${slaColor(c.slaUsedPct, c.overdue)}`} style={{ width: `${Math.min(100, c.slaUsedPct)}%` }} />
                        </div>
                        {c.overdue ? (
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">Overdue</span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{c.slaUsedPct}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.assignedTo ? (
                        <span className="text-gray-700 dark:text-gray-200">{c.assignedTo}</span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/dashboard"
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline dark:text-brand-400"
                      >
                        Manage <MdOpenInNew className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Escalation history (append-only audit trail) */}
      <SectionCard
        title={<span className="flex items-center gap-2"><MdHistory className="h-5 w-5 text-brand-600" /> Escalation History</span>}
        subtitle="Immutable record of every escalation event"
      >
        {loading ? (
          <TableSkeleton rows={5} cols={1} />
        ) : logs.length === 0 ? (
          <EmptyState icon={MdHistory} title="No escalation events yet" message="Escalation events will appear here once the engine processes overdue cases." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {logs.map((l) => (
              <li key={l._id} className="flex items-start gap-3 py-3">
                <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${LOG_TYPE_STYLES[l.type] || "bg-gray-100 text-gray-600 dark:bg-navy-900 dark:text-gray-300"}`}>
                  {l.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-900 dark:text-white">
                    {l.referenceId || "—"} {l.level ? <span className="text-xs font-normal text-gray-400">· L{l.level}</span> : null}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {l.reason}
                    {l.toOfficer?.name ? ` → ${l.toOfficer.name}` : ""}
                    {l.fromOfficer?.name && l.toOfficer?.name ? ` (from ${l.fromOfficer.name})` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{new Date(l.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default Escalations;
