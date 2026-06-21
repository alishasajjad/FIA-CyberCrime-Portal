import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MdWarning, MdNewReleases, MdSecurity } from "react-icons/md";
import SectionHeading from "components/public/SectionHeading";

const ALERTS = [
  {
    icon: MdWarning,
    severity: "High",
    title: "Mobile Wallet OTP Scam Surge",
    date: "Jun 12, 2026",
    summary:
      "Fraudsters are impersonating JazzCash and Easypaisa officials via WhatsApp to request OTP or PIN verification. Never share your OTP or PIN with anyone.",
    tag: "Fraud Alert",
  },
  {
    icon: MdNewReleases,
    severity: "Medium",
    title: "Fake FBR Tax Refund Messages",
    date: "Jun 8, 2026",
    summary:
      "SMS and email campaigns claiming FBR tax refunds with malicious links are circulating. Verify only through official Government of Pakistan portals.",
    tag: "Phishing",
  },
  {
    icon: MdSecurity,
    severity: "Info",
    title: "Enable Two-Factor Authentication",
    date: "Jun 1, 2026",
    summary:
      "Citizens are advised to enable 2FA on email, banking, and social media accounts to prevent unauthorized access.",
    tag: "Advisory",
  },
];

const severityColors = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function AlertsSection() {
  return (
    <section
      className="bg-gradient-to-b from-slate-100 to-white py-20 dark:from-navy-800 dark:to-navy-900 md:py-28"
      aria-labelledby="alerts-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="alerts-heading"
          eyebrow="Cyber Alerts"
          title="Latest Cyber Safety Alerts"
          subtitle="Stay updated on emerging threats and official security advisories."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {ALERTS.map((alert, i) => (
            <motion.article
              key={alert.title}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-navy-700 dark:bg-navy-800"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-navy-700">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {alert.tag}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${severityColors[alert.severity]}`}
                >
                  {alert.severity}
                </span>
              </div>
              <div className="p-5">
                <alert.icon
                  className="h-7 w-7 text-brand-600 dark:text-brand-400"
                  aria-hidden
                />
                <h3 className="mt-3 font-bold text-navy-900 dark:text-white">
                  {alert.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500">{alert.date}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {alert.summary}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/cyber-awareness"
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            View all security advisories →
          </Link>
        </div>
      </div>
    </section>
  );
}
