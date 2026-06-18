import React from "react";
import { Link } from "react-router-dom";
import {
  MdReport,
  MdPendingActions,
  MdCheckCircle,
  MdWarning,
  MdSearch,
  MdMap,
  MdArrowForward,
} from "react-icons/md";
import { apiFetch } from "services/api";
import {
  StatCard,
  SectionCard,
  TableSkeleton,
  EmptyState,
  StatusBadge,
  SeverityBadge,
} from "components/ui";

const STATUS_FILTERS = [
  "All",
  "Pending",
  "In Review",
  "Under Investigation",
  "Resolved",
  "Closed",
];

const CrimeDashboard = () => {
  const [officers, setOfficers] = React.useState([]);
  const [activeComplaintId, setActiveComplaintId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [stats, setStats] = React.useState({
    totalComplaints: 0,
    pendingCases: 0,
    resolvedCases: 0,
    highSeverityAlerts: 0,
  });
  const [recentComplaints, setRecentComplaints] = React.useState([]);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);

      // --- Fetch complaints (isolated) ---
      try {
        const [statsData, listData] = await Promise.all([
          apiFetch("/complaints/stats"),
          apiFetch("/complaints/search"),
        ]);

        setStats(statsData || {});

        const list = Array.isArray(listData?.complaints)
          ? listData.complaints
          : [];
        setRecentComplaints(list.slice(0, 10));
        setActiveComplaintId((prev) => {
          if (prev && list.some((c) => c._id === prev)) return prev;
          return list[0]?._id || "";
        });
      } catch (err) {
        console.error("[CrimeDashboard] Complaint fetch error:", err);
      }

      // --- Fetch officers (isolated so it runs even if complaints fail) ---
      try {
        const usersData = await apiFetch("/users");
        console.log("[CrimeDashboard] /users API response:", usersData);
        if (Array.isArray(usersData?.users)) {
          const onlyOfficers = usersData.users.filter(
            (u) =>
              u.role === "InvestigationOfficer" &&
              u.isApprovedOfficer === true &&
              u.status === "Active"
          );
          console.log("[CrimeDashboard] Filtered officers:", onlyOfficers);
          setOfficers(onlyOfficers);
        } else {
          console.warn("[CrimeDashboard] /users response has no .users array:", usersData);
        }
      } catch (err) {
        console.error("[CrimeDashboard] Officers fetch error:", err);
      }

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = recentComplaints.find((c) => c._id === activeComplaintId);
  const assignableOfficers = React.useMemo(() => {
    if (!active) return officers;
    const dept = String(active.department || "").trim().toLowerCase();
    if (!dept) return officers;
    // Try to match by department, but fall back to ALL officers if no match
    const matched = officers.filter((o) => String(o.unit || "").trim().toLowerCase() === dept);
    console.log("[CrimeDashboard] assignableOfficers — dept:", dept, "matched:", matched.length, "total:", officers.length);
    return matched.length > 0 ? matched : officers;
  }, [active, officers]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return recentComplaints.filter((c) => {
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(c.referenceId || c._id).toLowerCase().includes(q) ||
        String(c.incidentType || "").toLowerCase().includes(q) ||
        String(c.city || "").toLowerCase().includes(q)
      );
    });
  }, [recentComplaints, query, statusFilter]);

  return (
    <div className="mt-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
          Overview
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          High-level status of cyber crime complaints, case workload, and
          critical alerts across the platform.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MdReport} label="Total Complaints" value={Number(stats.totalComplaints || 0).toLocaleString()} accent="brand" loading={loading} />
        <StatCard icon={MdPendingActions} label="Pending Cases" value={Number(stats.pendingCases || 0).toLocaleString()} accent="amber" loading={loading} />
        <StatCard icon={MdCheckCircle} label="Resolved Cases" value={Number(stats.resolvedCases || 0).toLocaleString()} accent="navy" loading={loading} />
        <StatCard icon={MdWarning} label="High Severity Alerts" value={Number(stats.highSeverityAlerts || 0).toLocaleString()} accent="red" loading={loading} />
      </div>

      {/* Analytics + tables layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Recent Complaints"
          subtitle="Latest submitted incidents with ID, type, city, and status."
        >
          {/* Search + filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MdSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID, type, or city…"
                className="w-full rounded-xl border border-gray-200 bg-lightPrimary py-2.5 pl-9 pr-3 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-lightPrimary px-3 py-2.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={MdReport}
              title={recentComplaints.length === 0 ? "No complaints yet" : "No matching complaints"}
              message={
                recentComplaints.length === 0
                  ? "New complaints will appear here as citizens submit reports."
                  : "Try adjusting your search or status filter."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm dark:divide-white/10">
                <thead className="bg-green-50/50 dark:bg-navy-900">
                  <tr>
                    {["Complaint ID", "Type", "City", "Status", "Priority"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {filtered.map((row) => (
                    <tr
                      key={row._id}
                      className={`cursor-pointer transition-colors hover:bg-green-50/60 dark:hover:bg-navy-900 ${
                        activeComplaintId === row._id ? "bg-brand-50/60 dark:bg-navy-900" : ""
                      }`}
                      onClick={() => setActiveComplaintId(row._id)}
                    >
                      <td className="px-4 py-2.5 text-sm font-semibold text-navy-700 dark:text-white">
                        {row.referenceId || row._id}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200">
                        {row.incidentType}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200">
                        {row.city || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <SeverityBadge severity={row.severity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/50 p-4 dark:border-navy-700 dark:bg-navy-900/40">
            <h4 className="text-base font-bold text-navy-900 dark:text-white">
              Admin actions
            </h4>
            {!active ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Select a complaint to manage.
              </p>
            ) : (
              <div
                key={active._id}
                className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div className="md:col-span-2 text-sm text-gray-600 dark:text-gray-300">
                  Managing:{" "}
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {active.referenceId || active._id}
                  </span>{" "}
                  ({active.incidentType})
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Assign to Officer
                  </label>
                  <select
                    id="adminOfficerId"
                    defaultValue={active.assignedTo?._id || ""}
                    className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  >
                    <option value="">Unassigned</option>
                    {assignableOfficers.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.name} ({o.unit || "Unit"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Case Status
                  </label>
                  <select
                    id="adminStatus"
                    defaultValue={active.status}
                    className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  >
                    {[
                      "Pending",
                      "In Review",
                      "Under Investigation",
                      "Resolved",
                      "Closed",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Severity
                  </label>
                  <select
                    id="adminSeverity"
                    defaultValue={active.severity}
                    className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  >
                    {["Low", "Medium", "High", "Critical"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Notes (visible to user)
                  </label>
                  <textarea
                    id="adminNotes"
                    rows="3"
                    placeholder="Add admin notes, assignment rationale, or next steps."
                    className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-xl bg-brand-700 hover:bg-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500"
                    onClick={async () => {
                      try {
                        const officerId =
                          document.getElementById("adminOfficerId")?.value || "";
                        const notes =
                          document.getElementById("adminNotes")?.value || "";
                        if (officerId) {
                          await apiFetch(`/complaints/${active._id}/assign`, {
                            method: "POST",
                            body: { officerId, notes },
                          });
                        }

                        const status =
                          document.getElementById("adminStatus")?.value || active.status;
                        const severity =
                          document.getElementById("adminSeverity")?.value || active.severity;

                        await apiFetch(`/complaints/${active._id}/status`, {
                          method: "PATCH",
                          body: { status, severity, notes },
                        });

                        window.alert("Complaint updated.");
                        window.location.reload();
                      } catch (err) {
                        window.alert(err?.message || "Admin action error");
                      }
                    }}
                  >
                    Save &amp; Update
                  </button>

                  <button
                    type="button"
                    className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-700"
                    onClick={async () => {
                      if (!window.confirm("Delete this complaint?")) return;
                      try {
                        await apiFetch(`/complaints/${active._id}`, {
                          method: "DELETE",
                        });
                        window.alert("Complaint deleted.");
                        window.location.reload();
                      } catch (err) {
                        window.alert(err?.message || "Delete error");
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Regional snapshot → links to the Crime Heat Map */}
        <SectionCard title="Regional Insights" subtitle="Cyber crime distribution across Pakistan.">
          <div className="flex flex-col items-center rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 text-center dark:border-navy-700 dark:from-navy-900 dark:to-navy-800">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
              <MdMap className="h-7 w-7" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-semibold text-navy-900 dark:text-white">
              Crime Heat Map &amp; City Analytics
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Visualize complaint hotspots by city and province to prioritize
              investigation resources.
            </p>
            <Link
              to="/admin/crime-map"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Open Crime Map
              <MdArrowForward className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default CrimeDashboard;
