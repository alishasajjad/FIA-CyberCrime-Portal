import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function PageHeader({ title, subtitle, breadcrumbs = [] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-[#0f172a] to-emerald-950 py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 50%, #22c55e 0, transparent 40%), radial-gradient(circle at 85% 30%, #38bdf8 0, transparent 35%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <li>
                <Link to="/" className="transition-colors hover:text-emerald-300">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="transition-colors hover:text-emerald-300"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-emerald-300">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
