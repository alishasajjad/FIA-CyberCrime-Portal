/* eslint-disable */

import { HiX } from "react-icons/hi";
import Links from "./components/Links";

import routes from "routes.js";

const Sidebar = ({ open, onClose }) => {
  return (
    <div
      className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col overflow-y-auto border-r border-green-50 bg-white pb-10 shadow-[0_10px_40px_rgba(22,101,52,0.12)] transition-transform duration-175 ease-linear dark:border-green-900/30 dark:bg-navy-800 dark:text-white ${
        open ? "translate-x-0" : "-translate-x-full"
      } xl:translate-x-0`}
    >
      <span
        className="absolute top-4 right-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      <div className={`mx-[32px] mt-[40px] flex items-center`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <span className="text-lg font-bold">CC</span>
        </div>
        <div className="ml-3 flex flex-col">
          <span className="text-sm font-semibold text-navy-700 dark:text-white">
            FIA Cyber Crime
          </span>
          <span className="text-[11px] font-medium text-green-700/80">
            Wing · Pakistan
          </span>
        </div>
      </div>
      <div className="mt-[32px] mb-5 h-px bg-green-50 dark:bg-white/20" />

      <ul className="mb-auto pt-1">
        <Links routes={routes} />
      </ul>

      <div className="mt-auto px-6 pb-6">
        <div className="rounded-2xl border border-green-100/80 bg-green-50/40 p-4 text-xs text-gray-600 dark:border-white/10 dark:bg-navy-900/60 dark:text-gray-300">
          <p className="font-semibold text-navy-700 dark:text-white">
            Secure channel
          </p>
          <p className="mt-1 leading-relaxed">
            Report sensitive incidents only through authenticated sessions. Never
            share credentials or OTPs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
