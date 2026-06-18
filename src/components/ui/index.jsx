import React from "react";

/* ------------------------------------------------------------------ */
/*  Shared enterprise UI primitives for the FIA Cyber Crime console.   */
/*  Pure presentational components — no data/logic coupling.           */
/* ------------------------------------------------------------------ */

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/80 dark:bg-navy-700/60 ${className}`}
    />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
      <Skeleton className="h-5 w-1/3" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-navy-700">
      <div className="flex gap-4 bg-gray-50 px-4 py-3 dark:bg-navy-900">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center dark:border-navy-700 dark:bg-navy-900/30">
      {Icon ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 dark:text-brand-400">
          <Icon className="h-7 w-7" aria-hidden />
        </span>
      ) : null}
      <p className="mt-4 text-base font-bold text-navy-900 dark:text-white">
        {title}
      </p>
      {message ? (
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const ACCENTS = {
  brand: "from-brand-600 to-brand-800 text-brand-700 dark:text-brand-300 bg-brand-600/10",
  blue: "from-blue-500 to-blue-700 text-blue-700 dark:text-blue-300 bg-blue-500/10",
  amber: "from-amber-500 to-amber-700 text-amber-700 dark:text-amber-300 bg-amber-500/10",
  red: "from-red-500 to-red-700 text-red-700 dark:text-red-300 bg-red-500/10",
  navy: "from-navy-700 to-navy-900 text-navy-700 dark:text-white bg-navy-700/10",
};

export function StatCard({ icon: Icon, label, value, hint, accent = "brand", loading }) {
  const cls = ACCENTS[accent] || ACCENTS.brand;
  const iconBg = cls.split(" ").slice(2).join(" ");
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md shadow-shadow-500 transition-shadow hover:shadow-lg dark:bg-navy-800">
      {Icon ? (
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1.5 h-7 w-16" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold text-navy-900 dark:text-white">
            {value}
          </p>
        )}
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-gray-400">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES = {
  Pending: "bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-gray-200",
  "In Review": "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  "Under Investigation":
    "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Resolved: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  Closed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
};

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status || "Pending"}
    </span>
  );
}

const SEVERITY_STYLES = {
  Critical: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  High: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  Medium: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  Low: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
};

export function SeverityBadge({ severity }) {
  const cls = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low;
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {severity || "Low"}
    </span>
  );
}
