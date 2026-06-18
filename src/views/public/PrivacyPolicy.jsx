import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide when registering, filing complaints, uploading evidence, and communicating with support. This includes name, email, contact details, complaint data, and uploaded files. We also collect technical data such as IP address, browser type, and session information for security purposes.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "Your information is used to process complaints, assign investigation officers, provide status updates, improve portal services, and comply with legal obligations. We do not sell personal data to third parties.",
  },
  {
    title: "3. Data Security",
    content:
      "We implement industry-standard security measures including encryption in transit, role-based access controls, audit logging, and secure session management. Access to complaint data is restricted to authorized personnel only.",
  },
  {
    title: "4. Data Retention",
    content:
      "Complaint records and evidence are retained as required by law and investigation protocols. Account data is retained while your account is active and for a defined period thereafter as per government record-keeping policies.",
  },
  {
    title: "5. Your Rights",
    content:
      "You have the right to access your complaint data, request corrections to inaccurate information, and receive notifications about case status changes. Contact our support team for data-related requests.",
  },
  {
    title: "6. Third-Party Services",
    content:
      "The portal may use secure cloud infrastructure for hosting and storage. All third-party providers are bound by data protection agreements consistent with government standards.",
  },
  {
    title: "7. Contact",
    content:
      "For privacy-related inquiries, contact privacy@fia.gov.pk or write to the Data Protection Officer, Cyber Crime Wing Headquarters, FIA Headquarters, G-9/4, Islamabad, Pakistan.",
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <PageMeta
        title="Privacy Policy"
        description="Privacy policy for the National Cyber Crime Reporting Portal — how we collect, use, and protect your personal data."
      />
      <PageHeader
        title="Privacy Policy"
        subtitle="Last updated: June 2026"
        breadcrumbs={[{ label: "Privacy Policy" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-300">
          This Privacy Policy describes how the National Cyber Crime Reporting
          Portal collects, uses, and safeguards your personal information.
        </p>
        {SECTIONS.map((section) => (
          <section key={section.title} className="mb-8">
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              {section.title}
            </h2>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
