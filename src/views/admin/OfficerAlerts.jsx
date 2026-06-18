import React from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "services/api";
import { useNotifications, refreshNotifications } from "utils/notificationsStore";
import { useReminders } from "utils/remindersStore";
import { categoryOf } from "constants/reminderCategories";
import { StatCard, SectionCard, EmptyState } from "components/ui";
import {
  MdNotificationsActive,
  MdAssignmentInd,
  MdSwapHoriz,
  MdAlarm,
  MdEventAvailable,
  MdMarkEmailRead,
  MdOpenInNew,
  MdCircle,
  MdWarningAmber,
} from "react-icons/md";

const SEVERITY = {
  High: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  Medium: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Low: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
};

function severityOfNotification(type) {
  if (type === "Assignment") return "Medium";
  if (type === "Status") return "Medium";
  if (type === "Support") return "Low";
  return "Low";
}

function relativeTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (Number.isNaN(diff)) return "";
  if (diff < 0) {
    const f = Math.abs(diff);
    if (f < 3600) return `in ${Math.round(f / 60)}m`;
    if (f < 86400) return `in ${Math.round(f / 3600)}h`;
    return `in ${Math.round(f / 86400)}d`;
  }
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const FILTERS = ["All", "Unread", "Assignments", "Deadlines", "Status", "Meetings"];

export default function OfficerAlerts() {
  const { notifications, unread } = useNotifications();
  const { reminders } = useReminders();
  const [filter, setFilter] = React.useState("All");

  const now = Date.now();
  const soon = now + 48 * 3600 * 1000;

  // Build a unified, real-data alert feed.
  const alerts = React.useMemo(() => {
    const list = [];

    notifications.forEach((n) => {
      list.push({
        id: `n-${n._id}`,
        source: "notification",
        kind:
          n.type === "Assignment"
            ? "Assignments"
            : n.type === "Status"
            ? "Status"
            : "Other",
        icon: n.type === "Assignment" ? MdAssignmentInd : MdSwapHoriz,
        title: n.title,
        message: n.message,
        ts: n.createdAt,
        severity: severityOfNotification(n.type),
        read: n.read,
        rawId: n._id,
        type: n.type,
      });
    });

    reminders
      .filter((r) => !r.completed && r.dueAt)
      .forEach((r) => {
        const due = new Date(r.dueAt).getTime();
        const overdue = due < now;
        const upcoming = due >= now && due <= soon;
        if (!overdue && !upcoming) return;
        const cat = categoryOf(r.category);
        const isMeeting = r.category === "UserMeeting";
        list.push({
          id: `r-${r._id}`,
          source: "reminder",
          kind: isMeeting ? "Meetings" : "Deadlines",
          icon: isMeeting ? MdEventAvailable : MdAlarm,
          title: overdue ? `Overdue: ${r.title}` : `Upcoming: ${r.title}`,
          message: `${cat.label}${r.complaintRef ? ` · ${r.complaintRef}` : ""} — ${new Date(r.dueAt).toLocaleString()}`,
          ts: r.dueAt,
          severity: overdue ? "High" : "Medium",
          read: true,
          type: "Reminder",
        });
      });

    return list.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [notifications, reminders, now, soon]);

  const filtered = alerts.filter((a) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !a.read;
    return a.kind === filter;
  });

  const overdueCount = alerts.filter((a) => a.source === "reminder" && a.severity === "High").length;
  const assignCount = alerts.filter((a) => a.kind === "Assignments").length;

  const markRead = async (a) => {
    if (a.source !== "notification" || a.read) return;
    try {
      await apiFetch(`/notifications/${a.rawId}/read`, { method: "PATCH" });
      refreshNotifications();
    } catch {
      /* non-fatal */
    }
  };

  const markAll = async () => {
    if (unread === 0) return;
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      refreshNotifications();
    } catch {
      /* non-fatal */
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
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">Officer Alert Center</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Real-time alerts from your cases plus calendar deadlines and
              meetings. Updates automatically.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={markAll}
          disabled={unread === 0}
          className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
        >
          <MdMarkEmailRead className="h-4 w-4" aria-hidden /> Mark all read
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdNotificationsActive} label="Total Alerts" value={alerts.length} accent="brand" />
        <StatCard icon={MdCircle} label="Unread" value={unread} accent="amber" />
        <StatCard icon={MdWarningAmber} label="Overdue Deadlines" value={overdueCount} accent="red" />
        <StatCard icon={MdAssignmentInd} label="Assignment Alerts" value={assignCount} accent="navy" />
      </div>

      <SectionCard>
        <div className="-mt-1 mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f === "All" ? alerts.length : f === "Unread" ? unread : alerts.filter((a) => a.kind === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  filter === f ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-900 dark:text-gray-300 dark:hover:bg-navy-700"
                }`}
              >
                {f} <span className={filter === f ? "text-white/80" : "text-gray-400"}>{count}</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={MdNotificationsActive}
            title="No alerts"
            message={filter === "All" ? "You're all caught up. New activity will appear here automatically." : `No ${filter.toLowerCase()} alerts.`}
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {filtered.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id} className={`flex items-start gap-3 py-3.5 ${!a.read ? "bg-brand-50/40 dark:bg-brand-900/5" : ""}`}>
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${SEVERITY[a.severity]}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3">
                      <p className="text-sm font-bold text-navy-900 dark:text-white">{a.title}</p>
                      <span className="text-xs text-gray-400">{relativeTime(a.ts)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{a.message}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY[a.severity]}`}>
                        {a.severity}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-navy-900 dark:text-gray-400">
                        {a.type}
                      </span>
                      {/* Quick actions */}
                      {a.source === "notification" && !a.read ? (
                        <button type="button" onClick={() => markRead(a)} className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400">
                          Mark read
                        </button>
                      ) : null}
                      {a.source === "notification" && a.kind === "Assignments" ? (
                        <Link to="/admin/investigations" className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400">
                          Open case <MdOpenInNew className="h-3 w-3" />
                        </Link>
                      ) : null}
                      {a.source === "reminder" ? (
                        <Link to="/admin/calendar" className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400">
                          View in calendar <MdOpenInNew className="h-3 w-3" />
                        </Link>
                      ) : null}
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
}
