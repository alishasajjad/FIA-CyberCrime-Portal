import React from "react";
import { apiFetch } from "services/api";
import { onSocket } from "services/socket";
import { SectionCard, TableSkeleton, EmptyState, StatCard } from "components/ui";
import { downloadCsv, sectionsToCsv } from "utils/exporters";
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
  MdLogin,
  MdLogout,
  MdDelete,
  MdClose,
  MdFilterAltOff,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";

// Friendly labels + styling for the persistent audit actions.
const ACTION_META = {
  USER_REGISTERED: { label: "User Registered", icon: MdPersonAdd, color: "text-blue-600 bg-blue-500/10" },
  USER_LOGIN: { label: "Login", icon: MdLogin, color: "text-teal-600 bg-teal-500/10" },
  USER_LOGOUT: { label: "Logout", icon: MdLogout, color: "text-gray-600 bg-gray-500/10" },
  USER_UPDATED: { label: "User Updated", icon: MdManageAccounts, color: "text-gray-600 bg-gray-500/10" },
  USER_DELETED: { label: "User Deleted", icon: MdDelete, color: "text-red-600 bg-red-500/10" },
  COMPLAINT_CREATED: { label: "Complaint Created", icon: MdReport, color: "text-brand-600 bg-brand-600/10" },
  COMPLAINT_UPDATED: { label: "Complaint Updated", icon: MdReport, color: "text-brand-600 bg-brand-600/10" },
  STATUS_CHANGED: { label: "Status Changed", icon: MdCheckCircle, color: "text-green-600 bg-green-500/10" },
  COMPLAINT_ASSIGNED: { label: "Assigned", icon: MdAssignmentInd, color: "text-amber-600 bg-amber-500/10" },
  ASSIGNMENT_ACCEPTED: { label: "Assignment Accepted", icon: MdCheckCircle, color: "text-green-600 bg-green-500/10" },
  ASSIGNMENT_REJECTED: { label: "Assignment Rejected", icon: MdClose, color: "text-red-600 bg-red-500/10" },
  COMPLAINT_DELETED: { label: "Complaint Deleted", icon: MdDelete, color: "text-red-600 bg-red-500/10" },
  EVIDENCE_UPLOADED: { label: "Evidence Uploaded", icon: MdAttachFile, color: "text-purple-600 bg-purple-500/10" },
  ESCALATION: { label: "Escalation", icon: MdPriorityHigh, color: "text-red-600 bg-red-500/10" },
  SUPPORT_TICKET_CREATED: { label: "Ticket Created", icon: MdChat, color: "text-cyan-600 bg-cyan-500/10" },
  SUPPORT_TICKET_UPDATED: { label: "Ticket Updated", icon: MdChat, color: "text-cyan-600 bg-cyan-500/10" },
  OFFICER_APPROVAL: { label: "Officer Approval", icon: MdManageAccounts, color: "text-blue-600 bg-blue-500/10" },
};
const actionMeta = (a) =>
  ACTION_META[a] || { label: a || "Event", icon: MdHistory, color: "text-gray-600 bg-gray-500/10" };

function relativeTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (Number.isNaN(diff)) return "";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const EMPTY = { q: "", action: "", entityType: "", actor: "", from: "", to: "" };

