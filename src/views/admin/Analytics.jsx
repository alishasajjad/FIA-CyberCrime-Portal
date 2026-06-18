import React from "react";
import PieChart from "components/charts/PieChart";
import Widget from "components/widget/Widget";
import { MdReport, MdPendingActions, MdCheckCircle, MdWarning } from "react-icons/md";
import { apiFetch } from "services/api";

const Analytics = () => {
  const [stats, setStats] = React.useState({
    totalComplaints: 0,
    pendingCases: 0,
    resolvedCases: 0,
    highSeverityAlerts: 0,
  });
  const [error, setError] = React.useState("");
  const [report, setReport] = React.useState({ monthly: [], yearly: [], category: [] });

  const normalizeMonthly = (item) => {
    if (item?.label) return item.label;
    const y = item?._id?.y ?? item?.year;
    const m = item?._id?.m ?? item?.month;
    if (!y || !m) return "N/A";
    return `${y}-${String(m).padStart(2, "0")}`;
  };

  const normalizeYearly = (item) => {
    if (item?.label) return item.label;
    return item?._id?.y ?? item?.year ?? "N/A";
  };

  const normalizeCategory = (item) => {
    return item?.label || item?._id || "Unknown";
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        const [data, reportData] = await Promise.all([
          apiFetch("/complaints/stats"),
          apiFetch("/reports/summary"),
        ]);
        setStats({
          totalComplaints: data?.totalComplaints ?? 0,
          pendingCases: data?.pendingCases ?? 0,
          resolvedCases: data?.resolvedCases ?? 0,
          highSeverityAlerts: data?.highSeverityAlerts ?? 0,
        });
        setReport({
          monthly: reportData?.monthly || [],
          yearly: reportData?.yearly || [],
          category: reportData?.category || [],
        });
        setError("");
      } catch (err) {
        setError(err?.message || "Failed to load analytics");
      }
    };
    load();
  }, []);

  const open = Math.max(0, stats.pendingCases);
  const resolved = Math.max(0, stats.resolvedCases);
  const pieSeries = [open, resolved];
  const pieOptions = {
    labels: ["Open pipeline", "Resolved"],
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: true },
    legend: { position: "bottom" },
    colors: ["#f59e0b", "#22c55e"],
    stroke: { show: false },
    theme: { mode: document.body.classList.contains("dark") ? "dark" : "light" },
  };

  return (
    <div className="mt-3 space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h2 className="text-xl font-semibold text-navy-700 dark:text-white">
          Analytics
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Live complaint pipeline metrics from the reporting API.
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Widget
          icon={<MdReport className="h-7 w-7" />}
          title="Total complaints"
          subtitle={stats.totalComplaints?.toLocaleString?.() ?? stats.totalComplaints}
        />
        <Widget
          icon={<MdPendingActions className="h-7 w-7" />}
          title="Open pipeline"
          subtitle={stats.pendingCases?.toLocaleString?.() ?? stats.pendingCases}
        />
        <Widget
          icon={<MdCheckCircle className="h-7 w-7" />}
          title="Resolved"
          subtitle={stats.resolvedCases?.toLocaleString?.() ?? stats.resolvedCases}
        />
        <Widget
          icon={<MdWarning className="h-7 w-7" />}
          title="High / critical (open)"
          subtitle={
            stats.highSeverityAlerts?.toLocaleString?.() ?? stats.highSeverityAlerts
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
          <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
            Resolution mix
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Share of cases still in progress versus closed outcomes.
          </p>
          <div className="mt-4 h-[260px] sm:h-[320px]">
            {open + resolved === 0 ? (
              <p className="text-sm text-gray-500">No complaint data yet.</p>
            ) : (
              <PieChart series={pieSeries} options={pieOptions} />
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
          <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
            Operational notes
          </h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>
              Pending counts include <strong>Pending</strong>, <strong>In Review</strong>,
              and <strong>Under Investigation</strong>.
            </li>
            <li>
              High severity alerts count open cases marked High or Critical.
            </li>
            <li>Use the dashboard to assign officers and advance individual cases.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
          <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
            Monthly Report
          </h3>
          <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {report.monthly.length === 0 ? (
              <p className="text-gray-500">No monthly data.</p>
            ) : (
              report.monthly.map((m) => (
                <div key={`${normalizeMonthly(m)}-${m.count}`} className="flex justify-between">
                  <span>{normalizeMonthly(m)}</span>
                  <span className="font-semibold">{m.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
          <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
            Yearly Report
          </h3>
          <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {report.yearly.length === 0 ? (
              <p className="text-gray-500">No yearly data.</p>
            ) : (
              report.yearly.map((y) => (
                <div key={`${normalizeYearly(y)}-${y.count}`} className="flex justify-between">
                  <span>{normalizeYearly(y)}</span>
                  <span className="font-semibold">{y.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
          <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
            Category-wise
          </h3>
          <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {report.category.length === 0 ? (
              <p className="text-gray-500">No category data.</p>
            ) : (
              report.category.map((c) => (
                <div key={`${normalizeCategory(c)}-${c.count}`} className="flex justify-between gap-3">
                  <span className="truncate">{normalizeCategory(c)}</span>
                  <span className="font-semibold">{c.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
