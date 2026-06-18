import React from "react";
import PageMeta from "components/public/PageMeta";
import PageHeader from "components/public/PageHeader";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { apiFetch } from "services/api";
import {
  MdSearch,
  MdLock,
  MdCheckCircle,
  MdLogin,
  MdPersonAdd,
  MdOutlineTimeline,
  MdShield,
} from "react-icons/md";

const WORKFLOW = [
  {
    title: "Submit Your Complaint",
    desc: "Register and file your cyber crime report with supporting evidence through the secure portal.",
  },
  {
    title: "Review & Verification",
    desc: "An FIA Cyber Crime Wing officer reviews your report and validates its severity level.",
  },
  {
    title: "Officer Assigned",
    desc: "A designated investigation officer is assigned and begins a formal inquiry into your case.",
  },
  {
    title: "Resolution & Closure",
    desc: "You are notified at each stage; once the investigation concludes, the case is formally closed.",
  },
];

export default function TrackReport() {
  const [complaintId, setComplaintId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const isLoggedIn = !!localStorage.getItem("token");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!complaintId.trim()) {
      setError("Please enter a valid Reference ID or Complaint ID.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch(
        `/complaints/search?complaintId=${encodeURIComponent(complaintId.trim())}`
      );
      const list = Array.isArray(data?.complaints) ? data.complaints : [];
      const match = list.find(
        (c) => c.referenceId === complaintId.trim() || c._id === complaintId.trim()
      );
      if (match) {
        setResult(match);
      } else {
        setError(
          "No complaint found with this Reference ID. Please ensure it matches exactly."
        );
      }
    } catch (err) {
      setError(err?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (sev) => {
    if (sev === "Critical" || sev === "High")
      return "text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-300";
    if (sev === "Medium")
      return "text-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-300";
    return "text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-300";
  };

  return (
    <>
      <PageMeta
        title="Track Complaint"
        description="Securely track the status of your registered cyber crime complaint with the FIA Cyber Crime Wing."
      />
      <PageHeader
        title="Track Your Complaint"
        subtitle="Securely follow the progress of your registered cyber crime report from submission to resolution."
        breadcrumbs={[{ label: "Track Complaint" }]}
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {!isLoggedIn ? (
          /* ---------------- Unauthenticated: secure gateway ---------------- */
          <div className="space-y-8">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
              <div className="flex flex-col items-start gap-5 bg-gradient-to-br from-navy-900 to-emerald-950 p-8 sm:flex-row sm:items-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/15">
                  <MdLock className="h-7 w-7" aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Sign in to track your complaint
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                    To protect citizen privacy under the Prevention of Electronic
                    Crimes Act (PECA) 2016, complaint details, evidence, and
                    investigator communications are only available to verified,
                    authenticated users. Please sign in or create an account to
                    view your live case status.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-6 sm:flex-row sm:p-8">
                <Link
                  to="/auth/sign-in"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <MdLogin className="h-5 w-5" aria-hidden />
                  Sign In to Your Account
                </Link>
                <Link
                  to="/auth/register"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-600 px-6 py-3.5 text-sm font-bold text-brand-700 transition-all hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-brand-500 dark:text-brand-400 dark:hover:bg-navy-900"
                >
                  <MdPersonAdd className="h-5 w-5" aria-hidden />
                  Create an Account
                </Link>
              </div>
            </div>

            {/* How tracking works */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-800 md:p-8">
              <h3 className="flex items-center gap-2 text-lg font-bold text-navy-900 dark:text-white">
                <MdOutlineTimeline className="h-6 w-6 text-brand-600" aria-hidden />
                How Complaint Tracking Works
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Every complaint follows a transparent, four-stage investigation
                lifecycle. Sign in to see exactly where your case stands.
              </p>
              <ol className="mt-8 grid gap-6 sm:grid-cols-2">
                {WORKFLOW.map((step, idx) => (
                  <li
                    key={step.title}
                    className="relative rounded-2xl border border-gray-100 bg-slate-50 p-5 dark:border-navy-700 dark:bg-navy-900/40"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {idx + 1}
                    </span>
                    <p className="mt-3 font-bold text-navy-900 dark:text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {step.desc}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-900/40 dark:bg-brand-900/10 dark:text-brand-200">
                <MdShield className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
                <span>
                  Never share your complaint reference number, OTP, or password
                  with anyone. The FIA will never ask for your password over phone
                  or email.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ---------------- Authenticated: live tracking ---------------- */
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-800 md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy-900 dark:text-white">
              <MdOutlineTimeline className="h-6 w-6 text-brand-600" aria-hidden />
              Check Complaint Status
            </h2>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Enter your official Complaint ID or Reference ID (received via SMS,
              email, or upon submission) to view its current status.
            </p>

            <form onSubmit={handleTrack} className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label htmlFor="ref-id" className="sr-only">
                    Reference ID
                  </label>
                  <input
                    id="ref-id"
                    required
                    type="text"
                    placeholder="e.g. CC-2026-0012"
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
                >
                  {loading ? (
                    "Searching..."
                  ) : (
                    <>
                      <MdSearch className="h-5 w-5" aria-hidden />
                      Track Report
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                {error}
              </div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 border-t border-gray-150 pt-6 dark:border-navy-700"
              >
                <h3 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">
                  Incident Report Record
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-700 dark:bg-navy-900/40">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Reference ID
                    </p>
                    <p className="mt-1 text-sm font-bold text-navy-900 dark:text-white">
                      {result.referenceId || result._id}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-700 dark:bg-navy-900/40">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Incident Category
                    </p>
                    <p className="mt-1 text-sm font-semibold text-navy-900 dark:text-white">
                      {result.incidentType}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-700 dark:bg-navy-900/40">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Case Status
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {result.status}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-700 dark:bg-navy-900/40">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Severity Level
                    </p>
                    <span
                      className={`mt-1.5 inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${severityColor(
                        result.severity
                      )}`}
                    >
                      {result.severity || "Low"}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
                    Investigation Lifecycle Timeline
                  </h4>
                  <div className="relative ml-2.5 space-y-6 border-l border-gray-200 pl-5 dark:border-navy-700">
                    {[
                      {
                        title: "Complaint Submitted",
                        desc: "Citizen filed report and uploaded initial logs.",
                        checked: true,
                      },
                      {
                        title: "Review & Verification",
                        desc: "Wing officer parses and validates severity level.",
                        checked: result.status !== "Pending",
                      },
                      {
                        title: "Officer Assigned",
                        desc: "Undergoing formal inquiry by designated wing desk.",
                        checked: ["Under Investigation", "Resolved", "Closed"].includes(
                          result.status
                        ),
                      },
                      {
                        title: "Case Resolved",
                        desc: "Investigation finished; formal closure logged.",
                        checked: ["Resolved", "Closed"].includes(result.status),
                      },
                    ].map((step, idx) => (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-[30px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                            step.checked
                              ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                              : "border-gray-300 bg-gray-100 dark:border-navy-700 dark:bg-navy-900"
                          }`}
                        >
                          {step.checked && <MdCheckCircle className="h-3.5 w-3.5" />}
                        </span>
                        <p
                          className={`text-sm font-bold ${
                            step.checked
                              ? "text-navy-900 dark:text-white"
                              : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
