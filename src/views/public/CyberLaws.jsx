import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import { motion } from "framer-motion";
import { MdGavel, MdSecurity, MdWarning, MdInfo } from "react-icons/md";

const LAWS = [
  {
    section: "Section 3",
    title: "Unauthorized Access to Information System or Data",
    description: "Hacking, gaining access to any computer network, system, or data without authorization.",
    penalty: "Up to 3 months imprisonment and/or fine up to PKR 50,000.",
    icon: MdSecurity,
    color: "from-blue-500/10 to-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/40",
  },
  {
    section: "Section 10",
    title: "Cyber Terrorism",
    description: "Accessing a critical infrastructure information system or data and threatening national security or causing public panic.",
    penalty: "Up to 14 years imprisonment and/or fine up to PKR 50 million.",
    icon: MdWarning,
    color: "from-red-500/10 to-red-600/10 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-900/40",
  },
  {
    section: "Section 13",
    title: "Electronic Forgery",
    description: "Creating, transmitting, or using forged electronic documents or signatures with intent to defraud.",
    penalty: "Up to 3 years imprisonment and/or fine up to PKR 250,000.",
    icon: MdGavel,
    color: "from-amber-500/10 to-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/40",
  },
  {
    section: "Section 14",
    title: "Electronic Fraud",
    description: "Using electronic communication, networks, or devices to gain wrongful gain or cause wrongful loss.",
    penalty: "Up to 3 years imprisonment and/or fine up to PKR 10 million.",
    icon: MdInfo,
    color: "from-emerald-500/10 to-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/40",
  },
  {
    section: "Section 20",
    title: "Offences Against Dignity of Natural Person",
    description: "Intentionally transmitting false information that intimidates, harms, or defames a person's reputation.",
    penalty: "Up to 3 years imprisonment and/or fine up to PKR 1 million.",
    icon: MdGavel,
    color: "from-purple-500/10 to-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-900/40",
  },
  {
    section: "Section 21",
    title: "Cyber Stalking / Harassment",
    description: "Stalking, tracking, or harassing any person online, especially with intent to coerce, intimidate, or blackmail.",
    penalty: "Up to 3 years imprisonment and/or fine up to PKR 1 million (increased penalties if the victim is a minor).",
    icon: MdSecurity,
    color: "from-teal-500/10 to-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-200/50 dark:border-teal-900/40",
  },
];

export default function CyberLaws() {
  return (
    <>
      <PageMeta
        title="Cyber Crime Laws (Pakistan)"
        description="Understand the Prevention of Electronic Crimes Act (PECA) 2016 cyber crime legislation, offences, and legal penalties in Pakistan."
      />
      <PageHeader
        title="Cyber Crime Laws (Pakistan)"
        subtitle="Prevention of Electronic Crimes Act (PECA) 2016 provides the comprehensive legal framework to combat cyber crimes in Pakistan."
        breadcrumbs={[{ label: "Cyber Laws" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-900/30 dark:bg-navy-800/80 mb-12">
          <div className="flex gap-4 items-start md:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <MdGavel className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                Prevention of Electronic Crimes Act (PECA), 2016
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                PECA was enacted by the Parliament of Pakistan to address electronic crimes and ensure data security.
                The{" "}
                <strong className="font-semibold text-navy-900 dark:text-white">
                  Federal Investigation Agency (FIA) Cyber Crime Wing
                </strong>{" "}
                is the sole designated federal agency responsible for registering complaints, investigating offences,
                and executing enforcement actions under this Act.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {LAWS.map((law, i) => (
            <motion.div
              key={law.section}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`flex flex-col rounded-2xl border bg-gradient-to-br ${law.color} p-6 h-full shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/60 dark:bg-navy-900/60 shadow-sm">
                  {law.section}
                </span>
                <law.icon className="h-5 w-5 opacity-80" />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-navy-900 dark:text-white leading-snug">
                {law.title}
              </h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-350 leading-relaxed flex-1">
                {law.description}
              </p>
              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Penalty / Fine
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {law.penalty}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-650 dark:text-gray-300 max-w-xl mx-auto">
            Dissemination of fake news, hacking of databases, online financial theft, and child sexual abuse materials 
            are strictly prosecuted. Always report these crimes timely with original digital evidence.
          </p>
        </div>
      </div>
    </>
  );
}
