import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdCookie, MdShield, MdCheckCircle } from "react-icons/md";
import { apiFetch } from "services/api";
import { hasAcceptedCookies, setCookieConsent } from "utils/cookieConsent";

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showCookieGate, setShowCookieGate] = React.useState(false);

  // Optional WhatsApp/phone OTP verification (does not block registration).
  const [otp, setOtp] = React.useState({
    stage: "idle", // idle | sent | verified
    code: "",
    message: "",
    busy: false,
    devCode: "",
  });

  const requestOtp = async (resend) => {
    const phone = document.getElementById("phoneNumber")?.value?.trim() || "";
    if (!phone) {
      setOtp((o) => ({ ...o, message: "Enter your phone number first." }));
      return;
    }
    setOtp((o) => ({ ...o, busy: true, message: "" }));
    try {
      const data = await apiFetch(`/otp/${resend ? "resend" : "request"}`, {
        method: "POST",
        body: { phone, purpose: "registration" },
      });
      setOtp((o) => ({
        ...o,
        stage: "sent",
        busy: false,
        message: data?.message || "Code sent.",
        devCode: data?.devCode || "",
      }));
    } catch (err) {
      setOtp((o) => ({ ...o, busy: false, message: err?.message || "Failed to send code." }));
    }
  };

  const verifyOtp = async () => {
    const phone = document.getElementById("phoneNumber")?.value?.trim() || "";
    setOtp((o) => ({ ...o, busy: true, message: "" }));
    try {
      await apiFetch("/otp/verify", {
        method: "POST",
        body: { phone, code: otp.code, purpose: "registration" },
      });
      setOtp((o) => ({ ...o, stage: "verified", busy: false, message: "Phone verified." }));
    } catch (err) {
      setOtp((o) => ({ ...o, busy: false, message: err?.message || "Verification failed." }));
    }
  };

  const handleRegister = async () => {
    setError("");
    const name = document.getElementById("name")?.value?.trim() || "";
    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const role = document.getElementById("role")?.value || "User";
    const unit = document.getElementById("unit")?.value?.trim() || "";
    const phoneNumber = document.getElementById("phoneNumber")?.value?.trim() || "";
    const cnic = document.getElementById("cnic")?.value?.trim() || "";
    const officerEnrollmentToken =
      document.getElementById("officerEnrollmentToken")?.value?.trim() || "";

    if (!name || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }

    // Account creation requires acceptance of essential cookies (secure sessions).
    if (!hasAcceptedCookies()) {
      setShowCookieGate(true);
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/users/register", {
        method: "POST",
        body: {
          name,
          fullName: name,
          email,
          password,
          role,
          unit,
          phoneNumber,
          cnic,
          officerEnrollmentToken,
        },
      });

      window.alert("Account created. Please sign in.");
      navigate("/auth/sign-in");
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const acceptCookiesAndContinue = () => {
    setCookieConsent("accepted");
    setShowCookieGate(false);
    // Re-run registration now that consent is granted.
    handleRegister();
  };

  return (
    <div className="mx-auto flex w-full max-w-full flex-col justify-center sm:max-w-[480px] lg:max-w-[480px] lg:mx-0">
      <div className="rounded-3xl border border-green-100 bg-white p-6 sm:p-10 shadow-[0_24px_70px_rgba(22,101,52,0.07)] dark:border-white/10 dark:bg-navy-800">
        <div className="mb-3 inline-flex rounded-full border border-amber-100 bg-amber-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          Public Registration
        </div>
        <h4 className="mb-2 text-3xl font-extrabold text-navy-900 dark:text-white sm:text-4xl">
          Create Account
        </h4>
        <p className="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Register as a complainant or an investigation officer. Administrator
          accounts are not created here—they are added by an existing admin.
        </p>

        {error ? (
          <div
            className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-col gap-1.5">
          <label
            className="text-sm font-bold text-navy-800 dark:text-gray-200"
            htmlFor="name"
          >
            Full name*
          </label>
          <input
            id="name"
            className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            placeholder="e.g. Officer Jane Doe"
            autoComplete="name"
          />
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <label
            className="text-sm font-bold text-navy-800 dark:text-gray-200"
            htmlFor="email"
          >
            Email*
          </label>
          <input
            id="email"
            className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            placeholder="mail@example.com"
            type="email"
            autoComplete="email"
          />
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <label
            className="text-sm font-bold text-navy-800 dark:text-gray-200"
            htmlFor="password"
          >
            Password*
          </label>
          <input
            id="password"
            className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            placeholder="Min. 8 characters"
            type="password"
            autoComplete="new-password"
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-bold text-navy-800 dark:text-gray-200"
              htmlFor="role"
            >
              Role*
            </label>
            <select
              id="role"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              <option value="User">User (complainant)</option>
              <option value="InvestigationOfficer">Investigation officer</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-bold text-navy-800 dark:text-gray-200"
              htmlFor="unit"
            >
              Department (optional)
            </label>
            <input
              id="unit"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              placeholder="e.g. Digital Forensics"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <label
            className="text-sm font-bold text-navy-800 dark:text-gray-200"
            htmlFor="officerEnrollmentToken"
          >
            Officer enrollment token (if required)
          </label>
          <input
            id="officerEnrollmentToken"
            className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            placeholder="Enter token provided by admin"
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-bold text-navy-800 dark:text-gray-200"
              htmlFor="phoneNumber"
            >
              Phone number (optional)
            </label>
            <input
              id="phoneNumber"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              placeholder="+92 300 1234567"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-bold text-navy-800 dark:text-gray-200"
              htmlFor="cnic"
            >
              CNIC (optional)
            </label>
            <input
              id="cnic"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              placeholder="35202-1234567-1"
            />
          </div>
        </div>

        {/* Optional WhatsApp phone verification */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-navy-700 dark:bg-navy-900/40">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold text-navy-800 dark:text-gray-200">
              <MdShield className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
              Verify phone via WhatsApp
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500 dark:bg-navy-700 dark:text-gray-300">
                Optional
              </span>
            </p>
            {otp.stage === "verified" ? (
              <span className="flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-300">
                <MdCheckCircle className="h-4 w-4" /> Verified
              </span>
            ) : null}
          </div>
          {otp.stage !== "verified" ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Confirm ownership of your number now, or skip and register normally.
            </p>
          ) : null}

          {otp.stage === "idle" && (
            <button
              type="button"
              onClick={() => requestOtp(false)}
              disabled={otp.busy}
              className="mt-3 rounded-lg bg-brand-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {otp.busy ? "Sending…" : "Send verification code"}
            </button>
          )}

          {otp.stage === "sent" && (
            <div className="mt-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  inputMode="numeric"
                  value={otp.code}
                  onChange={(e) => setOtp((o) => ({ ...o, code: e.target.value }))}
                  placeholder="6-digit code"
                  className="flex-1 rounded-lg border border-gray-200 bg-white p-2.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={otp.busy || !otp.code}
                  className="rounded-lg bg-brand-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => requestOtp(true)}
                  disabled={otp.busy}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-navy-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-800"
                >
                  Resend
                </button>
              </div>
              {otp.devCode ? (
                <p className="mt-2 text-[11px] text-gray-400">
                  Dev code (console provider): <span className="font-mono font-bold">{otp.devCode}</span>
                </p>
              ) : null}
            </div>
          )}

          {otp.message ? (
            <p className={`mt-2 text-xs font-medium ${otp.stage === "verified" ? "text-green-700 dark:text-green-300" : "text-gray-600 dark:text-gray-300"}`}>
              {otp.message}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="linear w-full rounded-xl bg-brand-700 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/20 transition duration-200 hover:bg-brand-800 active:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500 dark:active:bg-brand-400"
          onClick={handleRegister}
          disabled={submitting}
        >
          {submitting ? "Creating…" : "Create Account"}
        </button>

        <div className="mt-5 text-center">
          <span className="text-sm font-semibold text-gray-750 dark:text-gray-300">
            Already have an account?
          </span>{" "}
          <Link
            to="/auth/sign-in"
            className="ml-1 text-sm font-bold text-brand-700 hover:text-brand-800 hover:underline dark:text-brand-400 dark:hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Cookie consent gate — required before account creation */}
      <AnimatePresence>
        {showCookieGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-gate-title"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-navy-700 dark:bg-navy-800"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-navy-900 dark:text-brand-400">
                <MdCookie className="h-7 w-7" aria-hidden />
              </span>
              <h3
                id="cookie-gate-title"
                className="mt-4 text-lg font-bold text-navy-900 dark:text-white"
              >
                Cookie consent required
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                Creating an account requires acceptance of{" "}
                <strong className="font-semibold text-navy-900 dark:text-white">
                  essential cookies
                </strong>
                . These are used solely for secure session management and to keep
                your account protected — we cannot register or sign you in without
                them.
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3 text-xs text-brand-900 dark:border-brand-900/40 dark:bg-brand-900/10 dark:text-brand-200">
                <MdShield className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
                <span>
                  You previously declined cookies. Accept essential cookies to
                  continue with registration.
                </span>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={acceptCookiesAndContinue}
                  className="flex-1 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  Accept &amp; Continue
                </button>
                <button
                  type="button"
                  onClick={() => setShowCookieGate(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
                >
                  Not now
                </button>
              </div>
              <Link
                to="/cookie-policy"
                className="mt-3 block text-center text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
              >
                Read our Cookie Policy
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
