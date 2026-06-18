import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdMenu,
  MdClose,
  MdShield,
  MdLogin,
  MdPersonAdd,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { getAuthRole, defaultRouteForRole } from "utils/auth";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About Us" },
  { to: "/services", label: "Services" },
  { to: "/track-report", label: "Track Complaint" },
];

const RESOURCE_LINKS = [
  { to: "/cyber-laws", label: "Cyber Crime Laws" },
  { to: "/security-guidelines", label: "Security Guidelines" },
  { to: "/blog", label: "Awareness Blog" },
  { to: "/privacy", label: "Data Privacy & Security" },
  { to: "/hotline", label: "Emergency Help & Hotlines" },
];

const navLinkClass = ({ isActive }) =>
  `relative px-1 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md ${
    isActive
      ? "text-brand-700 dark:text-brand-400"
      : "text-gray-800 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400"
  }`;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const location = useLocation();
  const role = getAuthRole();
  const dashboardPath = role ? defaultRouteForRole(role) : null;

  React.useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-navy-700 dark:bg-navy-900/95"
          : "bg-white dark:bg-navy-900"
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-600/25">
            <MdShield className="h-6 w-6" aria-hidden />
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-navy-900 dark:text-white">
              Cyber Crime Portal
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Government of Pakistan
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}

          {/* Resources Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1 px-1 py-2 text-sm font-semibold text-gray-800 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md dark:text-gray-200 dark:hover:text-brand-400"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              Resources
              <MdKeyboardArrowDown className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-800"
                >
                  {RESOURCE_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-800 dark:text-gray-300 dark:hover:bg-navy-900 dark:hover:text-brand-400"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {dashboardPath ? (
            <Link
              to={dashboardPath}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth/sign-in"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-navy-900 transition-all hover:border-brand-300 hover:bg-brand-50 dark:border-navy-600 dark:text-white dark:hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <MdLogin className="h-4 w-4" aria-hidden />
                Login
              </Link>
              <Link
                to="/auth/register"
                className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <MdPersonAdd className="h-4 w-4" aria-hidden />
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-navy-900 transition-colors hover:bg-gray-100 lg:hidden dark:text-white dark:hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <MdClose className="h-6 w-6" />
          ) : (
            <MdMenu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-200 bg-white lg:hidden dark:border-navy-700 dark:bg-navy-900"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-semibold ${
                      isActive
                        ? "bg-brand-50 text-brand-800 dark:bg-navy-850 dark:text-brand-400"
                        : "text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-navy-800"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="border-t border-gray-100 pt-2 mt-2 dark:border-navy-700">
                <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Resources
                </p>
                {RESOURCE_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-navy-800"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-navy-700">
                {dashboardPath ? (
                  <Link
                    to={dashboardPath}
                    className="rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-bold text-white"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth/sign-in"
                      className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-bold text-navy-900 dark:border-navy-600 dark:text-white"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth/register"
                      className="rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-bold text-white"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
