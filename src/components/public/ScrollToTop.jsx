import React from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the window scroll position to the top whenever the route changes.
 * Without this, a single-page navigation keeps the previous scroll offset,
 * which feels broken on a multi-page public site.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, left: 0, behavior: prefersReduced ? "auto" : "instant" });
  }, [pathname]);

  return null;
}
