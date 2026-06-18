/*eslint-disable*/
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-4 px-1 pb-8 pt-3 text-center lg:px-8 xl:flex-row xl:text-left">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        © {new Date().getFullYear()} FIA Cyber Crime Wing, Government of Pakistan
        &middot; Secure Operations Console.
      </p>

      <nav aria-label="Console footer">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:flex-nowrap md:gap-x-10">
          <li>
            <a
              href="mailto:support@fia.gov.pk"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-brand-700 focus:outline-none focus:underline dark:text-gray-300 dark:hover:text-brand-400"
            >
              Support
            </a>
          </li>
          <li>
            <Link
              to="/privacy-policy"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-brand-700 focus:outline-none focus:underline dark:text-gray-300 dark:hover:text-brand-400"
            >
              Privacy
            </Link>
          </li>
          <li>
            <Link
              to="/terms"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-brand-700 focus:outline-none focus:underline dark:text-gray-300 dark:hover:text-brand-400"
            >
              Terms
            </Link>
          </li>
          <li>
            <Link
              to="/security-guidelines"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-brand-700 focus:outline-none focus:underline dark:text-gray-300 dark:hover:text-brand-400"
            >
              Security
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
};

export default Footer;
