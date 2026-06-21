import React from "react";
import { motion } from "framer-motion";
import {
  MdEditDocument,
  MdVerified,
  MdPersonSearch,
  MdSearch,
  MdCheckCircle,
} from "react-icons/md";
import SectionHeading from "components/public/SectionHeading";

const STEPS = [
  {
    icon: MdEditDocument,
    title: "Submit Complaint",
    description: "Register and file your cyber crime report with incident details.",
  },
  {
    icon: MdVerified,
    title: "Evidence Verification",
    description: "Submitted evidence is reviewed and validated by the system.",
  },
  {
    icon: MdPersonSearch,
    title: "Officer Assignment",
    description: "A qualified investigation officer is assigned to your case.",
  },
  {
    icon: MdSearch,
    title: "Investigation",
    description: "Officers investigate, coordinate, and update case progress.",
  },
  {
    icon: MdCheckCircle,
    title: "Resolution",
    description: "Case is resolved with documented outcomes and notifications.",
  },
];

export default function WorkflowSection() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="workflow-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="workflow-heading"
          eyebrow="How It Works"
          title="Complaint Workflow"
          subtitle="A transparent, step-by-step process from report submission to case resolution."
        />
        <div className="relative">
          <div
            className="absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 lg:block"
            aria-hidden
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
                  <step.icon className="h-8 w-8" aria-hidden />
                </div>
                <span className="mt-4 inline-block rounded-full bg-brand-50 px-3 py-0.5 text-xs font-bold text-brand-700 dark:bg-navy-800 dark:text-brand-400">
                  Step {i + 1}
                </span>
                <h3 className="mt-2 font-bold text-navy-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
                {i < STEPS.length - 1 && (
                  <span
                    className="mx-auto mt-4 block text-2xl text-brand-400 lg:hidden"
                    aria-hidden
                  >
                    ↓
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
