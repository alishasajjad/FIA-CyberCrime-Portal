import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MdHome, MdReport, MdSearch, MdSupportAgent } from "react-icons/md";
import PageMeta from "components/public/PageMeta";

const HELPFUL_LINKS = [
  { to: "/", icon: MdHome, label: "Home", description: "Return to the portal homepage" },
  {
    to: "/services",
    icon: MdReport,
    label: "Services",
    description: "Explore cyber crime reporting services",
  },
  {
    to: "/track-report",
    icon: MdSearch,
    label: "Track Complaint",
    description: "Check the status of an existing report",
  },
  {
    to: "/help",
    icon: MdSupportAgent,
    label: "Help Center",
    description: "Find answers and contact support",
  },
];

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="Page Not Found"
        description="The page you are looking for could not be found on the National Cyber Crime Reporting Portal."
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-[#0f172a] to-emerald-950 py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, #22c55e 0, transparent 45%), radial-gradient(circle at 75% 60%, #38bdf8 0, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-7xl font-extrabold tracking-tight text-transparent md:text-8xl"
          >
            404
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-2xl font-bold text-white md:text-3xl"
          >
            Page Not Found
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300"
          >
            The page you are looking for may have been moved, removed, or never
            existed. Please use the links below to continue.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-auto"
            >
              <MdHome className="h-5 w-5" aria-hidden />
              Back to Home
            </Link>
            <Link
              to="/contact"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-auto"
            >
              <MdSupportAgent className="h-5 w-5" aria-hidden />
              Contact Support
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-lg font-bold text-navy-900 dark:text-white">
          Popular Destinations
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HELPFUL_LINKS.map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={link.to}
                className="group flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:border-navy-700 dark:bg-navy-800"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-navy-700">
                  <link.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold text-navy-900 dark:text-white">
                  {link.label}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {link.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
