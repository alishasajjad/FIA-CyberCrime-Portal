import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import { motion } from "framer-motion";
import { MdPhone, MdEmail, MdLocationOn, MdDirections } from "react-icons/md";

const REGIONAL_OFFICES = [
  {
    city: "Islamabad HQ",
    address: "FIA Cyber Crime Wing HQ, G-9/4, Islamabad",
    phone: "+92 51 9106384",
    email: "islamabad.ccw@fia.gov.pk",
  },
  {
    city: "Lahore Office",
    address: "FIA Cyber Crime Wing, 1-A, Temple Road, Lahore",
    phone: "+92 42 99205562",
    email: "lahore.ccw@fia.gov.pk",
  },
  {
    city: "Karachi Office",
    address: "FIA Cyber Crime Wing, block 24, Gulistan-e-Johar, Karachi",
    phone: "+92 21 99244643",
    email: "karachi.ccw@fia.gov.pk",
  },
  {
    city: "Peshawar Office",
    address: "FIA Cyber Crime Wing, Phase 5, Hayatabad, Peshawar",
    phone: "+92 91 9217482",
    email: "peshawar.ccw@fia.gov.pk",
  },
  {
    city: "Quetta Office",
    address: "FIA Cyber Crime Wing, Samungli Road, Quetta",
    phone: "+92 81 9202473",
    email: "quetta.ccw@fia.gov.pk",
  },
  {
    city: "Multan Office",
    address: "FIA Cyber Crime Wing, MDA Road, Multan",
    phone: "+92 61 9201083",
    email: "multan.ccw@fia.gov.pk",
  },
];

export default function EmergencyHelp() {
  return (
    <>
      <PageMeta
        title="Emergency Help & Hotlines"
        description="Access emergency cyber hotlines, FIA regional office phones, email contacts, and helplines across Pakistan."
      />
      <PageHeader
        title="Emergency Help & Hotlines"
        subtitle="Need urgent assistance? Contact the main FIA cyber wing or reach out to our regional investigation desks."
        breadcrumbs={[{ label: "Emergency Help" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main Hotline Highlight */}
        <div className="rounded-3xl border border-red-200 bg-red-50/20 p-6 md:p-10 dark:border-red-950/20 dark:bg-navy-950/40 mb-12 shadow-sm text-center md:text-left">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-650 text-white shadow-lg animate-bounce">
              <MdPhone className="h-8 w-8" />
            </span>
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-navy-900 dark:text-white">
                National FIA Cyber Helpline: 1991
              </h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-slate-300 leading-relaxed max-w-2xl">
                Call **1991** from any mobile network or landline across Pakistan. 
                This helpline is dedicated to addressing online emergency distress, financial fraud, stalking threats, 
                and blocking compromising material. Available 24 hours a day, 7 days a week.
              </p>
            </div>
            <a
              href="tel:1991"
              className="px-8 py-4 bg-red-650 text-white font-bold rounded-xl shadow-md shadow-red-500/20 hover:bg-red-700 transition"
            >
              Call 1991 Now
            </a>
          </div>
        </div>

        {/* Regional Offices */}
        <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-6">
          Regional FIA Cyber Crime Investigation Desks
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REGIONAL_OFFICES.map((office, i) => (
            <motion.div
              key={office.city}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-navy-700 dark:bg-navy-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <h4 className="font-extrabold text-navy-900 dark:text-white text-base">
                  {office.city}
                </h4>
                <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex gap-2">
                    <MdLocationOn className="h-5 w-5 shrink-0 text-brand-600 mt-0.5" />
                    <span>{office.address}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <MdPhone className="h-5 w-5 shrink-0 text-brand-600" />
                    <a href={`tel:${office.phone}`} className="hover:text-brand-650 hover:underline">{office.phone}</a>
                  </div>
                  <div className="flex gap-2 items-center">
                    <MdEmail className="h-5 w-5 shrink-0 text-brand-600" />
                    <a href={`mailto:${office.email}`} className="hover:text-brand-650 hover:underline">{office.email}</a>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex justify-end">
                <span className="text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer">
                  Get Directions <MdDirections />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
