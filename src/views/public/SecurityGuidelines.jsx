import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import { motion } from "framer-motion";
import { MdOutlineShield, MdPassword, MdPhishing, MdShoppingCart, MdPhoneAndroid } from "react-icons/md";

const SAFETY_CARDS = [
  {
    icon: MdPassword,
    title: "Password & Account Integrity",
    tips: [
      "Use unique passwords (mix of uppercase, lowercase, numbers, symbols) for each online service.",
      "Enable Two-Factor Authentication (2FA) on WhatsApp, Gmail, Facebook, and banking apps.",
      "Never write down passwords or save them in plaintext in notepad or emails.",
      "Change important passwords every 90 days to prevent credentials compromise.",
    ],
  },
  {
    icon: MdPhishing,
    title: "Anti-Phishing Shielding",
    tips: [
      "Do not click links inside unsolicited emails or SMS messages asking to update KYC details.",
      "Verify domains carefully (e.g. check for fia.gov.pk vs fia-complain.tk).",
      "Do not download attachments from unknown senders (e.g. invoice.exe or prize.scr).",
      "Official agencies in Pakistan never request passwords or pin codes over email.",
    ],
  },
  {
    icon: MdShoppingCart,
    title: "Safe Online Shopping",
    tips: [
      "Verify the merchant's physical address, refund policy, and customer reviews before buying.",
      "Prefer Cash on Delivery (COD) for unknown or newly established online stores.",
      "Never transfer payments to personal Easypaisa, JazzCash, or bank accounts directly.",
      "Look for the HTTPS padlock indicator in the address bar before entering payment card details.",
    ],
  },
  {
    icon: MdPhoneAndroid,
    title: "Mobile Device Hardening",
    tips: [
      "Keep your smartphone OS and installed applications updated to patch known vulnerabilities.",
      "Do not install apps from third-party websites or unknown sources outside the official Google Play / Apple App Store.",
      "Avoid connecting to public or unencrypted Wi-Fi networks when accessing mobile banking.",
      "Check application permissions carefully: deny location or contacts access for basic utility apps.",
    ],
  },
];

export default function SecurityGuidelines() {
  return (
    <>
      <PageMeta
        title="Security Guidelines"
        description="Learn best practices to prevent phishing, protect your bank accounts, secure credentials, and maintain privacy online."
      />
      <PageHeader
        title="Security Guidelines"
        subtitle="Empower yourself with security best practices to protect your identity, data, and money online."
        breadcrumbs={[{ label: "Security Guidelines" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-navy-900 to-emerald-950 p-6 md:p-8 text-white mb-12 shadow-md">
          <div className="flex gap-4 items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <MdOutlineShield className="h-6 w-6 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Cyber Security Threat Awareness</h2>
              <p className="mt-1 text-sm text-slate-350 leading-relaxed">
                Most digital incidents start with human interaction, such as clicking a malicious link or disclosing 
                one-time passwords (OTPs). Following simple safety guidelines can reduce your exposure by up to 95%.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {SAFETY_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-navy-700 dark:bg-navy-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-navy-700 dark:text-brand-400">
                  <card.icon className="h-5 w-5" />
                </span>
                <h3 className="font-extrabold text-navy-900 dark:text-white leading-snug">
                  {card.title}
                </h3>
              </div>
              <ul className="mt-5 space-y-3">
                {card.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
