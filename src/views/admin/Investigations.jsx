import React from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "services/api";
import {
  StatCard,
  SectionCard,
  EmptyState,
  StatusBadge,
  SeverityBadge,
  TableSkeleton,
} from "components/ui";
import CaseTimeline from "components/ui/CaseTimeline";
import { useReminders } from "utils/remindersStore";
import { categoryOf } from "constants/reminderCategories";
import {
  MdGavel,
  MdFolderOpen,
  MdPendingActions,
  MdCheckCircle,
  MdWarning,
  MdRefresh,
  MdAttachFile,
  MdChat,
  MdSend,
  MdEventNote,
  MdAlarm,
  MdToday,
  MdArrowForward,
} from "react-icons/md";

const statusOptions = [
  "Pending",
  "In Review",
  "Under Investigation",
  "Resolved",
  "Closed",
];
const severityOptions = ["Low", "Medium", "High", "Critical"];

// SLA targets mirror the escalation engine defaults for officer-side countdowns.
const SLA_HOURS = { Critical: 24, High: 48, Medium: 96, Low: 168 };
function slaCountdown(c) {
  if (["Resolved", "Closed"].includes(c.status)) return null;
  const sla = SLA_HOURS[c.severity] || 168;
  const remaining = sla - (Date.now() - new Date(c.createdAt).getTime()) / 36e5;
  if (remaining <= 0) return { overdue: true, label: `${Math.round(-remaining)}h overdue` };
  if (remaining < 24) return { warn: true, label: `${Math.round(remaining)}h left` };
  return { label: `${Math.floor(remaining / 24)}d left` };
}

