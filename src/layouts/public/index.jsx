import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "components/public/Navbar";
import Footer from "components/public/Footer";
import CookieConsent from "components/public/CookieConsent";
import publicRoutes from "routes/publicRoutes";

export default function PublicLayout() {
  document.documentElement.dir = "ltr";

  const getRoutes = () =>
    publicRoutes.map((route, key) => (
      <Route path={route.path} element={route.element} key={key} />
    ));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-navy-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Routes>{getRoutes()}</Routes>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
