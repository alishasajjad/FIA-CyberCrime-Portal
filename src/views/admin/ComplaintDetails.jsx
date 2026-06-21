import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "services/api";
import { onSocket, subscribeComplaint, unsubscribeComplaint } from "services/socket";
import {
  SectionCard,
  StatusBadge,
  SeverityBadge,
  EmptyState,
  CardSkeleton,
  Skeleton,
} from "components/ui";
import ProgressTracker from "components/ui/ProgressTracker";
import EvidenceThread from "components/ui/EvidenceThread";
import {
  MdArrowBack,
  MdGavel,
  MdPerson,
  MdLocationCity,
  MdEmail,
  MdPhone,
  MdChat,
  MdHistory,
  MdPriorityHigh,
  MdNotifications,
  MdCheckCircle,
  MdAttachFile,
  MdShield,
} from "react-icons/md";

const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");

function Detail({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
        {label}
      </p>
      <div className="mt-0.5 text-sm font-medium text-navy-900 dark:text-white">{value || "—"}</div>
    </div>
  );
}

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch(`/complaints/${id}/details`));
    } catch (err) {
      setError(err?.message || "Failed to load complaint details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Live updates: join this complaint's room and reload on relevant events.
  React.useEffect(() => {
    if (!id) return undefined;
    subscribeComplaint(id);
    const off = onSocket("complaint:updated", (payload) => {
      if (!payload?.complaintId || String(payload.complaintId) === String(id)) load();
    });
    return () => {
      off();
      unsubscribeComplaint(id);
    };
  }, [id, load]);

  if (loading) {
    return (
      <div className="mt-3 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (error || !data?.complaint) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
        >
          <MdArrowBack className="h-4 w-4" aria-hidden /> Back
        </button>
        <EmptyState
          icon={MdGavel}
          title="Complaint unavailable"
          message={error || "This complaint could not be found or you do not have access to it."}
        />
      </div>
    );
  }

  const {
    complaint: c,
    evidence = [],
    messages = [],
    assignment,
    escalationHistory = [],
    notifications = [],
    auditHistory = [],
    resolutionSummary,
  } = data;

  const officer = assignment?.assignedTo || c.assignedTo;
  const history = Array.isArray(c.statusHistory) ? [...c.statusHistory].reverse() : [];

  const senderLabel = (m) => {
    const name = m.sender?.name;
    if (name && m.senderRole) return `${name} (${m.senderRole})`;
    return name || m.senderRole || "Participant";
  };

  return (
    <div className="mt-3 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
          >
            <MdArrowBack className="h-4 w-4" aria-hidden /> Back
          </button>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
              <MdGavel className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-navy-900 dark:text-white">
                {c.referenceId || c._id}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {c.incidentType}
                {c.city ? ` · ${c.city}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} />
          <SeverityBadge severity={c.severity} />
          {c.escalated ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Escalated{c.escalationLevel ? ` L${c.escalationLevel}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      {/* Resolution summary banner */}
      {resolutionSummary ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-green-200 bg-green-50/70 p-5 dark:border-green-900/40 dark:bg-green-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 text-green-700 dark:text-green-300">
              <MdCheckCircle className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-navy-900 dark:text-white">
                Case {resolutionSummary.status}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {resolutionSummary.note || "Investigation concluded."}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
            <p>{fmt(resolutionSummary.resolvedAt)}</p>
            {resolutionSummary.resolvedBy ? <p>by {resolutionSummary.resolvedBy}</p> : null}
          </div>
        </div>
      ) : null}

      {/* Overview + timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Complaint Information" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Complainant" value={c.complainantName || c.createdBy?.name} icon={MdPerson} />
            <Detail label="Email" value={c.email} icon={MdEmail} />
            <Detail label="Phone" value={c.phoneNumber} icon={MdPhone} />
            <Detail label="City" value={c.city} icon={MdLocationCity} />
            <Detail label="Department" value={c.department} />
            <Detail label="Filed" value={fmt(c.createdAt)} />
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-navy-700">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Incident Summary</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {c.incidentSummary || "—"}
            </p>
          </div>
        </SectionCard>

        {/* Assigned officer */}
        <SectionCard title={<span className="flex items-center gap-2"><MdShield className="h-5 w-5 text-brand-600" /> Assigned Officer</span>}>
          {officer ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-sm font-bold uppercase text-brand-700 dark:text-brand-300">
                  {(officer.name || "?").charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{officer.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{officer.unit || "—"}</p>
                </div>
              </div>
              {officer.email ? <Detail label="Email" value={officer.email} icon={MdEmail} /> : null}
              {assignment ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-navy-700 dark:text-gray-200">
                    {assignment.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      assignment.response === "Accepted"
                        ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                        : assignment.response === "Rejected"
                        ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    {assignment.response || "Pending"}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState icon={MdShield} title="Not assigned" message="No officer is currently assigned to this case." />
          )}
        </SectionCard>
      </div>

      {/* Timeline */}
      <SectionCard title="Complaint Timeline">
        <ProgressTracker complaint={c} />
      </SectionCard>

      {/* Status history + Escalation history */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={<span className="flex items-center gap-2"><MdHistory className="h-5 w-5 text-brand-600" /> Status History</span>}>
          {history.length === 0 ? (
            <EmptyState icon={MdHistory} title="No history yet" />
          ) : (
            <ul className="space-y-3">
              {history.map((h, i) => (
                <li key={i} className="flex items-start gap-3 border-l-2 border-brand-200 pl-3 dark:border-navy-700">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-xs text-gray-400">{fmt(h.at)}</span>
                    </div>
                    {h.by?.name ? <p className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">by {h.by.name}</p> : null}
                    {h.note ? <p className="mt-0.5 text-sm italic text-gray-600 dark:text-gray-300">“{h.note}”</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={<span className="flex items-center gap-2"><MdPriorityHigh className="h-5 w-5 text-red-600" /> Escalation History</span>}>
          {escalationHistory.length === 0 ? (
            <EmptyState icon={MdPriorityHigh} title="No escalations" message="This case has not been escalated." />
          ) : (
            <ul className="space-y-3">
              {escalationHistory.map((e) => (
                <li key={e._id} className="rounded-xl border border-gray-150 bg-gray-50/60 p-3 dark:border-navy-700 dark:bg-navy-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      {e.type}{e.level ? ` · L${e.level}` : ""}
                    </span>
                    <span className="text-xs text-gray-400">{fmt(e.createdAt)}</span>
                  </div>
                  {e.reason ? <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{e.reason}</p> : null}
                  {e.toOfficer?.name ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      → Reassigned to {e.toOfficer.name}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Evidence thread */}
      <SectionCard title={<span className="flex items-center gap-2"><MdAttachFile className="h-5 w-5 text-brand-600" /> Evidence Thread</span>}>
        <EvidenceThread items={evidence} emptyHint="No evidence has been submitted for this case." />
      </SectionCard>

      {/* Messages */}
      <SectionCard title={<span className="flex items-center gap-2"><MdChat className="h-5 w-5 text-brand-600" /> Messages & Communication</span>}>
        {messages.length === 0 ? (
          <EmptyState icon={MdChat} title="No messages" message="No messages have been exchanged on this case." />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m._id} className="rounded-xl bg-lightPrimary p-3 text-sm dark:bg-navy-900">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-green-700 dark:text-green-300">{senderLabel(m)}</p>
                  <span className="text-xs text-gray-400">{fmt(m.createdAt)}</span>
                </div>
                <p className="mt-1 text-gray-800 dark:text-gray-100">{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Notifications + Audit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={<span className="flex items-center gap-2"><MdNotifications className="h-5 w-5 text-brand-600" /> Related Notifications</span>}>
          {notifications.length === 0 ? (
            <EmptyState icon={MdNotifications} title="No notifications" />
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n._id} className="rounded-lg border border-gray-100 p-2.5 dark:border-navy-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy-900 dark:text-white">{n.title}</p>
                    <span className="text-xs text-gray-400">{fmt(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={<span className="flex items-center gap-2"><MdHistory className="h-5 w-5 text-brand-600" /> Audit History</span>}>
          {auditHistory.length === 0 ? (
            <EmptyState icon={MdHistory} title="No audit records" message="Admin-only audit entries for this case will appear here." />
          ) : (
            <ul className="space-y-2">
              {auditHistory.map((a) => (
                <li key={a._id} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-white/5">
                  <div className="min-w-0">
                    <p className="text-sm text-navy-900 dark:text-white">{a.summary || a.action}</p>
                    <p className="text-xs text-gray-400">
                      {a.actorName || a.actor?.name || "System"}
                      {a.actorRole ? ` · ${a.actorRole}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{fmt(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
