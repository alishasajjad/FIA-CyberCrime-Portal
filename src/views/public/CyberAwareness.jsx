import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import AwarenessSection from "components/public/sections/AwarenessSection";
import AlertsSection from "components/public/sections/AlertsSection";

const GUIDES = [
  {
    title: "Recognizing Phishing Attacks",
    points: [
      "Check sender email addresses carefully for misspellings",
      "Never click suspicious links in unsolicited messages",
      "Verify requests for credentials through official channels",
      "Report phishing attempts via this portal immediately",
    ],
  },
  {
    title: "Protecting Your Financial Accounts",
    points: [
      "Enable transaction alerts on all bank accounts",
      "Use mobile wallets (JazzCash, Easypaisa, HBL) with biometric authentication",
      "Never share OTP with anyone claiming to be bank staff",
      "Verify merchant account numbers before making payments",
    ],
  },
  {
    title: "Social Media Best Practices",
    points: [
      "Review privacy settings on all platforms regularly",
      "Avoid sharing location data in real time",
      "Report impersonation accounts to the platform and portal",
      "Use unique passwords for each social account",
    ],
  },
];

export default function CyberAwareness() {
  return (
    <>
      <PageMeta
        title="Cyber Awareness"
        description="Learn about phishing, online fraud, identity theft, social media safety, and digital security best practices."
      />
      <PageHeader
        title="Cyber Awareness"
        subtitle="Educational resources to help you identify threats, protect your data, and stay safe online."
        breadcrumbs={[{ label: "Cyber Awareness" }]}
      />
      <AwarenessSection />
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy-900 dark:text-white">
            Detailed Safety Guides
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {GUIDES.map((guide, i) => (
              <motion.div
                key={guide.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-navy-700 dark:bg-navy-800"
              >
                <h3 className="font-bold text-navy-900 dark:text-white">
                  {guide.title}
                </h3>
                <ul className="mt-4 space-y-2">
                  {guide.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <AlertsSection />
      <div className="py-12 text-center">
        <Link
          to="/auth/register"
          className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Report a cyber incident →
        </Link>
      </div>
    </>
  );
}
