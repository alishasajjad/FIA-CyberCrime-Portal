import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import { motion } from "framer-motion";
import { MdLock, MdOutlinePolicy, MdRemoveRedEye, MdOutlineSecurity } from "react-icons/md";

const PROTOCOLS = [
  {
    icon: MdOutlineSecurity,
    title: "Enterprise-grade Encryption",
    description: "Every file, case description, message, and personal document is encrypted in transit using SSL/TLS and stored on secure government cloud infrastructure.",
  },
  {
    icon: MdRemoveRedEye,
    title: "Role-Based Access Control (RBAC)",
    description: "Access to incident logs is strictly audited and limited. Only the assigned investigation officer, legal desk, and system administrator can view your report.",
  },
  {
    icon: MdOutlinePolicy,
    title: "Citizen Witness Shield",
    description: "Under PECA 2016 regulations, complainants have the right to requests for witness identity concealment during investigation to protect against retaliation.",
  },
  {
    icon: MdLock,
    title: "Immutable Activity Audits",
    description: "Every access request, status change, and message dispatch is recorded in an immutable ledger log file to ensure internal accountability.",
  },
];

export default function DataPrivacy() {
  return (
    <>
      <PageMeta
        title="Data Privacy & Security"
        description="Learn about portal encryption, citizen rights, role-based controls, and how your complaint data is protected."
      />
      <PageHeader
        title="Data Privacy & Security"
        subtitle="Learn how we shield your information and evidence files using secure government policies and cryptographic standards."
        breadcrumbs={[{ label: "Data Privacy" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 md:p-8 dark:border-navy-700 dark:bg-navy-800 shadow-sm mb-12">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4">
            Complainant Confidentiality Commitment
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            The Federal Investigation Agency (FIA) Cyber Crime Wing takes citizen privacy as an absolute priority. 
            All reports submitted via this portal are strictly confidential and governed by the Cyber Security policies of the 
            Government of Pakistan. No database records are disclosed to third-party entities, advertisers, or foreign agencies.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {PROTOCOLS.map((protocol, i) => (
            <motion.div
              key={protocol.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-navy-700 dark:bg-navy-800 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-navy-700 dark:text-brand-400">
                <protocol.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-extrabold text-navy-900 dark:text-white text-base">
                  {protocol.title}
                </h3>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {protocol.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