const Investigations = () => {
  const [complaints, setComplaints] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [evidence, setEvidence] = React.useState([]);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/complaints/assigned");
      const list = Array.isArray(data?.complaints) ? data.complaints : [];
      setComplaints(list);
      setSelectedId((prev) => {
        if (prev && list.some((c) => c._id === prev)) return prev;
        return list[0]?._id || "";
      });
    } catch (err) {
      window.alert(err?.message || "Load error");
      setComplaints([]);
      setSelectedId("");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = complaints.find((c) => c._id === selectedId);

  const loadCaseDetail = React.useCallback(async (caseId) => {
    if (!caseId) {
      setMessages([]);
      setEvidence([]);
      return;
    }
    setDetailLoading(true);
    try {
      const [msgData, evData] = await Promise.all([
        apiFetch(`/complaints/${caseId}/messages`),
        apiFetch(`/complaints/${caseId}/evidence`),
      ]);
      setMessages(Array.isArray(msgData?.messages) ? msgData.messages : []);
      setEvidence(Array.isArray(evData?.evidence) ? evData.evidence : []);
    } catch {
      setMessages([]);
      setEvidence([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCaseDetail(selectedId);
  }, [selectedId, loadCaseDetail]);

  const handleUpdate = async () => {
    if (!active) return;
    try {
      const status = document.getElementById("invStatus")?.value || active.status;
      const severity = document.getElementById("invSeverity")?.value || active.severity;
      const notes = document.getElementById("invNotes")?.value || "";

      await apiFetch(`/complaints/${active._id}/status`, {
        method: "PATCH",
        body: { status, severity, notes },
      });
      window.alert("Case updated.");
      await fetchAssigned();
    } catch (err) {
      window.alert(err?.message || "Update error");
    }
  };

  const handleSendMessage = async () => {
    if (!active) return;
    try {
      const message = document.getElementById("invMessage")?.value?.trim() || "";
      if (!message) {
        window.alert("Please enter a message.");
        return;
      }
      await apiFetch(`/complaints/${active._id}/messages`, {
        method: "POST",
        body: { message },
      });
      document.getElementById("invMessage").value = "";
      await loadCaseDetail(active._id);
    } catch (err) {
      window.alert(err?.message || "Message error");
    }
  };

  const senderLabel = (m) => {
    const name = m.sender?.name;
    if (name && m.senderRole) return `${name} (${m.senderRole})`;
    return name || m.senderRole || "Participant";
  };

  // Workload metrics
  const total = complaints.length;
  const activeCount = complaints.filter((c) =>
    ["Pending", "In Review", "Under Investigation"].includes(c.status)
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ["Resolved", "Closed"].includes(c.status)
  ).length;
  const highCount = complaints.filter(
    (c) => ["High", "Critical"].includes(c.severity) && !["Resolved", "Closed"].includes(c.status)
  ).length;

  // Calendar / reminder previews for the command center.
  const { reminders } = useReminders();
  const nowTs = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const pendingReminders = reminders.filter((r) => !r.completed && r.dueAt);
  const todaysTasks = pendingReminders
    .filter((r) => {
      const t = new Date(r.dueAt).getTime();
      return t >= startOfToday.getTime() && t <= endOfToday.getTime();
    })
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const overdueReminders = pendingReminders
    .filter((r) => new Date(r.dueAt).getTime() < nowTs)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const upcomingReminders = pendingReminders
    .filter((r) => new Date(r.dueAt).getTime() > nowTs)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 5);

  const fmtWhen = (d) =>
    new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdGavel className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Investigation Workspace
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Manage assigned cyber crime cases — review evidence, communicate,
              and advance investigations.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchAssigned}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
        >
          <MdRefresh className="h-4 w-4" aria-hidden /> Refresh
        </button>
      </div>

      {/* Workload cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdFolderOpen} label="Assigned Cases" value={total} accent="brand" loading={loading} />
        <StatCard icon={MdPendingActions} label="Active" value={activeCount} accent="amber" loading={loading} />
        <StatCard icon={MdCheckCircle} label="Resolved" value={resolvedCount} accent="navy" loading={loading} />
        <StatCard icon={MdWarning} label="High Priority" value={highCount} accent="red" loading={loading} />
      </div>

      {/* Command center: today's tasks, overdue, upcoming deadlines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title={<span className="flex items-center gap-2"><MdToday className="h-5 w-5 text-brand-600" /> Today's Tasks</span>}
          action={
            <Link to="/admin/calendar" className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-700 hover:underline dark:text-brand-400">
              Calendar <MdArrowForward className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {todaysTasks.length === 0 ? (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">No tasks scheduled for today.</p>
          ) : (
            <ul className="space-y-2">
              {todaysTasks.map((r) => {
                const cat = categoryOf(r.category);
                return (
                  <li key={r._id} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${cat.dot}`} />
                    <span className="flex-1 truncate text-navy-900 dark:text-white">{r.title}</span>
                    <span className="shrink-0 text-xs text-gray-400">{fmtWhen(r.dueAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={<span className="flex items-center gap-2"><MdAlarm className="h-5 w-5 text-red-600" /> Overdue</span>}
        >
          {overdueReminders.length === 0 ? (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">Nothing overdue. Great work.</p>
          ) : (
            <ul className="space-y-2">
              {overdueReminders.slice(0, 5).map((r) => (
                <li key={r._id} className="flex items-center gap-2 rounded-lg bg-red-50/60 px-2 py-1.5 text-sm dark:bg-red-950/20">
                  <MdAlarm className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
                  <span className="flex-1 truncate text-navy-900 dark:text-white">{r.title}</span>
                  <span className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400">{fmtWhen(r.dueAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={<span className="flex items-center gap-2"><MdEventNote className="h-5 w-5 text-brand-600" /> Upcoming Deadlines</span>}
          action={
            <Link to="/admin/alerts" className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-700 hover:underline dark:text-brand-400">
              Alerts <MdArrowForward className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {upcomingReminders.length === 0 ? (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">No upcoming events scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingReminders.map((r) => {
                const cat = categoryOf(r.category);
                return (
                  <li key={r._id} className="flex items-center gap-2 text-sm">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${cat.chip}`}>{cat.label}</span>
                    <span className="flex-1 truncate text-navy-900 dark:text-white">{r.title}</span>
                    <span className="shrink-0 text-xs text-gray-400">{fmtWhen(r.dueAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Case queue */}
        <SectionCard title="Assignment Queue" subtitle="Your active caseload" className="xl:col-span-2">
          {loading ? (
            <TableSkeleton rows={5} cols={1} />
          ) : complaints.length === 0 ? (
            <EmptyState icon={MdFolderOpen} title="No assigned cases" message="Cases assigned to you by an admin will appear here." />
          ) : (
            <ul className="space-y-2">
              {complaints.map((c) => {
                const sel = c._id === selectedId;
                return (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c._id)}
                      className={`w-full rounded-xl border p-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        sel
                          ? "border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-navy-900"
                          : "border-gray-150 hover:border-brand-200 hover:bg-gray-50 dark:border-navy-700 dark:hover:bg-navy-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-navy-900 dark:text-white">
                          {c.referenceId || c._id}
                        </span>
                        <SeverityBadge severity={c.severity} />
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {c.incidentType}
                        {c.city ? ` · ${c.city}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={c.status} />
                        {c.escalated ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            Escalated{c.escalationLevel ? ` L${c.escalationLevel}` : ""}
                          </span>
                        ) : null}
                        {(() => {
                          const sla = slaCountdown(c);
                          if (!sla) return null;
                          return (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                sla.overdue
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                  : sla.warn
                                  ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "bg-gray-100 text-gray-500 dark:bg-navy-900 dark:text-gray-400"
                              }`}
                            >
                              {sla.label}
                            </span>
                          );
                        })()}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Workspace */}
        <div className="space-y-6 xl:col-span-3">
          {!active ? (
            <SectionCard>
              <EmptyState icon={MdGavel} title="Select a case" message="Choose a case from the queue to open its investigation workspace." />
            </SectionCard>
          ) : (
            <>
              {/* Overview + progress */}
              <SectionCard
                title={active.referenceId || active._id}
                subtitle={`${active.incidentType}${active.city ? ` · ${active.city}` : ""}`}
                action={<StatusBadge status={active.status} />}
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                      Case Progress
                    </p>
                    <CaseTimeline status={active.status} />
                  </div>
                  <div className="space-y-3 text-sm">
                    <Detail label="Severity" value={<SeverityBadge severity={active.severity} />} />
                    <Detail label="Complainant" value={active.complainantName || active.createdBy?.name || "—"} />
                    <Detail label="Department" value={active.department || "—"} />
                    <Detail label="Filed" value={active.createdAt ? new Date(active.createdAt).toLocaleString() : "—"} />
                    <Detail label="Summary" value={<span className="text-gray-600 dark:text-gray-300">{active.incidentSummary || "—"}</span>} />
                  </div>
                </div>
              </SectionCard>

              {/* Update form (logic preserved) */}
              <SectionCard title="Update Case">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">Status</label>
                    <select id="invStatus" defaultValue={active.status} key={`s-${active._id}`} className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white">
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">Severity</label>
                    <select id="invSeverity" defaultValue={active.severity} key={`sev-${active._id}`} className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white">
                      {severityOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">Investigation Notes (visible to user)</label>
                    <textarea id="invNotes" rows="3" key={`n-${active._id}`} placeholder="Add investigation notes, next steps, and outcomes." className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end md:col-span-2">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      className="rounded-xl bg-brand-700 hover:bg-brand-800 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Evidence panel */}
                <SectionCard title={<span className="flex items-center gap-2"><MdAttachFile className="h-5 w-5 text-brand-600" /> Evidence Review</span>}>
                  {detailLoading ? (
                    <TableSkeleton rows={3} cols={1} />
                  ) : evidence.length === 0 ? (
                    <EmptyState icon={MdAttachFile} title="No evidence" message="No files have been uploaded for this case." />
                  ) : (
                    <ul className="space-y-2">
                      {evidence.map((ev) => (
                        <li key={ev._id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-150 bg-gray-50/60 p-3 dark:border-navy-700 dark:bg-navy-900/40">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{ev.originalName}</p>
                            <p className="text-xs text-gray-500">{ev.mimeType} · {Number(ev.size || 0).toLocaleString()} bytes</p>
                          </div>
                          {ev.fileUrl ? (
                            <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-bold text-brand-700 hover:underline dark:text-brand-400">View</a>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                {/* Communication */}
                <SectionCard title={<span className="flex items-center gap-2"><MdChat className="h-5 w-5 text-brand-600" /> Communication</span>}>
                  {detailLoading ? (
                    <TableSkeleton rows={3} cols={1} />
                  ) : messages.length === 0 ? (
                    <EmptyState icon={MdChat} title="No messages" message="Start the conversation with the complainant below." />
                  ) : (
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {messages.map((m) => (
                        <div key={m._id} className="rounded-xl bg-lightPrimary p-3 text-sm dark:bg-navy-900">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-green-700 dark:text-green-300">{senderLabel(m)}</p>
                            <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-gray-800 dark:text-gray-100">{m.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input id="invMessage" type="text" placeholder="Message the complainant…" className="flex-1 rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white" />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-green-700 hover:bg-green-800 px-5 py-3 text-sm font-bold text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-500"
                      >
                        <MdSend className="h-4 w-4" aria-hidden /> Send
                      </button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <div className="mt-0.5 font-medium text-navy-900 dark:text-white">{value}</div>
    </div>
  );
}

export default Investigations;
