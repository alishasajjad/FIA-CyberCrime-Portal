import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using the National Cyber Crime Reporting Portal, you agree to comply with these Terms and Conditions. If you do not agree, please do not use this portal.",
  },
  {
    title: "2. Eligibility",
    content:
      "Users must be at least 18 years of age or have parental/guardian consent to register. You must provide accurate registration information and maintain the confidentiality of your account credentials.",
  },
  {
    title: "3. Acceptable Use",
    content:
      "You agree to use the portal only for legitimate cyber crime reporting purposes. Filing false complaints, uploading malicious content, attempting unauthorized access, or interfering with portal operations is strictly prohibited and may result in legal action.",
  },
  {
    title: "4. Complaint Submission",
    content:
      "All submitted complaints must be truthful and supported by available evidence. The portal reserves the right to reject or close complaints that are frivolous, duplicate, or lack sufficient information.",
  },
  {
    title: "5. Intellectual Property",
    content:
      "All portal content, design, logos, and software are the property of the Federal Investigation Agency (FIA), Government of Pakistan. Unauthorized reproduction or distribution is prohibited.",
  },
  {
    title: "6. Limitation of Liability",
    content:
      "While we strive for accurate and timely processing, the portal is provided on an 'as is' basis. We are not liable for delays caused by incomplete submissions, technical issues beyond our control, or third-party actions.",
  },
  {
    title: "7. Modifications",
    content:
      "We may update these terms at any time. Continued use of the portal after changes constitutes acceptance of the revised terms.",
  },
  {
    title: "8. Governing Law",
    content:
      "These terms are governed by the laws of the Islamic Republic of Pakistan, including the Prevention of Electronic Crimes Act (PECA), 2016. Disputes shall be subject to the jurisdiction of courts in Islamabad.",
  },
];

export default function TermsConditions() {
  return (
    <>
      <PageMeta
        title="Terms & Conditions"
        description="Terms and conditions for using the National Cyber Crime Reporting Portal."
      />
      <PageHeader
        title="Terms & Conditions"
        subtitle="Last updated: June 2026"
        breadcrumbs={[{ label: "Terms & Conditions" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
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
