import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdPhishing,
  MdGroups,
  MdMoneyOff,
  MdFingerprint,
  MdTipsAndUpdates,
} from "react-icons/md";
import SectionHeading from "components/public/SectionHeading";

const TOPICS = [
  {
    icon: MdPhishing,
    title: "Phishing Awareness",
    description:
      "Recognize fraudulent emails, SMS, and websites designed to steal your credentials.",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: MdGroups,
    title: "Social Media Safety",
    description:
      "Protect your privacy, manage account security, and avoid online impersonation.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: MdMoneyOff,
    title: "Online Fraud Prevention",
    description:
      "Identify JazzCash, Easypaisa, and mobile banking scams, investment fraud, and fake e-commerce platforms before you lose money.",
    color: "from-amber-500 to-yellow-500",
  },
  {
    icon: MdFingerprint,
    title: "Identity Theft Protection",
    description:
      "Safeguard your CNIC, passport, and personal documents from unauthorized misuse.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: MdTipsAndUpdates,
    title: "Digital Security Tips",
    description:
      "Use strong passwords, enable 2FA, and keep devices updated against emerging threats.",
    color: "from-emerald-500 to-teal-500",
  },
];

export default function AwarenessSection() {
  return (
    <section
      className="bg-gradient-to-b from-slate-100 to-white py-20 dark:from-navy-800 dark:to-navy-900 md:py-28"
      aria-labelledby="awareness-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="awareness-heading"
          eyebrow="Cyber Awareness"
          title="Stay Informed. Stay Protected."
          subtitle="Learn how to defend yourself against the most common cyber threats affecting citizens today."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TOPICS.map((topic, i) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-navy-800"
            >
              <div className={`h-1.5 bg-gradient-to-r ${topic.color}`} />
              <div className="p-5">
                <topic.icon
                  className="h-8 w-8 text-brand-600 dark:text-brand-400"
                  aria-hidden
                />
                <h3 className="mt-3 font-bold text-navy-900 dark:text-white">
                  {topic.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {topic.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/cyber-awareness"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-600 px-6 py-3 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-navy-800"
          >
            Explore Cyber Awareness
          </Link>
        </div>
      </div>
    </section>
  );
}
