import React from "react";
import { apiFetch } from "services/api";
import { PAKISTAN_CITIES, PAKISTAN_OUTLINE } from "constants/cities";
import {
  StatCard,
  SectionCard,
  CardSkeleton,
  EmptyState,
} from "components/ui";
import {
  MdMap,
  MdLocationCity,
  MdWhereToVote,
  MdReportProblem,
  MdRefresh,
} from "react-icons/md";

// Heat color by normalized intensity (0..1): green → amber → red.
function heatColor(t) {
  if (t <= 0) return "#cbd5e1";
  if (t < 0.34) return "#22c55e";
  if (t < 0.67) return "#f59e0b";
  return "#ef4444";
}

const CrimeMap = () => {
  const [cities, setCities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [active, setActive] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/complaints/city-stats");
      setCities(Array.isArray(data?.cities) ? data.cities : []);
    } catch (err) {
      setError(err?.message || "Failed to load city analytics.");
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Index stats by city name for quick lookup.
  const statByCity = React.useMemo(() => {
    const m = {};
    cities.forEach((c) => (m[c.city] = c));
    return m;
  }, [cities]);

  const maxTotal = React.useMemo(
    () => cities.reduce((mx, c) => Math.max(mx, c.total), 0) || 1,
    [cities]
  );

  const totalComplaints = cities.reduce((s, c) => s + c.total, 0);
  const citiesAffected = cities.filter((c) => c.total > 0).length;
  const topHotspot = cities.length ? cities[0] : null;
  const highSeverity = cities.reduce((s, c) => s + (c.highSeverity || 0), 0);

  // Map nodes = known-coordinate cities merged with their stats.
  const nodes = PAKISTAN_CITIES.filter((c) => c.name !== "Other").map((c) => {
    const stat = statByCity[c.name];
    const total = stat?.total || 0;
    return { ...c, total, intensity: total / maxTotal, stat };
  });

  const ranked = [...cities]
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdMap className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Crime Heat Map &amp; Regional Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Geographic distribution of registered cyber crime complaints across
              Pakistan. Identify hotspots to prioritize resourcing.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
        >
          <MdRefresh className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdReportProblem} label="Total Complaints" value={totalComplaints} accent="brand" loading={loading} />
        <StatCard icon={MdLocationCity} label="Cities Affected" value={citiesAffected} accent="blue" loading={loading} />
        <StatCard icon={MdWhereToVote} label="Top Hotspot" value={topHotspot ? topHotspot.city : "—"} hint={topHotspot ? `${topHotspot.total} cases` : ""} accent="amber" loading={loading} />
        <StatCard icon={MdReportProblem} label="High Severity" value={highSeverity} accent="red" loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Map */}
        <SectionCard
          title="Pakistan Cyber Crime Heat Map"
          subtitle="Node size & color scale with complaint volume per city."
          className="lg:col-span-3"
        >
          {loading ? (
            <CardSkeleton lines={6} />
          ) : error ? (
            <EmptyState icon={MdMap} title="Could not load map data" message={error} />
          ) : (
            <div className="relative">
              <svg viewBox="0 0 100 120" className="mx-auto h-[460px] w-full max-w-md">
                <path
                  d={PAKISTAN_OUTLINE}
                  className="fill-brand-600/5 stroke-brand-600/40 dark:fill-white/[0.03] dark:stroke-white/15"
                  strokeWidth="0.8"
                />
                {nodes.map((n) => {
                  const r = 1.8 + n.intensity * 4.2;
                  return (
                    <g
                      key={n.name}
                      onMouseEnter={() => setActive(n)}
                      onMouseLeave={() => setActive(null)}
                      className="cursor-pointer"
                    >
                      {n.total > 0 && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r + 2.5}
                          fill={heatColor(n.intensity)}
                          opacity="0.25"
                        />
                      )}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={n.total > 0 ? r : 1.4}
                        fill={n.total > 0 ? heatColor(n.intensity) : "#94a3b8"}
                        stroke="#fff"
                        strokeWidth="0.4"
                      />
                      <text
                        x={n.x}
                        y={n.y - r - 1.5}
                        textAnchor="middle"
                        className="fill-navy-700 dark:fill-gray-200"
                        style={{ fontSize: "3px", fontWeight: 600 }}
                      >
                        {n.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {active && (
                <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-center shadow-lg dark:border-navy-700 dark:bg-navy-900">
                  <p className="text-sm font-bold text-navy-900 dark:text-white">
                    {active.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {active.province}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-brand-700 dark:text-brand-400">
                    {active.total} complaint{active.total === 1 ? "" : "s"}
                  </p>
                </div>
              )}

              {/* Legend */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: "#22c55e" }} /> Low</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: "#f59e0b" }} /> Moderate</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: "#ef4444" }} /> High</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: "#94a3b8" }} /> No data</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Ranked cities */}
        <SectionCard
          title="City Hotspots"
          subtitle="Ranked by complaint volume"
          className="lg:col-span-2"
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} lines={1} />
              ))}
            </div>
          ) : ranked.length === 0 ? (
            <EmptyState
              icon={MdLocationCity}
              title="No city data yet"
              message="City analytics will appear here once complaints with a city are submitted."
            />
          ) : (
            <ul className="space-y-3">
              {ranked.map((c, i) => {
                const pct = Math.round((c.total / maxTotal) * 100);
                return (
                  <li key={c.city}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-semibold text-navy-900 dark:text-white">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500 dark:bg-navy-700 dark:text-gray-300">
                          {i + 1}
                        </span>
                        {c.city}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {c.total} total · {c.open} open
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-900">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: heatColor(c.total / maxTotal) }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default CrimeMap;
