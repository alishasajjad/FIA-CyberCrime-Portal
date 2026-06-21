import React from "react";
import { motion } from "framer-motion";
import { MdFormatQuote } from "react-icons/md";
import SectionHeading from "components/public/SectionHeading";

const TESTIMONIALS = [
  {
    name: "Ayesha Khan",
    role: "Small Business Owner, Lahore",
    quote:
      "I reported a JazzCash fraud within minutes. The officer assigned to my case kept me updated throughout the investigation. The portal is professional and easy to use.",
    rating: 5,
  },
  {
    name: "Bilal Ahmed",
    role: "IT Professional, Karachi",
    quote:
      "The evidence upload feature made it simple to submit screenshots and transaction records. My complaint was tracked transparently from submission to resolution.",
    rating: 5,
  },
  {
    name: "Fatima Malik",
    role: "Retired Teacher, Islamabad",
    quote:
      "After falling victim to a phishing scam, this portal gave me a clear path forward. The cyber awareness section helped my family avoid similar incidents.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section
      className="bg-white py-20 dark:bg-navy-900 md:py-28"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="testimonials-heading"
          eyebrow="Testimonials"
          title="Trusted by Citizens Nationwide"
          subtitle="Real experiences from citizens who used the portal to report and resolve cyber crimes."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <motion.blockquote
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-gray-200/80 bg-slate-50 p-6 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-navy-700 dark:bg-navy-800"
            >
              <MdFormatQuote
                className="absolute right-4 top-4 h-10 w-10 text-brand-200 dark:text-navy-700"
                aria-hidden
              />
              <div className="mb-3 flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                {Array.from({ length: item.rating }).map((_, j) => (
                  <span key={j} className="text-amber-400">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-5 border-t border-gray-200 pt-4 dark:border-navy-700">
                <cite className="not-italic">
                  <p className="font-bold text-navy-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </cite>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
