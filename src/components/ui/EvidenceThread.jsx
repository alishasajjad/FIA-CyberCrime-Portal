import React from "react";
import { MdImage, MdInsertDriveFile, MdDownload, MdOpenInNew } from "react-icons/md";

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime) {
  return String(mime || "").startsWith("image/");
}

function senderName(uploadedBy) {
  if (uploadedBy && typeof uploadedBy === "object") return uploadedBy.name || "Participant";
  return "Participant";
}

function senderRole(uploadedBy) {
  if (uploadedBy && typeof uploadedBy === "object") return uploadedBy.role || "";
  return "";
}

/**
 * Renders a case communication thread of evidence submissions — each item
 * shows the sender, timestamp, optional written message, a file preview for
 * images, and download/open actions. Shared between the User and Officer panels.
 */
export default function EvidenceThread({ items = [], emptyHint }) {
  if (!items.length) {
    return (
      <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
        {emptyHint || "No evidence has been submitted for this case yet."}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((ev) => {
        const role = senderRole(ev.uploadedBy);
        return (
          <li
            key={ev._id}
            className="rounded-xl border border-gray-150 bg-gray-50/70 p-3.5 transition-colors hover:border-brand-200 dark:border-navy-700 dark:bg-navy-900/40"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/10 text-xs font-bold uppercase text-brand-700 dark:text-brand-300">
                  {senderName(ev.uploadedBy).charAt(0)}
                </span>
                <p className="text-sm font-semibold text-navy-900 dark:text-white">
                  {senderName(ev.uploadedBy)}
                  {role ? (
                    <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-navy-800 dark:text-gray-300">
                      {role === "InvestigationOfficer" ? "Officer" : role}
                    </span>
                  ) : null}
                </p>
              </div>
              {ev.createdAt ? (
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(ev.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>

            {ev.message ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {ev.message}
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-150 bg-white p-2.5 dark:border-navy-700 dark:bg-navy-800">
              {ev.fileUrl && isImage(ev.mimeType) ? (
                <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="shrink-0">
                  <img
                    src={ev.fileUrl}
                    alt={ev.originalName}
                    className="h-12 w-12 rounded-lg border border-gray-200 object-cover dark:border-navy-700"
                  />
                </a>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-700 dark:text-brand-300">
                  {isImage(ev.mimeType) ? (
                    <MdImage className="h-6 w-6" aria-hidden />
                  ) : (
                    <MdInsertDriveFile className="h-6 w-6" aria-hidden />
                  )}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                  {ev.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {ev.mimeType || "file"} · {formatBytes(ev.size)}
                </p>
              </div>
              {ev.fileUrl ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href={ev.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-50 dark:border-navy-600 dark:text-brand-300 dark:hover:bg-navy-900"
                  >
                    <MdOpenInNew className="h-4 w-4" aria-hidden />
                  </a>
                  <a
                    href={ev.fileUrl}
                    download={ev.originalName}
                    title="Download"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-50 dark:border-navy-600 dark:text-brand-300 dark:hover:bg-navy-900"
                  >
                    <MdDownload className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              ) : (
                <span className="shrink-0 text-xs text-gray-400">N/A</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
