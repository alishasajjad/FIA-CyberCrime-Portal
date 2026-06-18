/*eslint-disable*/
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="z-[5] mx-auto mt-8 w-full max-w-full px-4 pb-6">
      <div className="flex w-full flex-col items-center justify-between gap-4 border-t border-gray-200/70 pt-5 dark:border-white/10 sm:flex-row text-center sm:text-left">
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            © {new Date().getFullYear()} Cyber Crime Reporting System
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Securely report and track cyber crimes online. Official Portal.
          </p>
        </div>

        <nav aria-label="Footer" className="mt-2 sm:mt-0">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <li>
              <Link
                to="/privacy-policy"
                className="text-sm font-semibold text-gray-650 hover:text-green-700 dark:text-gray-300 dark:hover:text-green-300 focus:outline-none focus:underline"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="text-sm font-semibold text-gray-650 hover:text-green-700 dark:text-gray-300 dark:hover:text-green-300 focus:outline-none focus:underline"
              >
                Terms
              </Link>
            </li>
            <li>
              <Link
                to="/blog"
                className="text-sm font-semibold text-gray-650 hover:text-green-700 dark:text-gray-300 dark:hover:text-green-300 focus:outline-none focus:underline"
              >
                Blog
              </Link>
            </li>
            <li>
              <a
                href="mailto:support@fia.gov.pk"
                className="text-sm font-semibold text-gray-650 hover:text-green-700 dark:text-gray-300 dark:hover:text-green-300 focus:outline-none focus:underline"
              >
                Support
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
