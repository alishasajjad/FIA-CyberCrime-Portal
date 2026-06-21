import React from "react";

// Admin Imports
import CrimeDashboard from "views/admin/CrimeDashboard";
import ReportCrime from "views/admin/ReportCrime";
import Drafts from "views/admin/Drafts";
import TrackComplaint from "views/admin/TrackComplaint";
import ComplaintDetails from "views/admin/ComplaintDetails";
import Investigations from "views/admin/Investigations";
import Evidence from "views/admin/Evidence";
import Users from "views/admin/Users";
import Analytics from "views/admin/Analytics";
import CrimeMap from "views/admin/CrimeMap";
import NotificationCenter from "views/admin/NotificationCenter";
import OfficerCalendar from "views/admin/OfficerCalendar";
import OfficerAlerts from "views/admin/OfficerAlerts";
import SystemHealth from "views/admin/SystemHealth";
import AdvancedAnalytics from "views/admin/AdvancedAnalytics";
import OfficerPerformance from "views/admin/OfficerPerformance";
import Escalations from "views/admin/Escalations";
import EscalationRules from "views/admin/EscalationRules";
import AuditLog from "views/admin/AuditLog";
import Settings from "views/admin/Settings";

// Auth Imports
import SignIn from "views/auth/SignIn";
import Register from "views/auth/Register";

// Icon Imports
import {
  MdHome,
  MdAssignment,
  MdDrafts,
  MdSearch,
  MdGavel,
  MdFolderSpecial,
  MdPeople,
  MdBarChart,
  MdMap,
  MdNotifications,
  MdMonitorHeart,
  MdLeaderboard,
  MdPriorityHigh,
  MdHistory,
  MdEventNote,
  MdNotificationsActive,
  MdInsights,
  MdRule,
  MdSettings,
  MdLock,
} from "react-icons/md";

const routes = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "dashboard",
    icon: <MdHome className="h-6 w-6" />,
    component: <CrimeDashboard />,
    roles: ["Admin"],
  },
  {
    name: "Report Crime",
    layout: "/admin",
    path: "report-crime",
    icon: <MdAssignment className="h-6 w-6" />,
    component: <ReportCrime />,
    roles: ["User"],
  },
  {
    name: "My Drafts",
    layout: "/admin",
    path: "drafts",
    icon: <MdDrafts className="h-6 w-6" />,
    component: <Drafts />,
    roles: ["User"],
  },
  {
    name: "Track Complaint",
    layout: "/admin",
    path: "track-complaint",
    icon: <MdSearch className="h-6 w-6" />,
    component: <TrackComplaint />,
    roles: ["User", "InvestigationOfficer"],
  },
  {
    name: "Complaint Details",
    layout: "/admin",
    path: "complaint/:id",
    icon: <MdGavel className="h-6 w-6" />,
    component: <ComplaintDetails />,
    roles: ["Admin", "User", "InvestigationOfficer"],
    hidden: true,
  },
  {
    name: "Investigations",
    layout: "/admin",
    path: "investigations",
    icon: <MdGavel className="h-6 w-6" />,
    component: <Investigations />,
    roles: ["InvestigationOfficer"],
  },
  {
    name: "Calendar",
    layout: "/admin",
    path: "calendar",
    icon: <MdEventNote className="h-6 w-6" />,
    component: <OfficerCalendar />,
    roles: ["InvestigationOfficer", "Admin"],
  },
  {
    name: "Alert Center",
    layout: "/admin",
    path: "alerts",
    icon: <MdNotificationsActive className="h-6 w-6" />,
    component: <OfficerAlerts />,
    roles: ["InvestigationOfficer", "Admin"],
  },
  {
    name: "Evidence",
    layout: "/admin",
    path: "evidence",
    icon: <MdFolderSpecial className="h-6 w-6" />,
    component: <Evidence />,
    roles: ["User", "InvestigationOfficer"],
  },
  {
    name: "Users",
    layout: "/admin",
    path: "users",
    icon: <MdPeople className="h-6 w-6" />,
    component: <Users />,
    roles: ["Admin"],
  },
  {
    name: "Analytics",
    layout: "/admin",
    path: "analytics",
    icon: <MdBarChart className="h-6 w-6" />,
    component: <Analytics />,
    roles: ["Admin", "User", "InvestigationOfficer"],
  },
  {
    name: "Crime Map",
    layout: "/admin",
    path: "crime-map",
    icon: <MdMap className="h-6 w-6" />,
    component: <CrimeMap />,
    roles: ["Admin"],
  },
  {
    name: "Advanced Analytics",
    layout: "/admin",
    path: "advanced-analytics",
    icon: <MdInsights className="h-6 w-6" />,
    component: <AdvancedAnalytics />,
    roles: ["Admin"],
  },
  {
    name: "Notifications",
    layout: "/admin",
    path: "notifications",
    icon: <MdNotifications className="h-6 w-6" />,
    component: <NotificationCenter />,
    roles: ["Admin", "User", "InvestigationOfficer"],
  },
  {
    name: "System Health",
    layout: "/admin",
    path: "system-health",
    icon: <MdMonitorHeart className="h-6 w-6" />,
    component: <SystemHealth />,
    roles: ["Admin"],
  },
  {
    name: "Officer Performance",
    layout: "/admin",
    path: "officer-performance",
    icon: <MdLeaderboard className="h-6 w-6" />,
    component: <OfficerPerformance />,
    roles: ["Admin"],
  },
  {
    name: "Escalations",
    layout: "/admin",
    path: "escalations",
    icon: <MdPriorityHigh className="h-6 w-6" />,
    component: <Escalations />,
    roles: ["Admin"],
  },
  {
    name: "Escalation Rules",
    layout: "/admin",
    path: "escalation-rules",
    icon: <MdRule className="h-6 w-6" />,
    component: <EscalationRules />,
    roles: ["Admin"],
  },
  {
    name: "Audit Log",
    layout: "/admin",
    path: "audit-log",
    icon: <MdHistory className="h-6 w-6" />,
    component: <AuditLog />,
    roles: ["Admin"],
  },
  {
    name: "Settings",
    layout: "/admin",
    path: "settings",
    icon: <MdSettings className="h-6 w-6" />,
    component: <Settings />,
    roles: ["Admin"],
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
  {
    name: "Register",
    layout: "/auth",
    path: "register",
    icon: <MdPeople className="h-6 w-6" />,
    component: <Register />,
  },
];
export default routes;
