import React from "react";
import { motion } from "framer-motion";
import { MdCheck, MdAccessTime, MdPerson } from "react-icons/md";

// Order-tracking-style progress (Amazon/Daraz/Foodpanda). Derived entirely from
// real complaint data: status, statusHistory timestamps, assignment, resolvedAt.
const STATUS_ORDER = ["Pending", "In Review", "Under Investigation", "Resolved", "Closed"];
const orderIndex = (s) => {
  const i = STATUS_ORDER.indexOf(s);
  return i === -1 ? 0 : i;
};

function historyEntry(history, status) {
  if (!Array.isArray(history)) return null;
  // Last matching entry reflects the most recent transition into this status.
  const matches = history.filter((h) => h.status === status);
  return matches.length ? matches[matches.length - 1] : null;
}

function historyTime(history, status) {
  return historyEntry(history, status)?.at || null;
}

function actorName(entry) {
  const by = entry?.by;
  if (by && typeof by === "object" && by.name) return by.name;
  return null;
}

function fmt(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProgressTracker({ complaint }) {
  if (!complaint) return null;
  const status = complaint.status || "Pending";
  const idx = orderIndex(status);
  const history = complaint.statusHistory;
  const reviewEntry = historyEntry(history, "In Review");
  const investigationEntry = historyEntry(history, "Under Investigation");
  const resolvedEntry =
    historyEntry(history, "Resolved") || historyEntry(history, "Closed");
  const resolvedTs = complaint.resolvedAt || resolvedEntry?.at || null;
  const officerName = complaint.assignedTo?.name || actorName(investigationEntry);

  const stages = [
    {
      key: "submitted",
      label: "Submitted",
      desc: "Complaint received and logged.",
      reached: true,
      ts: historyTime(history, "Pending") || complaint.createdAt,
    },
    {
      key: "reviewed",
      label: "Reviewed",
      desc: "Verified by the cyber crime desk.",
      reached: idx >= 1,
      ts: reviewEntry?.at || null,
      actor: actorName(reviewEntry),
      note: reviewEntry?.note,
    },
    {
      key: "assigned",
      label: "Assigned",
      desc: "Allocated to an investigation officer.",
      reached: !!complaint.assignedTo || idx >= 2,
      ts: investigationEntry?.at || null,
      actor: officerName,
    },
    {
      key: "investigation",
      label: "Investigation Started",
      desc: "Formal inquiry under way.",
      reached: idx >= 2,
      ts: investigationEntry?.at || null,
      actor: officerName,
      note: investigationEntry?.note,
    },
    {
      key: "evidence",
      label: "Evidence Verified",
      desc: "Submitted evidence reviewed.",
      reached: idx >= 3,
      ts: null,
      actor: officerName,
    },
    {
      key: "resolved",
      label: "Resolved",
      desc: "Investigation concluded.",
      reached: idx >= 3,
      ts: resolvedTs,
      actor: actorName(resolvedEntry),
      note: resolvedEntry?.note,
    },
  ];

  const lastReached = stages.reduce((acc, s, i) => (s.reached ? i : acc), 0);

  return (
    <div>
      {/* Desktop: horizontal tracker */}
      <ol className="hidden md:flex md:items-start">
        {stages.map((s, i) => {
          const isCurrent = i === lastReached;
          return (
            <li key={s.key} className="relative flex-1">
              {i < stages.length - 1 && (
                <span
                  className={`absolute left-1/2 top-4 h-0.5 w-full ${
                    i < lastReached ? "bg-brand-600" : "bg-gray-200 dark:bg-navy-700"
                  }`}
                  aria-hidden
                />
              )}
              <div className="relative flex flex-col items-center text-center">
                <motion.span
                  initial={false}
                  animate={{ scale: isCurrent ? [1, 1.12, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                  className={`z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    s.reached
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-gray-300 bg-white text-gray-300 dark:border-navy-600 dark:bg-navy-900"
                  } ${isCurrent ? "ring-4 ring-brand-600/20" : ""}`}
                >
                  {s.reached ? <MdCheck className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </motion.span>
                <p className={`mt-2 px-1 text-xs font-bold ${s.reached ? "text-navy-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                  {s.label}
                </p>
                {s.ts && s.reached ? (
                  <p className="mt-0.5 text-[10px] text-gray-400">{fmt(s.ts)}</p>
                ) : null}
                {s.actor && s.reached ? (
                  <p className="mt-0.5 px-1 text-[10px] font-medium text-brand-700 dark:text-brand-300">
                    {s.actor}
                  </p>
                ) : null}
                {s.note && s.reached ? (
                  <p className="mt-0.5 max-w-[120px] truncate px-1 text-[10px] italic text-gray-500 dark:text-gray-400" title={s.note}>
                    “{s.note}”
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Mobile: vertical tracker */}
      <ol className="space-y-4 border-l border-gray-200 pl-5 dark:border-navy-700 md:hidden">
        {stages.map((s, i) => {
          const isCurrent = i === lastReached;
          return (
            <li key={s.key} className="relative">
              <span
                className={`absolute -left-[27px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  s.reached
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-gray-300 bg-white text-gray-300 dark:border-navy-600 dark:bg-navy-900"
                } ${isCurrent ? "ring-4 ring-brand-600/20" : ""}`}
              >
                {s.reached ? <MdCheck className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
              </span>
              <p className={`text-sm font-bold ${s.reached ? "text-navy-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                {s.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
              {s.ts && s.reached ? (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                  <MdAccessTime className="h-3 w-3" aria-hidden /> {fmt(s.ts)}
                </p>
              ) : null}
              {s.actor && s.reached ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-300">
                  <MdPerson className="h-3 w-3" aria-hidden /> {s.actor}
                </p>
              ) : null}
              {s.note && s.reached ? (
                <p className="mt-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] italic text-gray-600 dark:bg-navy-900 dark:text-gray-300">
                  “{s.note}”
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
