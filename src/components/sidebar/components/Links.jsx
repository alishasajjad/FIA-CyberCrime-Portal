/* eslint-disable */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import DashIcon from "components/icons/DashIcon";
import { getAuthRole } from "utils/auth";
import { useUnreadCount } from "utils/notificationsStore";

export function SidebarLinks(props) {
  let location = useLocation();

  const { routes } = props;

  const role = getAuthRole();
  const unread = useUnreadCount();

  const activeRoute = (routeName) => {
    return location.pathname.includes(routeName);
  };

  const createLinks = (routeList) => {
    return routeList.map((route, index) => {
      if (route.layout === "/admin") {
        if (Array.isArray(route.roles) && route.roles.length > 0) {
          if (!role || !route.roles.includes(role)) return null;
        }
        return (
          <Link key={index} to={route.layout + "/" + route.path}>
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li className="my-[3px] flex cursor-pointer items-center px-6" key={index}>
                <span
                  className={`${
                    activeRoute(route.path) === true
                      ? "font-semibold text-green-700 dark:text-white"
                      : "font-medium text-gray-500"
                  }`}
                >
                  {route.icon ? route.icon : <DashIcon />}{" "}
                </span>
                <p
                  className={`leading-1 ml-4 flex items-center gap-2 ${
                    activeRoute(route.path) === true
                      ? "font-semibold text-navy-700 dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.name}
                  {(route.path === "notifications" || route.path === "alerts") && unread > 0 ? (
                    <span
                      className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white"
                      aria-label={`${unread} unread`}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}
                </p>
              </li>
              {activeRoute(route.path) ? (
                <div className="absolute right-0 top-px h-8 w-1 rounded-lg bg-green-500 dark:bg-green-400" />
              ) : null}
            </div>
          </Link>
        );
      }
      return null;
    });
  };
  return createLinks(routes);
}

export default SidebarLinks;
