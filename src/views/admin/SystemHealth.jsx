import React from "react";
import { apiFetch } from "services/api";
import { onSocket } from "services/socket";
import {
  StatCard,
  SectionCard,
  CardSkeleton,
  EmptyState,
} from "components/ui";
import { LineTrend } from "components/ui/charts";
import {
  MdMonitorHeart,
  MdReport,
  MdPeople,
  MdVerified,
  MdGroups,
  MdNotifications,
  MdRefresh,
  MdTrendingUp,
  MdCloudUpload,
  MdBolt,
  MdWifiTethering,
  MdSchedule,
  MdApi,
  MdInbox,
  MdHistory,
} from "react-icons/md";

const OPEN_STATUSES = ["Pending", "In Review", "Under Investigation"];

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Math.max(0, Date.now() - new Date(ts).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTIVITY_STYLES = {
  Registration: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  Complaint: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Resolution: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  Assignment: "bg-brand-600/10 text-brand-700 dark:text-brand-300",
  Evidence: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  Message: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  Account: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  Escalation: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

function fmtUptime(sec) {
  if (!sec && sec !== 0) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtBytes(bytes) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

const STATUS_COLORS = {
  Pending: "bg-gray-400",
  "In Review": "bg-blue-500",
  "Under Investigation": "bg-amber-500",
  Resolved: "bg-green-500",
  Closed: "bg-emerald-600",
};
const SEVERITY_COLORS = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-orange-500",
  Critical: "bg-red-600",
};

function Bar({ label, count, max, color }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-navy-900 dark:text-white">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{count}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-900">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const SystemHealth = () => {
  const [data, setData] = React.useState(null);
  const [apiHealth, setApiHealth] = React.useState(null);
  const [activity, setActivity] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState(null);

  const load = React.useCallback(async (silent) => {
    if (!silent) setLoading(true);
    setError("");

    // API health probe with client-measured latency.
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const [healthRes, sysRes, auditRes] = await Promise.allSettled([
      apiFetch("/health"),
      apiFetch("/reports/system-health"),
      apiFetch("/reports/audit-log?limit=12"),
    ]);
    const latency = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0
    );

    if (healthRes.status === "fulfilled") {
      setApiHealth({ ok: !!healthRes.value?.ok, latency, uptimeSec: healthRes.value?.uptimeSec });
    } else {
      setApiHealth({ ok: false, latency: null });
    }

    if (sysRes.status === "fulfilled") {
      setData(sysRes.value);
      setUpdatedAt(new Date());
    } else if (!silent) {
      setError(sysRes.reason?.message || "Failed to load system health.");
    }

    if (auditRes.status === "fulfilled") {
      setActivity(Array.isArray(auditRes.value?.events) ? auditRes.value.events : []);
    }

    if (!silent) setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
    // Realtime nudges from the server keep this live; a slow poll is the fallback.
    const id = setInterval(() => load(true), 60000);
    const offTick = onSocket("health:tick", () => load(true));
    const offStats = onSocket("stats:changed", () => load(true));
    const offAudit = onSocket("audit:new", () => load(true));
    return () => {
      clearInterval(id);
      offTick();
      offStats();
      offAudit();
    };
  }, [load]);

  const t = data?.totals || {};
  const maxStatus = Math.max(1, ...(data?.byStatus || []).map((s) => s.count));
  const maxSeverity = Math.max(1, ...(data?.bySeverity || []).map((s) => s.count));
  const maxMonth = Math.max(1, ...(data?.byMonth || []).map((s) => s.count));
  const queueSize = (data?.byStatus || [])
    .filter((s) => OPEN_STATUSES.includes(s.status))
    .reduce((sum, s) => sum + (s.count || 0), 0);

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdMonitorHeart className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              System Health Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Platform-wide operational summary: complaints, users, officer
              utilization, and notification metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live{updatedAt ? ` · ${timeAgo(updatedAt)}` : ""}
          </span>
          <button
            type="button"
            onClick={() => load()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
          >
            <MdRefresh className="h-4 w-4" aria-hidden /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <EmptyState icon={MdMonitorHeart} title="Could not load metrics" message={error} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard icon={MdReport} label="Total Complaints" value={t.totalComplaints ?? 0} accent="brand" loading={loading} />
            <StatCard icon={MdTrendingUp} label="Resolution Rate" value={`${data?.resolutionRate ?? 0}%`} accent="navy" loading={loading} />
            <StatCard icon={MdPeople} label="Total Users" value={t.totalUsers ?? 0} hint={`${t.activeUsers ?? 0} active`} accent="blue" loading={loading} />
            <StatCard icon={MdReport} label="High Severity Open" value={t.highSeverity ?? 0} accent="red" loading={loading} />
          </div>

          {/* Operational health (Phase C) */}
          <SectionCard
            title="Application Health"
            subtitle="Live application-level signals — no sensitive infrastructure exposed."
          >
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              <HealthTile
                icon={MdApi}
                label="API Status"
                value={apiHealth ? (apiHealth.ok ? "Operational" : "Down") : "…"}
                hint={apiHealth?.latency != null ? `${apiHealth.latency} ms` : undefined}
                ok={apiHealth?.ok}
              />
              <HealthTile
                icon={MdWifiTethering}
                label="Database"
                value={data?.db?.label === "connected" ? "Connected" : data?.db?.label || "—"}
                ok={data?.db?.state === 1}
              />
              <HealthTile icon={MdSchedule} label="Uptime" value={fmtUptime(data?.app?.uptimeSec)} ok />
              <HealthTile icon={MdInbox} label="Queue Size" value={queueSize} hint="open complaints" ok={queueSize === 0} />
              <HealthTile icon={MdGroups} label="Active Sessions" value={data?.sessions?.active ?? 0} ok />
              <HealthTile icon={MdGroups} label="Online Officers" value={data?.sessions?.onlineOfficers ?? 0} hint="estimated" ok />
              <HealthTile icon={MdBolt} label="New (24h)" value={data?.throughput?.last24h ?? 0} ok />
              <HealthTile icon={MdCloudUpload} label="Evidence Files" value={`${data?.uploads?.evidenceCount ?? 0}`} hint={fmtBytes(data?.uploads?.totalBytes)} ok />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Actual metric</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Estimated</span>
              <span>· Online officers ({data?.sessions?.onlineOfficers ?? 0}) is <span className="font-semibold text-amber-500">estimated</span> from active sessions; env: {data?.app?.nodeEnv}</span>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Complaints by Status">
              {loading ? (
                <CardSkeleton lines={5} />
              ) : (
                <div className="space-y-3.5">
                  {(data?.byStatus || []).map((s) => (
                    <Bar key={s.status} label={s.status} count={s.count} max={maxStatus} color={STATUS_COLORS[s.status] || "bg-gray-400"} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Complaints by Severity">
              {loading ? (
                <CardSkeleton lines={4} />
              ) : (
                <div className="space-y-3.5">
                  {(data?.bySeverity || []).map((s) => (
                    <Bar key={s.severity} label={s.severity} count={s.count} max={maxSeverity} color={SEVERITY_COLORS[s.severity] || "bg-gray-400"} />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Complaint Trend" subtitle="Submissions over recent months">
            {loading ? (
              <CardSkeleton lines={2} />
            ) : (data?.byMonth || []).length === 0 ? (
              <EmptyState icon={MdTrendingUp} title="No trend data yet" />
            ) : (
              <div className="flex items-end gap-3 overflow-x-auto pt-4">
                {data.byMonth.map((m) => (
                  <div key={m.label} className="flex min-w-[48px] flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-bold text-navy-900 dark:text-white">{m.count}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400"
                      style={{ height: `${Math.max(8, (m.count / maxMonth) * 140)}px` }}
                    />
                    <span className="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard title="User Breakdown">
              <ul className="space-y-3 text-sm">
                {[
                  { icon: MdVerified, label: "Administrators", val: data?.users?.admins },
                  { icon: MdGroups, label: "Investigation Officers", val: data?.users?.officers },
                  { icon: MdGroups, label: "Pending Officers", val: data?.users?.pendingOfficers },
                  { icon: MdPeople, label: "Citizens", val: data?.users?.users },
                ].map((r) => (
                  <li key={r.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <r.icon className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
                      {r.label}
                    </span>
                    <span className="font-bold text-navy-900 dark:text-white">{loading ? "…" : r.val ?? 0}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Officer Utilization">
              <div className="space-y-3 text-sm">
                <Row label="Active officers" value={data?.officerUtilization?.activeOfficers} loading={loading} />
                <Row label="Assigned open cases" value={data?.officerUtilization?.assignedOpenCases} loading={loading} />
                <Row label="Avg open / officer" value={data?.officerUtilization?.avgOpenPerOfficer} loading={loading} />
              </div>
            </SectionCard>

            <SectionCard title="Notifications">
              <div className="space-y-3 text-sm">
                <Row icon={MdNotifications} label="Total sent" value={data?.notifications?.total} loading={loading} />
                <Row icon={MdNotifications} label="Currently unread" value={data?.notifications?.unread} loading={loading} />
              </div>
            </SectionCard>
          </div>

          {/* User growth + officer workload distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="User Growth" subtitle="New registrations over recent months">
              {loading ? (
                <CardSkeleton lines={2} />
              ) : (
                <LineTrend points={data?.userGrowth || []} color="#0ea5e9" />
              )}
            </SectionCard>

            <SectionCard title="Officer Workload Distribution" subtitle="Open cases per officer (top 8)">
              {loading ? (
                <CardSkeleton lines={4} />
              ) : (data?.officerWorkload || []).length === 0 ? (
                <EmptyState icon={MdGroups} title="No assigned workload" />
              ) : (
                <div className="space-y-3">
                  {data.officerWorkload.map((o) => (
                    <Bar
                      key={o.name}
                      label={`${o.name} (${o.unit})`}
                      count={o.open}
                      max={Math.max(1, ...data.officerWorkload.map((x) => x.open))}
                      color="bg-brand-600"
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title={<span className="flex items-center gap-2"><MdHistory className="h-5 w-5 text-brand-600" /> Recent System Activity</span>}
            subtitle="Live feed of the latest platform events"
          >
            {loading && activity.length === 0 ? (
              <CardSkeleton lines={5} />
            ) : activity.length === 0 ? (
              <EmptyState icon={MdHistory} title="No recent activity" />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/5">
                {activity.map((e, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        ACTIVITY_STYLES[e.type] || "bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-300"
                      }`}
                    >
                      {e.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-navy-900 dark:text-white">
                        {e.summary}
                        {e.ref ? <span className="ml-1 font-mono text-xs text-gray-400">· {e.ref}</span> : null}
                      </p>
                      <p className="text-xs text-gray-400">{e.actor}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{timeAgo(e.ts)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
};

function HealthTile({ icon: Icon, label, value, hint, ok }) {
  return (
    <div className="rounded-xl border border-gray-150 bg-gray-50/60 p-3 dark:border-navy-700 dark:bg-navy-900/40">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-gray-400" aria-hidden />
        <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} aria-hidden />
      </div>
      <p className="mt-2 truncate text-lg font-bold text-navy-900 dark:text-white">{value}</p>
      <p className="truncate text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
      {hint ? <p className="truncate text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

function Row({ icon: Icon, label, value, loading }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
        {Icon ? <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden /> : null}
        {label}
      </span>
      <span className="font-bold text-navy-900 dark:text-white">{loading ? "…" : value ?? 0}</span>
    </div>
  );
}

export default SystemHealth;
