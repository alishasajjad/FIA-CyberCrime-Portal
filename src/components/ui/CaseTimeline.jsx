import React from "react";
import { MdCheckCircle, MdRadioButtonUnchecked } from "react-icons/md";

// Ordered investigation lifecycle used across officer & user portals.
const MILESTONES = [
  {
    key: "submitted",
    title: "Complaint Submitted",
    desc: "Report filed and logged in the system.",
    reached: () => true,
  },
  {
    key: "review",
    title: "Review & Verification",
    desc: "Wing officer validates the report and severity.",
    reached: (s) => s !== "Pending",
  },
  {
    key: "investigation",
    title: "Under Investigation",
    desc: "Assigned officer conducts a formal inquiry.",
    reached: (s) => ["Under Investigation", "Resolved", "Closed"].includes(s),
  },
  {
    key: "resolved",
    title: "Resolved",
    desc: "Investigation concluded and outcome recorded.",
    reached: (s) => ["Resolved", "Closed"].includes(s),
  },
  {
    key: "closed",
    title: "Closed",
    desc: "Case formally closed and archived.",
    reached: (s) => s === "Closed",
  },
];

export default function CaseTimeline({ status = "Pending" }) {
  const currentIdx = MILESTONES.reduce(
    (acc, m, i) => (m.reached(status) ? i : acc),
    0
  );

  return (
    <ol className="relative ml-2.5 space-y-5 border-l border-gray-200 pl-6 dark:border-navy-700">
      {MILESTONES.map((m, i) => {
        const reached = m.reached(status);
        const isCurrent = i === currentIdx;
        return (
          <li key={m.key} className="relative">
            <span
              className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                reached
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-300 bg-white text-gray-300 dark:border-navy-600 dark:bg-navy-900"
              } ${isCurrent ? "ring-4 ring-brand-600/20" : ""}`}
            >
              {reached ? (
                <MdCheckCircle className="h-4 w-4" aria-hidden />
              ) : (
                <MdRadioButtonUnchecked className="h-4 w-4" aria-hidden />
              )}
            </span>
            <p
              className={`text-sm font-bold ${
                reached ? "text-navy-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {m.title}
              {isCurrent ? (
                <span className="ml-2 rounded-full bg-brand-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  Current
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
          </li>
        );
      })}
    </ol>
  );
}
