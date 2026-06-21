import React from "react";
import { apiFetch } from "services/api";
import { StatCard, SectionCard, CardSkeleton, EmptyState } from "components/ui";
import { BarList, DonutChart, LineTrend, colorAt } from "components/ui/charts";
import { downloadCsv, sectionsToCsv, printReport, tableHtml } from "utils/exporters";
import {
  MdInsights,
  MdReport,
  MdTrendingUp,
  MdPendingActions,
  MdCheckCircle,
  MdWarningAmber,
  MdRefresh,
  MdDownload,
  MdPrint,
  MdFilterAltOff,
  MdLocationCity,
} from "react-icons/md";

const SEVERITY_COLORS = { Critical: "#dc2626", High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };
const STATUS_COLORS = {
  Pending: "#94a3b8",
  "In Review": "#0ea5e9",
  "Under Investigation": "#f59e0b",
  Resolved: "#22c55e",
  Closed: "#0d9488",
};

const emptyFilters = {
  from: "",
  to: "",
  city: "",
  category: "",
  officer: "",
  status: "",
  department: "",
};

export default function AdvancedAnalytics() {
  const [filters, setFilters] = React.useState(emptyFilters);
  const [data, setData] = React.useState(null);
  const [options, setOptions] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const buildQuery = React.useCallback((f) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v) p.append(k, v);
    });
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  }, []);

  const load = React.useCallback(
    async (f) => {
      setLoading(true);
      setError("");
      try {
        const d = await apiFetch(`/reports/analytics${buildQuery(f)}`);
        setData(d);
        setOptions((prev) => prev || d.filterOptions);
      } catch (err) {
        setError(err?.message || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  // Debounced reload on filter change.
  React.useEffect(() => {
    const t = setTimeout(() => load(filters), 350);
    return () => clearTimeout(t);
  }, [filters, load]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const reset = () => setFilters(emptyFilters);
  const activeFilters = Object.entries(filters).filter(([, v]) => v);

  const opt = options || { cities: [], categories: [], departments: [], statuses: [], officers: [] };

  const exportCsv = () => {
    if (!data) return;
    const sections = sectionsToCsv([
      { title: "FIA Cyber Crime — Advanced Analytics", headers: ["Generated", new Date().toLocaleString()] },
      { title: "Summary", headers: ["Metric", "Value"], rows: [
        ["Total complaints", data.total],
        ["Resolution rate %", data.resolutionRate],
        ["Pending", data.pendingVsResolved.pending],
        ["Resolved", data.pendingVsResolved.resolved],
        ["Overdue (SLA)", data.escalations.overdue],
      ]},
      { title: "By City", headers: ["City", "Count"], rows: data.byCity.map((c) => [c.city, c.count]) },
      { title: "By Category", headers: ["Category", "Count"], rows: data.byCategory.map((c) => [c.category, c.count]) },
      { title: "By Department", headers: ["Department", "Count"], rows: (data.byDepartment || []).map((c) => [c.department, c.count]) },
      { title: "By Severity", headers: ["Severity", "Count"], rows: data.bySeverity.map((c) => [c.severity, c.count]) },
      { title: "By Status", headers: ["Status", "Count"], rows: data.byStatus.map((c) => [c.status, c.count]) },
      { title: "Monthly Trend", headers: ["Month", "Count"], rows: data.byMonth.map((m) => [m.label, m.count]) },
      { title: "Officer Comparison", headers: ["Officer", "Assigned", "Resolved", "Rate %"], rows: data.officerComparison.map((o) => [o.name, o.assigned, o.resolved, o.resolutionRate]) },
    ]);
    downloadCsv("fia-advanced-analytics", sections);
  };

  const printPdf = () => {
    if (!data) return;
    const body =
      `<h1>FIA Cyber Crime — Advanced Analytics</h1><div class="sub">Generated ${new Date().toLocaleString()}</div>` +
      tableHtml("Summary", ["Metric", "Value"], [
        ["Total complaints", data.total],
        ["Resolution rate %", data.resolutionRate],
        ["Pending", data.pendingVsResolved.pending],
        ["Resolved", data.pendingVsResolved.resolved],
        ["Overdue (SLA)", data.escalations.overdue],
      ]) +
      tableHtml("By City", ["City", "Count"], data.byCity.map((c) => [c.city, c.count])) +
      tableHtml("By Category", ["Category", "Count"], data.byCategory.map((c) => [c.category, c.count])) +
      tableHtml("By Department", ["Department", "Count"], (data.byDepartment || []).map((c) => [c.department, c.count])) +
      tableHtml("Officer Comparison", ["Officer", "Assigned", "Resolved", "Rate %"], data.officerComparison.map((o) => [o.name, o.assigned, o.resolved, o.resolutionRate]));
    printReport("FIA Advanced Analytics", body);
  };

  const inputCls =
    "rounded-lg border border-gray-200 bg-lightPrimary px-2.5 py-2 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white";

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdInsights className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">Advanced Analytics</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Interactive, filterable intelligence across cities, categories, officers, and trends.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => load(filters)} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
            <MdRefresh className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={exportCsv} disabled={!data} className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50">
            <MdDownload className="h-4 w-4" /> CSV / Excel
          </button>
          <button type="button" onClick={printPdf} disabled={!data} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
            <MdPrint className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <SectionCard title="Filters" subtitle="Refine the dataset — charts update automatically.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">From
            <input type="date" value={filters.from} onChange={set("from")} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">To
            <input type="date" value={filters.to} onChange={set("to")} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">City
            <select value={filters.city} onChange={set("city")} className={inputCls}>
              <option value="">All</option>
              {opt.cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">Category
            <select value={filters.category} onChange={set("category")} className={inputCls}>
              <option value="">All</option>
              {opt.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">Officer
            <select value={filters.officer} onChange={set("officer")} className={inputCls}>
              <option value="">All</option>
              {opt.officers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">Status
            <select value={filters.status} onChange={set("status")} className={inputCls}>
              <option value="">All</option>
              {opt.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">Department
            <select value={filters.department} onChange={set("department")} className={inputCls}>
              <option value="">All</option>
              {opt.departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">Active:</span>
            {activeFilters.map(([k, v]) => (
              <span key={k} className="rounded-full bg-brand-600/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                {k}: {v}
              </span>
            ))}
            <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline dark:text-red-400">
              <MdFilterAltOff className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        ) : null}
      </SectionCard>

      {error ? (
        <EmptyState icon={MdInsights} title="Could not load analytics" message={error} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <StatCard icon={MdReport} label="Total" value={data?.total ?? 0} accent="brand" loading={loading} />
            <StatCard icon={MdTrendingUp} label="Resolution Rate" value={`${data?.resolutionRate ?? 0}%`} accent="navy" loading={loading} />
            <StatCard icon={MdPendingActions} label="Pending" value={data?.pendingVsResolved?.pending ?? 0} accent="amber" loading={loading} />
            <StatCard icon={MdCheckCircle} label="Resolved" value={data?.pendingVsResolved?.resolved ?? 0} accent="navy" loading={loading} />
            <StatCard icon={MdWarningAmber} label="Overdue (SLA)" value={data?.escalations?.overdue ?? 0} accent="red" loading={loading} />
          </div>

          {loading && !data ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CardSkeleton lines={5} /><CardSkeleton lines={5} />
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="City-wise Complaints" subtitle="Click a city to drill down">
                  <BarList
                    items={data.byCity.slice(0, 12)}
                    labelKey="city"
                    onItemClick={(it) => setFilters((f) => ({ ...f, city: it.city === "Unspecified" ? "" : it.city }))}
                  />
                </SectionCard>
                <SectionCard title="Category Distribution" subtitle="Click a category to drill down">
                  <BarList
                    items={data.byCategory.slice(0, 12)}
                    labelKey="category"
                    onItemClick={(it) => setFilters((f) => ({ ...f, category: it.category }))}
                  />
                </SectionCard>
              </div>

              <SectionCard title="Department-wise Complaints" subtitle="Complaints grouped by the handling department">
                <BarList
                  items={(data.byDepartment || []).slice(0, 12)}
                  labelKey="department"
                  onItemClick={(it) =>
                    setFilters((f) => ({
                      ...f,
                      department: it.department === "Unassigned" ? "" : it.department,
                    }))
                  }
                />
              </SectionCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <SectionCard title="Severity Analysis">
                  <DonutChart segments={data.bySeverity.map((s) => ({ label: s.severity, value: s.count, color: SEVERITY_COLORS[s.severity] }))} />
                </SectionCard>
                <SectionCard title="Status Breakdown">
                  <DonutChart segments={data.byStatus.map((s) => ({ label: s.status, value: s.count, color: STATUS_COLORS[s.status] }))} />
                </SectionCard>
                <SectionCard title="Pending vs Resolved">
                  <DonutChart segments={[
                    { label: "Pending", value: data.pendingVsResolved.pending, color: "#f59e0b" },
                    { label: "Resolved", value: data.pendingVsResolved.resolved, color: "#22c55e" },
                  ]} />
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Complaint Growth / Monthly Trend">
                  <LineTrend points={data.byMonth} color="#16a34a" />
                </SectionCard>
                <SectionCard title="Escalation Trend (High/Critical)">
                  <LineTrend points={data.escalations.trend} color="#ef4444" />
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Officer Performance Comparison">
                  {data.officerComparison.length === 0 ? (
                    <EmptyState icon={MdReport} title="No assigned cases in range" />
                  ) : (
                    <ul className="space-y-3">
                      {data.officerComparison.map((o, i) => (
                        <li key={o.name + i}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-navy-900 dark:text-white">{o.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{o.resolved}/{o.assigned} · {o.resolutionRate}%</span>
                          </div>
                          <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-900">
                            <div className="h-full bg-brand-600" style={{ width: `${o.assigned ? (o.resolved / o.assigned) * 100 : 0}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard title="Notification Activity">
                  <LineTrend points={data.notifications.byMonth} color="#0ea5e9" />
                  <div className="mt-4">
                    <BarList items={data.notifications.byType} labelKey="type" colorFor={(_, i) => colorAt(i)} />
                  </div>
                </SectionCard>
              </div>

              {data.total === 0 ? (
                <EmptyState icon={MdLocationCity} title="No complaints match these filters" message="Adjust or clear the filters to see analytics." />
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
