import React from "react";
import { apiFetch } from "services/api";
import { getAuthRole } from "utils/auth";
import { refreshNotifications } from "utils/notificationsStore";
import { StatCard, SectionCard, EmptyState, TableSkeleton } from "components/ui";
import {
  MdNotificationsActive,
  MdMarkEmailRead,
  MdReport,
  MdSwapHoriz,
  MdAssignmentInd,
  MdSupportAgent,
  MdSettings,
  MdRefresh,
  MdInbox,
  MdCircle,
} from "react-icons/md";

const TYPE_META = {
  Complaint: { icon: MdReport, color: "text-brand-600 bg-brand-600/10" },
  Status: { icon: MdSwapHoriz, color: "text-blue-600 bg-blue-500/10" },
  Assignment: { icon: MdAssignmentInd, color: "text-amber-600 bg-amber-500/10" },
  Support: { icon: MdSupportAgent, color: "text-purple-600 bg-purple-500/10" },
  OTP: { icon: MdSettings, color: "text-gray-600 bg-gray-500/10" },
  System: { icon: MdSettings, color: "text-gray-600 bg-gray-500/10" },
};

const FILTERS = ["All", "Unread", "Complaint", "Status", "Assignment", "Support", "System"];

function relativeTime(dateStr) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (Number.isNaN(diff)) return "";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

const NotificationCenter = () => {
  const role = getAuthRole();
  const isAdmin = role === "Admin";
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("All");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/notifications");
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const unreadCount = items.filter((n) => !n.read).length;
  const todayCount = items.filter(
    (n) => new Date(n.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const filtered = items.filter((n) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return n.type === filter;
  });

  const markRead = async (n) => {
    if (n.read) return;
    setItems((arr) => arr.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    try {
      await apiFetch(`/notifications/${n._id}/read`, { method: "PATCH" });
      refreshNotifications();
    } catch {
      load();
    }
  };

  const markAll = async () => {
    if (unreadCount === 0) return;
    setBusy(true);
    setItems((arr) => arr.map((x) => ({ ...x, read: true })));
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      refreshNotifications();
    } catch {
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdNotificationsActive className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              {isAdmin ? "Notification Center & Activity Feed" : "Notification Center"}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {isAdmin
                ? "Chronological feed of real platform events — registrations, complaints, assignments, status changes, and messages."
                : "Updates on your complaints, assignments, and support requests."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
          >
            <MdRefresh className="h-4 w-4" aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={markAll}
            disabled={busy || unreadCount === 0}
            className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            <MdMarkEmailRead className="h-4 w-4" aria-hidden />
            Mark all read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={MdInbox} label="Total" value={items.length} accent="navy" loading={loading} />
        <StatCard icon={MdNotificationsActive} label="Unread" value={unreadCount} accent="amber" loading={loading} />
        <StatCard icon={MdMarkEmailRead} label="Today" value={todayCount} accent="brand" loading={loading} />
      </div>

      <SectionCard>
        {/* Filter chips */}
        <div className="-mt-1 mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f === "All"
                ? items.length
                : f === "Unread"
                ? unreadCount
                : items.filter((n) => n.type === f).length;
            const activeF = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  activeF
                    ? "bg-brand-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-700"
                }`}
              >
                {f}
                <span className={`ml-1.5 ${activeF ? "text-white/80" : "text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={1} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MdInbox}
            title="No notifications"
            message={
              filter === "All"
                ? "You're all caught up. New activity will appear here."
                : `No ${filter.toLowerCase()} notifications.`
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.System;
              const Icon = meta.icon;
              return (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => markRead(n)}
                    className={`flex w-full items-start gap-3 px-1 py-3.5 text-left transition hover:bg-gray-50 dark:hover:bg-navy-900/50 ${
                      !n.read ? "bg-brand-50/40 dark:bg-brand-900/5" : ""
                    }`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-navy-900 dark:text-white">
                          {n.title}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">
                          {relativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                        {n.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-navy-900 dark:text-gray-400">
                          {n.type}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!n.read && (
                      <MdCircle className="mt-1 h-2.5 w-2.5 shrink-0 text-brand-500" aria-label="Unread" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default NotificationCenter;
