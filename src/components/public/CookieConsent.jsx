import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdCookie } from "react-icons/md";
import { getCookieConsent, setCookieConsent } from "utils/cookieConsent";

export default function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  const savePreference = (value) => {
    setCookieConsent(value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xl sm:flex-row sm:items-center sm:gap-6 sm:p-6 dark:border-navy-700 dark:bg-navy-900">
            <div className="flex flex-1 items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-navy-800">
                <MdCookie className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-navy-900 dark:text-white">
                  We use cookies
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  This portal uses cookies to improve your experience, analyze
                  site traffic, and support secure session management. Read our{" "}
                  <Link
                    to="/cookie-policy"
                    className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                  >
                    Cookie Policy
                  </Link>{" "}
                  for details.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => savePreference("rejected")}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-navy-600 dark:text-gray-200 dark:hover:bg-navy-800"
              >
                Reject Cookies
              </button>
              <button
                type="button"
                onClick={() => savePreference("accepted")}
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-700"
              >
                Accept Cookies
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
