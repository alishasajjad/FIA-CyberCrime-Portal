import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";

const SECTIONS = [
  {
    title: "What Are Cookies?",
    content:
      "Cookies are small text files stored on your device when you visit a website. They help the portal remember your preferences, maintain secure sessions, and improve your experience.",
  },
  {
    title: "Cookies We Use",
    content:
      "Essential cookies: Required for authentication, session management, and security. These cannot be disabled while using authenticated features. Analytics cookies: Help us understand how visitors use the portal to improve services. Preference cookies: Store your cookie consent choice and display preferences.",
  },
  {
    title: "Managing Cookies",
    content:
      "When you first visit the portal, you can accept or reject non-essential cookies via our cookie consent banner. Your choice is saved in localStorage and the banner will not appear again. You can also manage cookies through your browser settings, though disabling essential cookies may affect portal functionality.",
  },
  {
    title: "Third-Party Cookies",
    content:
      "We do not use third-party advertising cookies. Any analytics tools used comply with government data protection standards.",
  },
  {
    title: "Updates to This Policy",
    content:
      "We may update this Cookie Policy periodically. Changes will be posted on this page with an updated revision date.",
  },
  {
    title: "Contact",
    content:
      "For questions about our use of cookies, contact support@fia.gov.pk.",
  },
];

export default function CookiePolicy() {
  return (
    <>
      <PageMeta
        title="Cookie Policy"
        description="Cookie policy for the National Cyber Crime Reporting Portal — what cookies we use and how to manage them."
      />
      <PageHeader
        title="Cookie Policy"
        subtitle="Last updated: June 2026"
        breadcrumbs={[{ label: "Cookie Policy" }]}
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
