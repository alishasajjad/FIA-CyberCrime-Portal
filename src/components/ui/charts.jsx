import React from "react";

// Lightweight, dependency-free, responsive chart primitives consistent with
// the enterprise design system. No external charting library required.

const PALETTE = [
  "#16a34a", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6",
  "#14b8a6", "#ec4899", "#64748b", "#22c55e", "#3b82f6",
];

export function colorAt(i) {
  return PALETTE[i % PALETTE.length];
}

// Horizontal bar list.
export function BarList({ items, valueKey = "count", labelKey = "label", colorFor, onItemClick }) {
  const max = Math.max(1, ...items.map((it) => it[valueKey] || 0));
  if (!items.length) {
    return <p className="py-3 text-sm text-gray-500 dark:text-gray-400">No data for the current filters.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const v = it[valueKey] || 0;
        const pct = Math.round((v / max) * 100);
        const color = colorFor ? colorFor(it, i) : colorAt(i);
        const inner = (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate pr-2 font-medium text-navy-900 dark:text-white">{it[labelKey]}</span>
              <span className="shrink-0 text-gray-500 dark:text-gray-400">{v}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-900">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
          </>
        );
        return (
          <li key={it[labelKey] ?? i}>
            {onItemClick ? (
              <button
                type="button"
                onClick={() => onItemClick(it)}
                className="w-full rounded-lg px-1 py-0.5 text-left transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:hover:bg-navy-900/50"
              >
                {inner}
              </button>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

// SVG donut chart with legend.
export function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  const r = 42;
  const C = 2 * Math.PI * r;
  let offset = 0;
  if (total === 0) {
    return <p className="py-3 text-sm text-gray-500 dark:text-gray-400">No data for the current filters.</p>;
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90" role="img" aria-label="Donut chart">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="14" className="text-gray-100 dark:text-navy-900" />
        {segments.map((seg, i) => {
          const val = seg.value || 0;
          const len = (val / total) * C;
          const circle = (
            <circle
              key={i}
              cx="60" cy="60" r={r} fill="none"
              stroke={seg.color || colorAt(i)}
              strokeWidth="14"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return circle;
        })}
        <text x="60" y="60" transform="rotate(90 60 60)" textAnchor="middle" dominantBaseline="central" className="fill-navy-900 dark:fill-white" style={{ fontSize: "16px", fontWeight: 700 }}>
          {total}
        </text>
      </svg>
      <ul className="space-y-1.5">
        {segments.map((seg, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ background: seg.color || colorAt(i) }} />
            <span className="text-gray-700 dark:text-gray-200">{seg.label}</span>
            <span className="font-semibold text-navy-900 dark:text-white">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// SVG area/line trend.
export function LineTrend({ points, color = "#16a34a", height = 160 }) {
  if (!points || points.length === 0) {
    return <p className="py-3 text-sm text-gray-500 dark:text-gray-400">No trend data for the current filters.</p>;
  }
  const W = 100;
  const H = 40;
  const max = Math.max(1, ...points.map((p) => p.count || 0));
  const stepX = points.length > 1 ? W / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : W / 2;
    const y = H - ((p.count || 0) / max) * (H - 4) - 2;
    return [x, y];
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(2)},${H} L${coords[0][0].toFixed(2)},${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height }} role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trendfill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.4" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        {points.map((p, i) => (
          <span key={i} className="flex-1 truncate text-center">{p.label}</span>
        ))}
      </div>
    </div>
  );
}
