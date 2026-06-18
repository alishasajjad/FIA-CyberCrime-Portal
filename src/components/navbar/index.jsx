import React from "react";
import Dropdown from "components/dropdown";
import { FiAlignJustify } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { BsArrowBarUp } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import {
  IoMdNotificationsOutline,
  IoMdInformationCircleOutline,
} from "react-icons/io";
import avatar from "assets/img/avatars/profile-cyber.svg";
import { clearSession, defaultRouteForRole, getAuthRole } from "utils/auth";
import { apiFetch } from "services/api";
import { useNotifications, refreshNotifications } from "utils/notificationsStore";

const Navbar = (props) => {
  const { onOpenSidenav, brandText, logoText = "FIA Cyber Crime Wing" } = props;
  const [darkmode, setDarkmode] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const { notifications, unread } = useNotifications();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Source of truth is Atlas via backend; client only persists token.
    const run = async () => {
      if (!localStorage.getItem("token")) {
        setUser(null);
        return;
      }
      try {
        const data = await apiFetch("/users/me");
        setUser(data?.user || null);
      } catch {
        setUser(null);
      }
    };
    run();
  }, []);

  const displayName = user?.name || "Signed in";
  const displayEmail = user?.email || "";
  const roleLabel = user?.role || getAuthRole() || "";

  const handleLogout = async () => {
    await clearSession();
    navigate("/auth/sign-in", { replace: true });
  };

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-2xl bg-white/80 p-3 backdrop-blur-xl shadow-[0_10px_30px_rgba(22,101,52,0.06)] dark:bg-navy-800/80">
      <div className="ml-[6px] flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-green-700">
          {logoText}
        </span>
        <span className="mt-1 text-lg font-semibold text-navy-700 dark:text-white">
          {brandText}
        </span>
      </div>

      <div className="relative mt-[3px] flex h-[56px] w-[355px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-[0_10px_25px_rgba(22,101,52,0.06)] dark:!bg-navy-800 dark:shadow-none md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[365px] xl:gap-2">
        <div className="flex h-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white xl:w-[225px]">
          <p className="pl-3 pr-2 text-xl">
            <FiSearch className="h-4 w-4 text-gray-400 dark:text-white" />
          </p>
          <input
            type="text"
            placeholder="Search incidents, IDs..."
            className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-white sm:w-fit"
          />
        </div>
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>
        <Dropdown
          button={
            <p className="relative cursor-pointer">
              <IoMdNotificationsOutline className="h-4 w-4 text-gray-600 dark:text-white" />
              {unread > 0 ? (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-navy-800"
                  aria-label={`${unread} unread notifications`}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </p>
          }
          animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
          children={
            <div className="flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none sm:w-[460px]">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-navy-700 dark:text-white">
                  System Notifications
                </p>
                <button
                  type="button"
                  className="text-sm font-bold text-navy-700 dark:text-white"
                  onClick={async () => {
                    await apiFetch("/notifications/read-all", { method: "PATCH" });
                    await refreshNotifications();
                  }}
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-300">No notifications yet.</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    className="flex w-full items-center text-left"
                    onClick={async () => {
                      if (!n.read) {
                        await apiFetch(`/notifications/${n._id}/read`, { method: "PATCH" });
                        await refreshNotifications();
                      }
                    }}
                  >
                    <div className="flex h-full w-[85px] items-center justify-center rounded-xl bg-gradient-to-b from-brandLinear to-brand-500 py-4 text-2xl text-white">
                      <BsArrowBarUp />
                    </div>
                    <div className="ml-2 flex h-full w-full flex-col justify-center rounded-lg px-1 text-sm">
                      <p className="mb-1 text-left text-base font-bold text-gray-900 dark:text-white">
                        {n.title}
                      </p>
                      <p className="font-base text-left text-xs text-gray-900 dark:text-white">
                        {n.message}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          }
          classNames={"py-2 top-4 -left-[230px] md:-left-[440px] w-max"}
        />
        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdInformationCircleOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            </p>
          }
          children={
            <div className="flex w-[320px] flex-col gap-2 rounded-[20px] bg-white p-4 shadow-[0_10px_30px_rgba(22,101,52,0.12)] dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                About
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-100">
                FIA Cyber Crime Wing console for managing digital incident
                intake, investigations, evidence, and analytics under PECA 2016.
              </p>
            </div>
          }
          classNames={"py-2 top-6 -left-[250px] md:-left-[330px] w-max"}
          animation="origin-[75%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
        />
        <div
          className="cursor-pointer text-gray-600"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove("dark");
              setDarkmode(false);
            } else {
              document.body.classList.add("dark");
              setDarkmode(true);
            }
          }}
        >
          {darkmode ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </div>
        <Dropdown
          button={
            <img
              className="h-10 w-10 rounded-full border border-green-100 object-cover dark:border-white/10"
              src={avatar}
              alt=""
            />
          }
          children={
            <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <div className="p-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-bold text-navy-700 dark:text-white">
                    {displayName}
                  </p>
                  {displayEmail ? (
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {displayEmail}
                    </p>
                  ) : null}
                  {roleLabel ? (
                    <p className="text-[11px] font-medium uppercase tracking-wide text-green-700 dark:text-green-300">
                      {roleLabel}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-white/20 " />

              <div className="flex flex-col p-4">
                <button
                  type="button"
                  className="text-left text-sm text-gray-800 dark:text-white hover:dark:text-white"
                  onClick={() =>
                    navigate(defaultRouteForRole(getAuthRole()) || "/admin/dashboard")
                  }
                >
                  Go to home
                </button>
                <button
                  type="button"
                  className="mt-3 text-left text-sm font-medium text-red-500 hover:text-red-500 transition duration-150 ease-out hover:ease-in"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            </div>
          }
          classNames={"py-2 top-8 -left-[180px] w-max"}
        />
      </div>
    </nav>
  );
};

export default Navbar;
