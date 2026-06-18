import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar";
import Footer from "components/footer/Footer";
import routes from "routes.js";
import RoleGuard from "components/auth/RoleGuard";
import { defaultRouteForRole, getAuthRole } from "utils/auth";

function AdminEntryRedirect() {
  const token = localStorage.getItem("token") || "";
  if (!token) return <Navigate to="/auth/sign-in" replace />;
  const role = getAuthRole();
  return <Navigate to={defaultRouteForRole(role)} replace />;
}

export default function Admin(props) {
  const { ...rest } = props;
  const location = useLocation();
  const [open, setOpen] = React.useState(true);
  const [currentRoute, setCurrentRoute] = React.useState("Dashboard");

  const token = localStorage.getItem("token") || "";

  React.useEffect(() => {
    window.addEventListener("resize", () =>
      window.innerWidth < 1200 ? setOpen(false) : setOpen(true)
    );
  }, []);
  React.useEffect(() => {
    getActiveRoute(routes);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  const getActiveRoute = (routeList) => {
    for (let i = 0; i < routeList.length; i++) {
      if (
        window.location.href.indexOf(
          routeList[i].layout + "/" + routeList[i].path
        ) !== -1
      ) {
        setCurrentRoute(routeList[i].name);
        return routeList[i].name;
      }
    }
    return "Dashboard";
  };
  const getActiveNavbar = (routeList) => {
    for (let i = 0; i < routeList.length; i++) {
      if (
        window.location.href.indexOf(routeList[i].layout + routeList[i].path) !==
        -1
      ) {
        return routeList[i].secondary;
      }
    }
    return false;
  };
  const getRoutes = (routeList) => {
    return routeList.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route
            path={`/${prop.path}`}
            element={
              <RoleGuard allowedRoles={prop.roles}>{prop.component}</RoleGuard>
            }
            key={key}
          />
        );
      }
      return null;
    });
  };

  document.documentElement.dir = "ltr";
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-h-screen w-full min-w-0 flex-1 bg-lightPrimary transition-[margin] duration-175 ease-linear dark:!bg-navy-900 xl:ml-[260px]">
        <main className="mx-[12px] h-full w-full flex-none md:pr-2">
          <div className="h-full min-h-screen w-full">
            <Navbar
              onOpenSidenav={() => setOpen(true)}
              logoText={"FIA Cyber Crime Wing"}
              brandText={currentRoute}
              secondary={getActiveNavbar(routes)}
              {...rest}
            />
            <div className="mx-auto mb-auto h-full min-h-[84vh] p-4 md:pr-2">
              <Routes>
                {getRoutes(routes)}
                <Route path="/" element={<AdminEntryRedirect />} />
              </Routes>
            </div>
            <div className="p-3">
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
