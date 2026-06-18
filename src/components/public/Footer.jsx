import React from "react";
import { Link } from "react-router-dom";
import {
  MdShield,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdFacebook,
  MdShare,
  MdPublic,
} from "react-icons/md";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/services", label: "Services" },
  { to: "/cyber-awareness", label: "Cyber Awareness" },
  { to: "/faq", label: "FAQ" },
  { to: "/help", label: "Help Center" },
];

const LEGAL_LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/cookie-policy", label: "Cookie Policy" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-slate-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <MdShield className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-white">Cyber Crime Portal</p>
                <p className="text-xs text-slate-400">Government of Pakistan</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              The National Cyber Crime Reporting Portal of Pakistan enables citizens to
              report cyber incidents, track investigations, and access verified
              cyber security awareness resources. Developed in coordination with the
              FIA Cyber Crime Wing.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { Icon: MdFacebook, label: "Facebook" },
                { Icon: MdShare, label: "Social media" },
                { Icon: MdPublic, label: "Website" },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  role="img"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-slate-400"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors hover:text-emerald-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/cyber-laws" className="text-sm transition-colors hover:text-emerald-300">
                  Cyber Crime Laws (PECA)
                </Link>
              </li>
              <li>
                <Link to="/track-report" className="text-sm transition-colors hover:text-emerald-300">
                  Report Tracking Page
                </Link>
              </li>
              <li>
                <Link to="/status-checker" className="text-sm transition-colors hover:text-emerald-300">
                  Complaint Status Checker
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors hover:text-emerald-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/security-guidelines" className="text-sm transition-colors hover:text-emerald-300">
                  Security Guidelines
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm transition-colors hover:text-emerald-300">
                  Awareness Blog
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm transition-colors hover:text-emerald-300">
                  Data Privacy & Security
                </Link>
              </li>
            </ul>
            <h3 className="mb-4 mt-8 text-sm font-bold uppercase tracking-wider text-white">
              Support
            </h3>
            <p className="text-sm">
              24/7 FIA Helpline:{" "}
              <a href="tel:1991" className="font-semibold text-emerald-300">
                1991
              </a>
            </p>
            <p className="mt-1 text-sm">
              Email:{" "}
              <a
                href="mailto:support@fia.gov.pk"
                className="text-emerald-300 hover:underline"
              >
                support@fia.gov.pk
              </a>
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Contact Wing
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MdLocationOn className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <span>
                  FIA Cyber Crime Wing Headquarters, FIA Headquarters, G-9/4,
                  Islamabad, Pakistan
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <MdPhone className="h-5 w-5 shrink-0 text-brand-400" />
                <a href="tel:+92519106384" className="hover:text-emerald-300">
                  +92 51 9106384
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MdEmail className="h-5 w-5 shrink-0 text-brand-400" />
                <a
                  href="mailto:complaints@fia.gov.pk"
                  className="hover:text-emerald-300"
                >
                  complaints@fia.gov.pk
                </a>
              </li>
              <li>
                <Link to="/hotline" className="inline-block text-xs font-semibold text-emerald-300 hover:underline">
                  View Regional Helplines & Desks
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-navy-800 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} National Cyber Crime Reporting
            Portal - Pakistan. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Official Portal of Federal Investigation Agency (FIA), Government of Pakistan.
          </p>
        </div>
      </div>
    </footer>
  );
}
