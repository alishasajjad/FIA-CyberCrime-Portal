import Footer from "components/footer/FooterAuthDefault";
import cyberHero from "assets/img/auth/cyber-security.svg";
import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import routes from "routes.js";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";
import React from "react";
import {
  defaultRouteForRole,
  getAuthRole,
  getRoleFromToken,
} from "utils/auth";

export default function Auth() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem("token") || "";
    if (!token) return;
    const role = getRoleFromToken(token) || getAuthRole();
    if (role) navigate(defaultRouteForRole(role), { replace: true });
  }, [navigate]);

  const getRoutes = (routeList) => {
    return routeList.map((prop, key) => {
      if (prop.layout === "/auth") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      }
      return null;
    });
  };

  const backTarget = (() => {
    const token = localStorage.getItem("token") || "";
    const role = token ? getRoleFromToken(token) || getAuthRole() : null;
    return role ? defaultRouteForRole(role) : "/";
  })();

  document.documentElement.dir = "ltr";
  return (
    <div>
      <div className="relative float-right h-full min-h-screen w-full !bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:!bg-navy-900">
        <FixedPlugin />
        <main className="mx-auto min-h-screen">
          <div className="relative flex min-h-screen flex-col lg:flex-row">
            <div className="relative z-10 flex w-full flex-col px-5 pb-10 pt-10 md:px-10 lg:w-[min(52%,640px)] lg:max-w-[640px] lg:justify-center lg:py-0 xl:pl-16">
              <Link
                to={backTarget}
                className="mb-6 flex w-max items-center lg:mb-10"
              >
                <svg
                  width="8"
                  height="12"
                  viewBox="0 0 8 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M6.70994 2.11997L2.82994 5.99997L6.70994 9.87997C7.09994 10.27 7.09994 10.9 6.70994 11.29C6.31994 11.68 5.68994 11.68 5.29994 11.29L0.709941 6.69997C0.319941 6.30997 0.319941 5.67997 0.709941 5.28997L5.29994 0.699971C5.68994 0.309971 6.31994 0.309971 6.70994 0.699971C7.08994 1.08997 7.09994 1.72997 6.70994 2.11997V2.11997Z"
                    fill="#A3AED0"
                  />
                </svg>
                <p className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                  Back to home
                </p>
              </Link>

              <Routes>
                {getRoutes(routes)}
                <Route
                  path="/"
                  element={<Navigate to="/auth/sign-in" replace />}
                />
              </Routes>
              <Footer />
            </div>

            <div className="relative hidden min-h-[320px] flex-1 lg:flex">
              <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-[#0f172a] to-emerald-950/90" />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, #22c55e 0, transparent 45%), radial-gradient(circle at 80% 30%, #38bdf8 0, transparent 40%)",
                }}
              />
              <div className="relative z-[1] flex w-full flex-col items-center justify-center px-10 py-16">
                <div className="max-w-lg text-center lg:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
                    Cyber security operations
                  </p>
                  <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl">
                    Report, investigate, and resolve digital incidents with
                    confidence.
                  </h1>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">
                    End-to-end workflows for citizens, investigators, and
                    administrators—secured with role-based access and audit-ready
                    records.
                  </p>
                </div>
                <div className="mt-10 flex w-full max-w-xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <img
                    src={cyberHero}
                    alt=""
                    className="h-auto w-full max-h-[min(52vh,420px)] object-contain drop-shadow-[0_20px_50px_rgba(34,197,94,0.25)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
