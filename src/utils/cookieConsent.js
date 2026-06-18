// Shared cookie-consent state used by the public consent banner and the
// registration gate. Essential cookies (secure session management) must be
// accepted before an account can be created.
export const CONSENT_KEY = "cookie_consent";
export const CONSENT_EVENT = "cookie-consent-change";

export function getCookieConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY); // "accepted" | "rejected" | null
  } catch {
    return null;
  }
}

export function hasAcceptedCookies() {
  return getCookieConsent() === "accepted";
}

export function setCookieConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore storage errors */
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {
    /* ignore */
  }
}
