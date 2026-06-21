import React from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import {
  MdGavel,
  MdPerson,
  MdAssignmentInd,
  MdNotifications,
  MdSupportAgent,
  MdClose,
} from "react-icons/md";
import { apiFetch } from "services/api";
import { getAuthRole } from "utils/auth";

const GROUP_META = {
  complaints: { label: "Complaints", icon: MdGavel },
  users: { label: "Users & Officers", icon: MdPerson },
  assignments: { label: "Assignments", icon: MdAssignmentInd },
  supportTickets: { label: "Support Tickets", icon: MdSupportAgent },
  notifications: { label: "Notifications", icon: MdNotifications },
};

const GROUP_ORDER = [
  "complaints",
  "assignments",
  "users",
  "supportTickets",
  "notifications",
];

export default function GlobalSearch() {
  const [query, setQuery] = React.useState("");
  const [groups, setGroups] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const navigate = useNavigate();
  const role = getAuthRole();

  // Debounced, abortable search.
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const data = await apiFetch(`/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        setGroups(data?.groups || {});
      } catch (err) {
        if (err?.name !== "AbortError") setGroups({});
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  React.useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (path) => {
    setOpen(false);
    setQuery("");
    setGroups(null);
    navigate(path);
  };

  const handleSelect = (type, item) => {
    switch (type) {
      case "complaints":
        return go(`/admin/complaint/${item._id}`);
      case "assignments":
        return item?.complaint?._id
          ? go(`/admin/complaint/${item.complaint._id}`)
          : go(role === "Admin" ? "/admin/dashboard" : "/admin/investigations");
      case "users":
        return go("/admin/users");
      case "notifications":
        return go("/admin/notifications");
      case "supportTickets":
        return go("/admin/notifications");
      default:
        return setOpen(false);
    }
  };

  const presentGroups = groups
    ? GROUP_ORDER.filter((k) => Array.isArray(groups[k]) && groups[k].length > 0)
    : [];
  const hasResults = presentGroups.length > 0;
  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex h-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white xl:w-[225px]">
        <p className="pl-3 pr-2 text-xl">
          <FiSearch className="h-4 w-4 text-gray-400 dark:text-white" />
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search incidents, IDs..."
          aria-label="Global search"
          className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-white sm:w-fit"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setGroups(null);
            }}
            className="pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <MdClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="absolute left-0 top-[120%] z-50 max-h-[70vh] w-[320px] overflow-y-auto rounded-2xl bg-white p-2 shadow-[0_10px_40px_rgba(22,101,52,0.15)] dark:bg-navy-700 sm:w-[400px]">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-navy-800"
                />
              ))}
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <FiSearch className="h-7 w-7 text-gray-300" />
              <p className="mt-2 text-sm font-semibold text-navy-700 dark:text-white">
                No results found
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Nothing matched &ldquo;{query.trim()}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {presentGroups.map((key) => {
                const meta = GROUP_META[key];
                const Icon = meta.icon;
                return (
                  <div key={key}>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {meta.label}
                    </p>
                    {groups[key].map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleSelect(key, item)}
                        className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-green-50 dark:hover:bg-navy-800"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-700 dark:text-brand-300">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <ResultLine type={key} item={item} />
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultLine({ type, item }) {
  if (type === "complaints") {
    return (
      <>
        <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
          {item.referenceId || item._id}
        </span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
          {item.incidentType}
          {item.city ? ` · ${item.city}` : ""} · {item.status}
        </span>
      </>
    );
  }
  if (type === "assignments") {
    return (
      <>
        <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
          {item.complaint?.referenceId || "Assignment"}
        </span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
          {item.complaint?.incidentType || ""}
          {item.assignedTo?.name ? ` · ${item.assignedTo.name}` : ""} · {item.status}
        </span>
      </>
    );
  }
  if (type === "users") {
    return (
      <>
        <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
          {item.name}
        </span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
          {item.role}
          {item.unit ? ` · ${item.unit}` : ""} · {item.email}
        </span>
      </>
    );
  }
  if (type === "supportTickets") {
    return (
      <>
        <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
          {item.subject}
        </span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
          {item.category} · {item.status}
        </span>
      </>
    );
  }
  // notifications
  return (
    <>
      <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
        {item.title}
      </span>
      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
        {item.message}
      </span>
    </>
  );
}
