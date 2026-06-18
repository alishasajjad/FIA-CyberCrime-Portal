import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MdEmail, MdPhone, MdLocationOn, MdSend } from "react-icons/md";
import SectionHeading from "components/public/SectionHeading";

export default function ContactSection() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <section
      className="bg-gradient-to-b from-white to-slate-100 py-20 dark:from-navy-900 dark:to-navy-800 md:py-28"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Contact"
          title="Get In Touch"
          subtitle="Reach our support team for portal assistance, general inquiries, or technical help."
        />
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            {[
              {
                icon: MdEmail,
                label: "Email",
                value: "support@fia.gov.pk",
                href: "mailto:support@fia.gov.pk",
              },
              {
                icon: MdPhone,
                label: "Phone",
                value: "+92 51 9106384 / 1991 (Helpline)",
                href: "tel:1991",
              },
              {
                icon: MdLocationOn,
                label: "Address",
                value:
                  "FIA Cyber Crime Wing Headquarters, FIA Headquarters, G-9/4, Islamabad, Pakistan",
                href: null,
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-4 rounded-xl border border-gray-200/80 bg-white p-5 dark:border-navy-700 dark:bg-navy-800"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-navy-700">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-1 text-sm font-medium text-navy-900 hover:text-brand-600 dark:text-white"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-navy-900 dark:text-white">
                      {item.value}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            <Link
              to="/contact"
              className="inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Full contact page →
            </Link>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-800 lg:col-span-3 md:p-8"
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <MdSend className="h-8 w-8" />
                </span>
                <h3 className="mt-4 text-xl font-bold text-navy-900 dark:text-white">
                  Message Sent
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Thank you for contacting us. Our team will respond within 2–3
                  business days.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      required
                      type="text"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-600 dark:bg-navy-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-600 dark:bg-navy-900"
                    />
                  </div>
                </div>
                <div className="mt-5">
                  <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium">
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    required
                    type="text"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-600 dark:bg-navy-900"
                  />
                </div>
                <div className="mt-5">
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-600 dark:bg-navy-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
                >
                  {loading ? (
                    <span className="public-skeleton inline-block h-5 w-20 rounded" />
                  ) : (
                    <>
                      <MdSend className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
}
