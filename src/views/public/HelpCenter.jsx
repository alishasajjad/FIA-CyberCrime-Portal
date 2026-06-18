import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import {
  MdReport,
  MdTrackChanges,
  MdCloudUpload,
  MdLogin,
  MdHelp,
  MdPhone,
} from "react-icons/md";

const GUIDES = [
  {
    icon: MdLogin,
    title: "Creating an Account",
    steps: [
      "Click Sign Up in the navigation bar",
      "Fill in your name, email, and password",
      "Verify your credentials and sign in",
      "Access your dashboard based on your role",
    ],
  },
  {
    icon: MdReport,
    title: "Filing a Complaint",
    steps: [
      "Sign in and navigate to Report Crime",
      "Select the type of cyber crime",
      "Provide incident details and date",
      "Upload supporting evidence",
      "Submit and save your reference number",
    ],
  },
  {
    icon: MdTrackChanges,
    title: "Tracking Your Case",
    steps: [
      "Sign in to your dashboard",
      "Open Track Complaint",
      "View status, officer notes, and timeline",
      "Receive notifications on status changes",
    ],
  },
  {
    icon: MdCloudUpload,
    title: "Uploading Evidence",
    steps: [
      "Go to Evidence section in dashboard",
      "Select your complaint reference",
      "Upload files (images, PDFs, documents)",
      "Add descriptions for each file",
    ],
  },
];

export default function HelpCenter() {
  return (
    <>
      <PageMeta
        title="Help Center"
        description="Step-by-step guides for account creation, complaint filing, evidence upload, and case tracking on the cyber crime portal."
      />
      <PageHeader
        title="Help Center"
        subtitle="Step-by-step guides to help you navigate the portal and get the support you need."
        breadcrumbs={[{ label: "Help Center" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-center text-white md:flex-row md:text-left">
          <MdHelp className="mx-auto h-16 w-16 shrink-0 md:mx-0" aria-hidden />
          <div className="md:ml-8">
            <h2 className="text-xl font-bold">Need Immediate Assistance?</h2>
            <p className="mt-2 text-brand-100">
              Call the 24/7 FIA Cyber Helpline for urgent support.
            </p>
            <a
              href="tel:1991"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-brand-700"
            >
              <MdPhone className="h-5 w-5" />
              Call 1991
            </a>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {GUIDES.map((guide, i) => (
            <motion.div
              key={guide.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-navy-700 dark:bg-navy-800"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-navy-700">
                  <guide.icon className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-navy-900 dark:text-white">
                  {guide.title}
                </h3>
              </div>
              <ol className="mt-4 space-y-2">
                {guide.steps.map((step, j) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-navy-700 dark:text-brand-400">
                      {j + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Still have questions?{" "}
            <Link to="/faq" className="font-semibold text-brand-600 hover:underline">
              Browse FAQs
            </Link>{" "}
            or{" "}
            <Link to="/contact" className="font-semibold text-brand-600 hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
