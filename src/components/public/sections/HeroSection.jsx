import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdSecurity,
  MdReport,
  MdLogin,
  MdSearch,
  MdArrowForward,
} from "react-icons/md";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-gradient-to-br from-navy-900 via-[#0a1628] to-emerald-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, #22c55e 0, transparent 50%), radial-gradient(circle at 80% 20%, #0ea5e9 0, transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:flex-row lg:gap-12 lg:px-8 lg:py-28 lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-1"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <MdSecurity className="h-4 w-4" aria-hidden />
            FIA Cyber Crime Wing &middot; Government of Pakistan
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Report Cyber Crime.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Protect Your Digital Life.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 lg:mx-0 md:text-lg">
            Secure, confidential reporting for cyber fraud, identity theft,
            online harassment, and digital crimes. Track your complaint in
            real-time with assigned investigation officers.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <Link
              to="/auth/register"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-navy-900 sm:w-auto"
            >
              <MdReport className="h-5 w-5" aria-hidden />
              Report a Crime
              <MdArrowForward className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/auth/sign-in"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-auto"
            >
              <MdLogin className="h-5 w-5" aria-hidden />
              Login
            </Link>
            <Link
              to="/track-report"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 px-8 py-4 text-base font-semibold text-emerald-200 transition-all hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-auto"
            >
              <MdSearch className="h-5 w-5" aria-hidden />
              Track Complaint
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mt-16 flex-1 lg:mt-0"
        >
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Secure Reporting", icon: "🔒" },
                  { label: "Real-time Tracking", icon: "📊" },
                  { label: "Evidence Upload", icon: "📁" },
                  { label: "Officer Support", icon: "👮" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-navy-900/50 p-4 text-center"
                  >
                    <span className="text-2xl" role="img" aria-hidden>
                      {item.icon}
                    </span>
                    <p className="mt-2 text-xs font-medium text-slate-300">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-gradient-to-r from-brand-600/20 to-cyan-600/20 p-4">
                <p className="text-sm font-semibold text-emerald-300">
                  24/7 FIA Cyber Helpline
                </p>
                <p className="mt-1 text-2xl font-bold text-white">1991</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
