import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "services/api";
import { CITY_NAMES } from "constants/cities";
import {
  MdReport,
  MdCheckCircle,
  MdInfoOutline,
  MdLocationCity,
  MdSave,
  MdDrafts,
  MdDelete,
  MdPlayArrow,
  MdCloudDone,
} from "react-icons/md";

// Local mirror so an in-progress complaint survives refresh / accidental
// navigation even before the debounced server autosave fires.
const LS_KEY = "ccrp_report_draft";

const INCIDENT_TYPES = [
  "Phishing / Scam",
  "Financial Fraud",
  "Account Takeover",
  "Malware / Ransomware",
  "Harassment / Abuse",
  "Other",
];

const initialForm = {
  complainantName: "",
  email: "",
  phoneNumber: "",
  incidentType: INCIDENT_TYPES[0],
  city: "",
  incidentSummary: "",
  evidenceLinks: "",
};

const inputClass =
  "rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white";

const ReportCrime = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = React.useState(initialForm);
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(null);
  const [restored, setRestored] = React.useState(false);

  // Draft system state
  const [draftId, setDraftId] = React.useState(null);
  const [drafts, setDrafts] = React.useState([]);
  const [showDrafts, setShowDrafts] = React.useState(false);
  const [draftStatus, setDraftStatus] = React.useState("idle"); // idle | saving | saved
  const draftIdRef = React.useRef(null);
  const dirtyRef = React.useRef(false);
  const formRef = React.useRef(form);

  React.useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  const loadDrafts = React.useCallback(async () => {
    try {
      const data = await apiFetch("/drafts");
      setDrafts(Array.isArray(data?.drafts) ? data.drafts : []);
    } catch {
      setDrafts([]);
    }
  }, []);

  React.useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const hasContent = (f) =>
    !!(f.complainantName.trim() || f.incidentSummary.trim() || f.email.trim() || f.city);

  const persistDraft = React.useCallback(async (silent) => {
    if (!hasContent(form)) return;
    if (!silent) setDraftStatus("saving");
    try {
      const data = await apiFetch("/drafts", {
        method: "POST",
        body: { id: draftIdRef.current || undefined, data: form },
      });
      if (data?.draft?._id) setDraftId(data.draft._id);
      dirtyRef.current = false;
      setDraftStatus("saved");
      loadDrafts();
    } catch {
      setDraftStatus("idle");
    }
  }, [form, loadDrafts]);

  // Debounced auto-save whenever the form changes and has content.
  React.useEffect(() => {
    if (submitted || !hasContent(form)) return;
    dirtyRef.current = true;
    setDraftStatus("idle");
    const t = setTimeout(() => persistDraft(true), 1500);
    return () => clearTimeout(t);
  }, [form, submitted, persistDraft]);

  // Restore an in-progress complaint on mount: an explicit ?draft=<id> wins
  // (used by the Drafts management page), otherwise fall back to the local
  // autosave snapshot so nothing is lost on refresh / accidental navigation.
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const draftParam = searchParams.get("draft");
      if (draftParam) {
        try {
          const data = await apiFetch(`/drafts/${draftParam}`);
          if (!cancelled && data?.draft) {
            setForm({ ...initialForm, ...(data.draft.data || {}) });
            setDraftId(data.draft._id);
            setDraftStatus("saved");
          }
        } catch {
          /* draft no longer exists — ignore */
        }
        const next = new URLSearchParams(searchParams);
        next.delete("draft");
        setSearchParams(next, { replace: true });
        if (!cancelled) setRestored(true);
        return;
      }
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const snap = JSON.parse(raw);
          if (snap?.data && hasContent({ ...initialForm, ...snap.data })) {
            setForm({ ...initialForm, ...snap.data });
            if (snap.draftId) setDraftId(snap.draftId);
            setDraftStatus("saved");
          }
        }
      } catch {
        /* corrupt snapshot — ignore */
      }
      if (!cancelled) setRestored(true);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the working form to localStorage for instant refresh safety.
  React.useEffect(() => {
    if (!restored || submitted) return;
    try {
      if (hasContent(form)) {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({ data: form, draftId: draftIdRef.current })
        );
      } else {
        localStorage.removeItem(LS_KEY);
      }
    } catch {
      /* ignore storage quota errors */
    }
  }, [form, restored, submitted]);

  // Flush the latest snapshot synchronously right before the page unloads.
  React.useEffect(() => {
    const onBeforeUnload = () => {
      try {
        if (!submitted && hasContent(formRef.current)) {
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({ data: formRef.current, draftId: draftIdRef.current })
          );
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submitted]);

  const continueDraft = (d) => {
    setForm({ ...initialForm, ...(d.data || {}) });
    setDraftId(d._id);
    setShowDrafts(false);
    setErrors({});
    setDraftStatus("saved");
  };

  const removeDraft = async (id) => {
    try {
      await apiFetch(`/drafts/${id}`, { method: "DELETE" });
      if (id === draftIdRef.current) setDraftId(null);
      loadDrafts();
    } catch (err) {
      window.alert(err?.message || "Failed to delete draft");
    }
  };

  const startNew = () => {
    setForm(initialForm);
    setDraftId(null);
    setErrors({});
    setDraftStatus("idle");
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  };

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.complainantName.trim()) next.complainantName = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    if (!form.city) next.city = "Please select the city of the incident.";
    if (!form.incidentSummary.trim() || form.incidentSummary.trim().length < 20)
      next.incidentSummary = "Provide at least 20 characters describing the incident.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const evidenceLinks = form.evidenceLinks
      ? form.evidenceLinks.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    setSubmitting(true);
    try {
      const data = await apiFetch("/complaints", {
        method: "POST",
        body: {
          complainantName: form.complainantName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          incidentType: form.incidentType,
          city: form.city,
          incidentSummary: form.incidentSummary.trim(),
          evidenceLinks,
        },
      });
      setSubmitted(data?.complaint || { referenceId: "submitted" });
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      // Discard the working draft once the complaint is filed.
      if (draftIdRef.current) {
        try {
          await apiFetch(`/drafts/${draftIdRef.current}`, { method: "DELETE" });
        } catch {
          /* non-fatal */
        }
        setDraftId(null);
        loadDrafts();
      }
    } catch (err) {
      window.alert(err?.message || "Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-3 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-md shadow-shadow-500 dark:bg-navy-800">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300">
          <MdCheckCircle className="h-9 w-9" aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-navy-900 dark:text-white">
          Complaint submitted successfully
        </h2>
        <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
          Your complaint has been securely registered with the FIA Cyber Crime
          Wing. Save your reference number to track progress.
        </p>
        {submitted.referenceId ? (
          <p className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-5 py-3 font-mono text-lg font-bold tracking-wider text-brand-800 dark:border-brand-900/40 dark:bg-brand-900/10 dark:text-brand-300">
            {submitted.referenceId}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/admin/track-complaint")}
            className="rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Track this complaint
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmitted(null);
              setForm(initialForm);
            }}
            className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900"
          >
            File another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800 md:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
          <MdReport className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-navy-900 dark:text-white">
            Report a Cyber Crime
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Report phishing, fraud, account compromise, malware, or harassment.
            Your submission is sent securely to the FIA Cyber Crime Wing reporting
            desk under PECA 2016.
          </p>
        </div>
      </div>

      {/* Draft toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-150 bg-gray-50/70 p-3 dark:border-navy-700 dark:bg-navy-900/40">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {draftStatus === "saving" ? (
            <span className="flex items-center gap-1.5"><MdSave className="h-4 w-4 animate-pulse" /> Saving draft…</span>
          ) : draftStatus === "saved" ? (
            <span className="flex items-center gap-1.5 text-brand-700 dark:text-brand-400"><MdCloudDone className="h-4 w-4" /> Draft saved</span>
          ) : (
            <span className="flex items-center gap-1.5"><MdSave className="h-4 w-4" /> Auto-save enabled</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => persistDraft(false)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-800"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => setShowDrafts((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-800"
          >
            <MdDrafts className="h-4 w-4" /> My Drafts
            {drafts.length > 0 ? (
              <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">{drafts.length}</span>
            ) : null}
          </button>
          {(draftId || hasContent(form)) && (
            <button
              type="button"
              onClick={startNew}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:text-navy-900 dark:hover:text-white"
            >
              New
            </button>
          )}
        </div>
      </div>

      {showDrafts && (
        <div className="mt-3 rounded-xl border border-gray-150 bg-white p-3 dark:border-navy-700 dark:bg-navy-900/40">
          {drafts.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-gray-500">No saved drafts yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/5">
              {drafts.map((d) => (
                <li key={d._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                      {d.title || "Untitled draft"}
                      {d._id === draftId ? (
                        <span className="ml-2 rounded bg-brand-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:text-brand-400">Editing</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated {new Date(d.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => continueDraft(d)}
                      className="flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <MdPlayArrow className="h-4 w-4" /> Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDraft(d._id)}
                      aria-label="Delete draft"
                      className="rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900 dark:text-red-300 dark:hover:bg-navy-800"
                    >
                      <MdDelete className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="mt-6 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
        <Field label="Complainant name" required error={errors.complainantName}>
          <input
            type="text"
            placeholder="Full name"
            value={form.complainantName}
            onChange={update("complainantName")}
            className={inputClass}
          />
        </Field>

        <Field label="Email address" required error={errors.email}>
          <input
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={update("email")}
            className={inputClass}
          />
        </Field>

        <Field label="Phone number" error={errors.phoneNumber}>
          <input
            type="tel"
            placeholder="+92 300 1234567"
            value={form.phoneNumber}
            onChange={update("phoneNumber")}
            className={inputClass}
          />
        </Field>

        <Field label="City of incident" required error={errors.city} icon={MdLocationCity}>
          <select value={form.city} onChange={update("city")} className={inputClass}>
            <option value="">Select a city…</option>
            {CITY_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Incident type" required>
          <select
            value={form.incidentType}
            onChange={update("incidentType")}
            className={inputClass}
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <div className="hidden md:block" aria-hidden />

        <Field
          label="Incident summary"
          required
          error={errors.incidentSummary}
          className="md:col-span-2"
        >
          <textarea
            rows="4"
            placeholder="Describe what happened, when it occurred, and any known suspects or evidence."
            value={form.incidentSummary}
            onChange={update("incidentSummary")}
            className={inputClass}
          />
        </Field>

        <Field label="Evidence links (optional)" className="md:col-span-2">
          <input
            type="text"
            placeholder="Comma-separated URLs to screenshots, logs, or files"
            value={form.evidenceLinks}
            onChange={update("evidenceLinks")}
            className={inputClass}
          />
        </Field>

        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 md:col-span-2 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
          <MdInfoOutline className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            You can upload files as evidence from the Evidence page after
            submitting. Never share OTPs or passwords in the summary.
          </span>
        </div>

        <div className="flex justify-end md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-7 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-600/30 transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
};

function Field({ label, required, error, children, className = "", icon: Icon }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {Icon ? <Icon className="h-4 w-4 text-gray-400" aria-hidden /> : null}
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default ReportCrime;
