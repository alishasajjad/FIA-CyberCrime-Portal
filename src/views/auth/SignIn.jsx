import InputField from "components/fields/InputField";
import Checkbox from "components/checkbox";
import { Link, useNavigate } from "react-router-dom";
import React from "react";
import { apiFetch } from "services/api";
import { persistSession, defaultRouteForRole, getAuthRole } from "utils/auth";

export default function SignIn() {
  const navigate = useNavigate();
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("token") || "";
    if (!token) return;
    const role = getAuthRole();
    if (role) navigate(defaultRouteForRole(role), { replace: true });
  }, [navigate]);

  const handleSignIn = async () => {
    setError("");
    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch("/users/login", {
        method: "POST",
        body: { email, password },
      });

      const token = data?.token;
      const user = data?.user;
      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      persistSession({ token, user });
      // Simulate OTP verification channels for security audit notifications.
      apiFetch("/users/otp/verify", { method: "POST" }).catch(() => null);
      navigate(defaultRouteForRole(user.role));
    } catch (err) {
      setError(err?.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-full flex-col justify-center sm:max-w-[440px] lg:max-w-[440px] lg:mx-0">
      <div className="rounded-3xl border border-green-100 bg-white p-6 sm:p-10 shadow-[0_24px_70px_rgba(22,101,52,0.07)] dark:border-white/10 dark:bg-navy-800">
        <div className="mb-3 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:border-emerald-950/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          Secure Access
        </div>
        <h4 className="mb-2 text-3xl font-extrabold text-navy-900 dark:text-white sm:text-4xl">
          Sign In
        </h4>
        <p className="mb-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Use the account issued to your role. Complainants and officers register
          online; administrator accounts are provisioned separately.
        </p>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Need an account?{" "}
          <Link
            to="/auth/register"
            className="font-bold text-brand-700 hover:text-brand-800 hover:underline dark:text-brand-400 dark:hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
          >
            Create one
          </Link>
        </p>

        {error ? (
          <div
            className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <InputField
          variant="auth"
          extra="mb-4"
          label="Email*"
          placeholder="mail@example.com"
          id="email"
          type="email"
          autoComplete="email"
          className="focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />

        <InputField
          variant="auth"
          extra="mb-4"
          label="Password*"
          placeholder="Min. 8 characters"
          id="password"
          type="password"
          autoComplete="current-password"
          className="focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />

        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center">
            <Checkbox id="keep-signed-in" />
            <label
              htmlFor="keep-signed-in"
              className="ml-2.5 text-sm font-semibold text-navy-800 dark:text-gray-200 cursor-pointer"
            >
              Keep me signed in
            </label>
          </div>
        </div>

        <button
          className="linear w-full rounded-xl bg-brand-700 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/20 transition duration-200 hover:bg-brand-800 active:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500 dark:active:bg-brand-400"
          type="button"
          onClick={handleSignIn}
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}
