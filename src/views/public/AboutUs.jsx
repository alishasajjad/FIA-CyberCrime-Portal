import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import {
  MdVerified,
  MdGroups,
  MdSecurity,
  MdTimeline,
} from "react-icons/md";

const VALUES = [
  {
    icon: MdSecurity,
    title: "Security First",
    description:
      "Every complaint and piece of evidence is protected with enterprise-grade encryption and role-based access controls.",
  },
  {
    icon: MdVerified,
    title: "Transparency",
    description:
      "Citizens receive real-time status updates and clear communication throughout the investigation lifecycle.",
  },
  {
    icon: MdGroups,
    title: "Citizen-Centric",
    description:
      "Designed for accessibility across all devices, languages, and digital literacy levels nationwide.",
  },
  {
    icon: MdTimeline,
    title: "Efficiency",
    description:
      "Streamlined workflows connect citizens with qualified cyber crime investigation officers without delay.",
  },
];

export default function AboutUs() {
  return (
    <>
      <PageMeta
        title="About Us"
        description="Learn about the National Cyber Crime Reporting Portal — our mission, vision, and commitment to digital safety."
      />
      <PageHeader
        title="About Us"
        subtitle="Empowering citizens to report cyber crimes and access trusted investigation support through a secure government platform."
        breadcrumbs={[{ label: "About Us" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white">
              Our Mission
            </h2>
            <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">
              The National Cyber Crime Reporting Portal was established to provide
              a unified, secure platform for citizens to report digital crimes,
              upload evidence, and track investigations. We bridge the gap between
              victims and law enforcement through technology-driven workflows.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">
              Our platform supports the Government of Pakistan&apos;s commitment to
              building a safer digital ecosystem by enabling timely reporting,
              officer assignment, and resolution of cyber incidents across the
              nation.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-br from-navy-900 to-emerald-950 p-8 text-white"
          >
            <h2 className="text-2xl font-bold">Our Vision</h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              To become the most trusted digital gateway for cyber crime reporting
              in Pakistan — where every citizen feels empowered to seek justice and
              every investigation is conducted with integrity, speed, and
              accountability.
            </p>
            <Link
              to="/auth/register"
              className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold transition-colors hover:bg-brand-400"
            >
              Register & Report
            </Link>
          </motion.div>
        </div>

        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold text-navy-900 dark:text-white">
            Our Core Values
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-navy-700 dark:bg-navy-800"
              >
                <value.icon
                  className="h-8 w-8 text-brand-600 dark:text-brand-400"
                  aria-hidden
                />
                <h3 className="mt-4 font-bold text-navy-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
