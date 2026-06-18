import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import Accordion from "components/public/Accordion";
import { FAQ_ITEMS } from "components/public/sections/FAQSection";

const MORE_FAQ = [
  {
    question: "Can I report a crime anonymously?",
    answer:
      "You must create an account to file a complaint so officers can contact you for follow-up. Your identity is protected and only shared with authorized personnel.",
  },
  {
    question: "What evidence should I upload?",
    answer:
      "Upload screenshots, chat logs, transaction receipts, email headers, URLs, phone numbers, and any documents related to the incident. Supported formats include images, PDFs, and text files.",
  },
  {
    question: "How do I track my complaint status?",
    answer:
      "After logging in, go to Track Complaint in your dashboard. You will see status updates, assigned officer details, and investigation notes.",
  },
  {
    question: "Who can access my complaint data?",
    answer:
      "Only you, assigned investigation officers, and authorized administrators can access your complaint. All access is logged for audit purposes.",
  },
  {
    question: "What if I need urgent help?",
    answer:
      "For immediate assistance, call the national cyber helpline at 1991. You can also file a complaint on this portal for formal investigation.",
  },
];

export default function FAQ() {
  return (
    <>
      <PageMeta
        title="FAQ"
        description="Frequently asked questions about reporting cyber crimes, tracking complaints, evidence upload, and portal security."
      />
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about using the National Cyber Crime Reporting Portal."
        breadcrumbs={[{ label: "FAQ" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-lg font-bold text-navy-900 dark:text-white">
          General Questions
        </h2>
        <Accordion items={FAQ_ITEMS} />
        <h2 className="mb-6 mt-12 text-lg font-bold text-navy-900 dark:text-white">
          Reporting & Investigation
        </h2>
        <Accordion items={MORE_FAQ} />
      </div>
    </>
  );
}
