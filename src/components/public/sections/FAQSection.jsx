import React from "react";
import { Link } from "react-router-dom";
import Accordion from "components/public/Accordion";
import SectionHeading from "components/public/SectionHeading";

const FAQ_ITEMS = [
  {
    question: "How do I report a cyber crime on this portal?",
    answer:
      "Create an account, sign in, and navigate to Report Crime. Fill in incident details, upload supporting evidence, and submit. You will receive a complaint reference number for tracking.",
  },
  {
    question: "Is my complaint confidential?",
    answer:
      "Yes. All complaints are handled with strict confidentiality. Only authorized investigation officers and administrators can access your case details.",
  },
  {
    question: "How long does investigation take?",
    answer:
      "Investigation timelines vary based on case complexity. You can track real-time status updates through your dashboard and receive notifications at each stage.",
  },
  {
    question: "What types of cyber crimes can I report?",
    answer:
      "You can report online fraud, phishing, identity theft, cyber stalking, ransomware, social media crimes, financial fraud, and other digital offenses.",
  },
  {
    question: "What is the 1991 cyber helpline?",
    answer:
      "1991 is the national FIA cyber crime helpline available 24/7 in Pakistan for immediate assistance. Call before or after filing a complaint on this portal for urgent cyber crime incidents.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          subtitle="Quick answers to common questions about reporting and tracking cyber crimes."
        />
        <Accordion items={FAQ_ITEMS} />
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Need more help?{" "}
          <Link
            to="/faq"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            View all FAQs
          </Link>{" "}
          or visit our{" "}
          <Link
            to="/help"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Help Center
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export { FAQ_ITEMS };
