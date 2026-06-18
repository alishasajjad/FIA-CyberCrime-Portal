import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdReport,
  MdTrackChanges,
  MdCloudUpload,
  MdGavel,
  MdPersonSearch,
  MdSchool,
} from "react-icons/md";
import SectionHeading from "components/public/SectionHeading";

const SERVICES = [
  {
    icon: MdReport,
    title: "Cyber Crime Reporting",
    description:
      "File detailed cyber crime complaints with secure digital submission and instant acknowledgment.",
  },
  {
    icon: MdTrackChanges,
    title: "Complaint Tracking",
    description:
      "Monitor your case status, officer updates, and investigation milestones in real time.",
  },
  {
    icon: MdCloudUpload,
    title: "Evidence Upload",
    description:
      "Submit screenshots, documents, and digital evidence securely to support your case.",
  },
  {
    icon: MdGavel,
    title: "Investigation Support",
    description:
      "Dedicated investigation officers review, verify, and pursue cases through resolution.",
  },
  {
    icon: MdPersonSearch,
    title: "Officer Assignment",
    description:
      "Qualified cyber crime officers are assigned based on case type and jurisdiction.",
  },
  {
    icon: MdSchool,
    title: "Security Awareness",
    description:
      "Access verified guides on phishing, fraud prevention, and digital safety best practices.",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="services-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Services"
          title="Comprehensive Cyber Crime Services"
          subtitle="End-to-end support for citizens, from reporting incidents to resolution and prevention."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:border-navy-700 dark:bg-navy-800"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-navy-700">
                <service.icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-bold text-navy-900 dark:text-white">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {service.description}
              </p>
            </motion.article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700"
          >
            View All Services
          </Link>
        </div>
      </div>
    </section>
  );
}
