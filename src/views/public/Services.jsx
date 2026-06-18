import React from "react";
import { Link } from "react-router-dom";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import ServicesSection from "components/public/sections/ServicesSection";
import WorkflowSection from "components/public/sections/WorkflowSection";

export default function Services() {
  return (
    <>
      <PageMeta
        title="Services"
        description="Explore cyber crime reporting, complaint tracking, evidence upload, investigation support, and security awareness services."
      />
      <PageHeader
        title="Our Services"
        subtitle="Comprehensive digital services designed to support citizens from incident reporting through case resolution."
        breadcrumbs={[{ label: "Services" }]}
      />
      <ServicesSection />
      <WorkflowSection />
      <div className="bg-brand-50 py-16 dark:bg-navy-800">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white">
            Ready to Report a Cyber Crime?
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Create your account and submit a complaint in minutes. Our officers
            are standing by to assist.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth/register"
              className="rounded-lg bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Report Crime Now
            </Link>
            <Link
              to="/help"
              className="rounded-lg border border-brand-600 px-8 py-3 text-sm font-semibold text-brand-700 dark:text-brand-400"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