const AuditLog = () => {
  const [filters, setFilters] = React.useState(EMPTY);
  const [page, setPage] = React.useState(1);
  const [resp, setResp] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    apiFetch("/users")
      .then((d) => setUsers(Array.isArray(d?.users) ? d.users : []))
      .catch(() => setUsers([]));
  }, []);

  const buildQuery = React.useCallback(
    (extra = {}) => {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      Object.entries(extra).forEach(([k, v]) => qs.set(k, v));
      return qs;
    },
    [filters]
  );

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = buildQuery({ page, limit: 25 });
      setResp(await apiFetch(`/audit-logs?${qs.toString()}`));
    } catch (err) {
      setError(err?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [buildQuery, page]);

  React.useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  // Live-refresh the first unfiltered page as new audit entries arrive.
  React.useEffect(() => {
    const off = onSocket("audit:new", () => {
      if (page === 1 && Object.values(filters).every((v) => !v)) fetchLogs();
    });
    return off;
  }, [page, filters, fetchLogs]);

  const setF = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const reset = () => {
    setPage(1);
    setFilters(EMPTY);
  };

  const exportCsv = async () => {
    try {
      const qs = buildQuery({ limit: 2000 });
      const data = await apiFetch(`/audit-logs?${qs.toString()}`);
      const logs = data?.logs || [];
      const sections = sectionsToCsv([
        {
          title: "FIA Cyber Crime — Audit Trail",
          headers: ["Generated", new Date().toLocaleString()],
        },
        {
          title: "Audit Log",
          headers: ["Timestamp", "Action", "Entity", "Actor", "Role", "Summary", "IP"],
          rows: logs.map((l) => [
            new Date(l.createdAt).toISOString(),
            l.action,
            l.entityType,
            l.actorName || l.actor?.name || "System",
            l.actorRole || l.actor?.role || "",
            l.summary || "",
            l.ip || "",
          ]),
        },
      ]);
      downloadCsv("fia-audit-trail", sections);
    } catch (err) {
      window.alert(err?.message || "Export failed");
    }
  };

  const logs = resp?.logs || [];
  const activeFilters = Object.entries(filters).filter(([, v]) => v);
  const inputCls =
    "rounded-lg border border-gray-200 bg-lightPrimary px-2.5 py-2 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white";

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdHistory className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">Audit Trail</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Persistent, tamper-evident record of every critical action — searchable,
              filterable, and exportable.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
          >
            <MdRefresh className="h-4 w-4" aria-hidden /> Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            <MdDownload className="h-4 w-4" aria-hidden /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={MdHistory} label="Total Events" value={resp?.total ?? 0} accent="brand" loading={loading && !resp} />
        <StatCard icon={MdReport} label="Showing" value={logs.length} accent="navy" loading={loading && !resp} />
        <StatCard icon={MdAssignmentInd} label="Page" value={`${resp?.page ?? 1} / ${resp?.pages ?? 1}`} accent="amber" loading={loading && !resp} />
        <StatCard icon={MdManageAccounts} label="Action Types" value={resp?.facets?.actions?.length ?? 0} accent="blue" loading={loading && !resp} />
      </div>

      <SectionCard title="Filters" subtitle="Search and narrow the audit trail.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-gray-500 md:col-span-1">
            Search
            <div className="relative">
              <MdSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <input value={filters.q} onChange={setF("q")} placeholder="summary, actor…" className={`${inputCls} w-full pl-8`} />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Action
            <select value={filters.action} onChange={setF("action")} className={inputCls}>
              <option value="">All</option>
              {(resp?.facets?.actions || []).map((a) => (
                <option key={a} value={a}>{actionMeta(a).label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Entity
            <select value={filters.entityType} onChange={setF("entityType")} className={inputCls}>
              <option value="">All</option>
              {(resp?.facets?.entityTypes || []).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            User
            <select value={filters.actor} onChange={setF("actor")} className={inputCls}>
              <option value="">All</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            From
            <input type="date" value={filters.from} onChange={setF("from")} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            To
            <input type="date" value={filters.to} onChange={setF("to")} className={inputCls} />
          </label>
        </div>
        {activeFilters.length > 0 ? (
          <div className="mt-3">
            <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline dark:text-red-400">
              <MdFilterAltOff className="h-3.5 w-3.5" /> Clear filters
            </button>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard>
        {loading && !resp ? (
          <TableSkeleton rows={8} cols={1} />
        ) : error ? (
          <EmptyState icon={MdHistory} title="Could not load audit logs" message={error} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={MdHistory}
            title="No audit records"
            message="No entries match your filters. Actions performed in the platform are recorded here automatically."
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100 dark:divide-white/5">
              {logs.map((l) => {
                const meta = actionMeta(l.action);
                const Icon = meta.icon;
                return (
                  <li key={l._id} className="flex items-start gap-3 py-3.5">
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3">
                        <p className="text-sm font-semibold text-navy-900 dark:text-white">
                          {l.summary || meta.label}
                        </p>
                        <span className="text-xs text-gray-400">{relativeTime(l.createdAt)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold uppercase tracking-wider text-gray-500 dark:bg-navy-900 dark:text-gray-400">
                          {meta.label}
                        </span>
                        <span>{l.actorName || l.actor?.name || "System"}</span>
                        {l.actorRole ? <span>· {l.actorRole}</span> : null}
                        {l.ip ? <span className="font-mono">· {l.ip}</span> : null}
                        <span>· {new Date(l.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Page {resp?.page ?? 1} of {resp?.pages ?? 1} · {resp?.total ?? 0} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={(resp?.page ?? 1) <= 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
                >
                  <MdChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(resp?.pages ?? 1, p + 1))}
                  disabled={(resp?.page ?? 1) >= (resp?.pages ?? 1)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
                >
                  Next <MdChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
};

export default AuditLog;
