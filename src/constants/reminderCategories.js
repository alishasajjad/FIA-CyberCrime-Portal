import {
  MdFactCheck,
  MdGroups,
  MdAlarm,
  MdReplay,
  MdRateReview,
  MdEvent,
} from "react-icons/md";

// Single source of truth for investigation event categories — shared by the
// calendar, alert center, and officer dashboard for consistent color coding.
export const REMINDER_CATEGORIES = [
  {
    key: "EvidenceReview",
    label: "Evidence Review",
    icon: MdFactCheck,
    dot: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    bar: "border-l-blue-500",
  },
  {
    key: "UserMeeting",
    label: "User Meeting",
    icon: MdGroups,
    dot: "bg-purple-500",
    chip: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    bar: "border-l-purple-500",
  },
  {
    key: "InvestigationDeadline",
    label: "Investigation Deadline",
    icon: MdAlarm,
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    bar: "border-l-red-500",
  },
  {
    key: "CaseFollowUp",
    label: "Case Follow-Up",
    icon: MdReplay,
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    bar: "border-l-amber-500",
  },
  {
    key: "InternalReview",
    label: "Internal Review",
    icon: MdRateReview,
    dot: "bg-teal-500",
    chip: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    bar: "border-l-teal-500",
  },
  {
    key: "Custom",
    label: "Custom Event",
    icon: MdEvent,
    dot: "bg-gray-500",
    chip: "bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-gray-200",
    bar: "border-l-gray-400",
  },
];

export const CATEGORY_MAP = REMINDER_CATEGORIES.reduce((m, c) => {
  m[c.key] = c;
  return m;
}, {});

export function categoryOf(key) {
  return CATEGORY_MAP[key] || CATEGORY_MAP.Custom;
}
