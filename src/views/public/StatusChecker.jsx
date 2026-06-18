import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import { Link } from "react-router-dom";
import { getAuthRole, defaultRouteForRole } from "utils/auth";
import {
  MdVerifiedUser,
  MdLock,
  MdLogin,
  MdPersonAdd,
  MdLaunch,
  MdFingerprint,
  MdPrivacyTip,
} from "react-icons/md";

const VERIFICATION_STEPS = [
  {
    icon: MdLogin,
    title: "Sign In Securely",
    desc: "Log in to the portal with the account used to file your complaint.",
  },
  {
    icon: MdFingerprint,
    title: "Identity Verification",
    desc: "Your CNIC and registered details confirm you are the rightful complainant.",
  },
  {
    icon: MdVerifiedUser,
    title: "View Live Status",
    desc: "Access real-time case status, officer notes, and secure messaging.",
  },
];

export default function StatusChecker() {
  const role = getAuthRole();
  const isLoggedIn = !!role;
  const dashboardPath = isLoggedIn ? defaultRouteForRole(role) : null;

  return (
    <>
      <PageMeta
        title="Complaint Status Checker"
        description="Securely verify the status of your registered cyber crime complaint with the FIA Cyber Crime Wing under PECA 2016."
      />
      <PageHeader
        title="Complaint Status Checker"
        subtitle="A secure, identity-verified way to check the progress of your registered cyber crime complaint."
        breadcrumbs={[{ label: "Status Checker" }]}
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
          <div className="flex flex-col items-start gap-5 bg-gradient-to-br from-navy-900 to-emerald-950 p-8 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/15">
              <MdLock className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">
                Your complaint status is protected
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                Under the Prevention of Electronic Crimes Act (PECA) 2016,
                complaint records are confidential. To prevent unauthorized access
                and identity enumeration, status details are released only to
                verified, authenticated complainants — never on a public page.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-6 sm:flex-row sm:p-8">
            {isLoggedIn ? (
              <Link
                to={dashboardPath}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                <MdLaunch className="h-5 w-5" aria-hidden />
                Open My Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/sign-in"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <MdLogin className="h-5 w-5" aria-hidden />
                  Sign In to Check Status
                </Link>
                <Link
                  to="/auth/register"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-600 px-6 py-3.5 text-sm font-bold text-brand-700 transition-all hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-brand-500 dark:text-brand-400 dark:hover:bg-navy-900"
                >
                  <MdPersonAdd className="h-5 w-5" aria-hidden />
                  Create an Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* How verification works */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-800 md:p-8">
          <h3 className="flex items-center gap-2 text-lg font-bold text-navy-900 dark:text-white">
            <MdVerifiedUser className="h-6 w-6 text-brand-600" aria-hidden />
            How Secure Verification Works
          </h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {VERIFICATION_STEPS.map((step, idx) => (
              <div
                key={step.title}
                className="rounded-2xl border border-gray-100 bg-slate-50 p-5 dark:border-navy-700 dark:bg-navy-900/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
                    <step.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Step {idx + 1}
                  </span>
                </div>
                <p className="mt-3 font-bold text-navy-900 dark:text-white">
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <MdPrivacyTip className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <span>
              Beware of fraudulent "status check" websites. The only official
              channel is this portal. The FIA will never ask for your password,
              OTP, or banking PIN to share a complaint status.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
