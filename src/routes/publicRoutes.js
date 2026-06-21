import React from "react";
import Home from "views/public/Home";
import AboutUs from "views/public/AboutUs";
import Services from "views/public/Services";
import CyberAwareness from "views/public/CyberAwareness";
import FAQ from "views/public/FAQ";
import ContactUs from "views/public/ContactUs";
import HelpCenter from "views/public/HelpCenter";
import PrivacyPolicy from "views/public/PrivacyPolicy";
import TermsConditions from "views/public/TermsConditions";
import CookiePolicy from "views/public/CookiePolicy";

// New Public Views
import CyberLaws from "views/public/CyberLaws";
import TrackReport from "views/public/TrackReport";
import StatusChecker from "views/public/StatusChecker";
import SecurityGuidelines from "views/public/SecurityGuidelines";
import Blog from "views/public/Blog";
import EmergencyHelp from "views/public/EmergencyHelp";
import DataPrivacy from "views/public/DataPrivacy";
import NotFound from "views/public/NotFound";

const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/about", element: <AboutUs /> },
  { path: "/services", element: <Services /> },
  { path: "/cyber-awareness", element: <CyberAwareness /> },
  { path: "/faq", element: <FAQ /> },
  { path: "/contact", element: <ContactUs /> },
  { path: "/help", element: <HelpCenter /> },
  { path: "/privacy-policy", element: <PrivacyPolicy /> },
  { path: "/terms", element: <TermsConditions /> },
  { path: "/cookie-policy", element: <CookiePolicy /> },
  { path: "/cyber-laws", element: <CyberLaws /> },
  { path: "/track-report", element: <TrackReport /> },
  { path: "/status-checker", element: <StatusChecker /> },
  { path: "/security-guidelines", element: <SecurityGuidelines /> },
  { path: "/blog", element: <Blog /> },
  { path: "/hotline", element: <EmergencyHelp /> },
  { path: "/privacy", element: <DataPrivacy /> },
  { path: "*", element: <NotFound /> },
];

export default publicRoutes;
