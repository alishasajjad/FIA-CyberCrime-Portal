import React from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "services/api";
import { SectionCard, CardSkeleton, EmptyState } from "components/ui";
import {
  MdRule,
  MdPlayCircle,
  MdSave,
  MdOpenInNew,
  MdInfoOutline,
} from "react-icons/md";

const SEVERITIES = ["Critical", "High", "Medium", "Low"];

export default function EscalationRules() {
  const [config, setConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [runResult, setRunResult] = React.useState(null);
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await apiFetch("/escalations/config");
      setConfig(d.config);
    } catch (err) {
      setError(err?.message || "Failed to load configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const setField = (k, v) => setConfig((c) => ({ ...c, [k]: v }));
  const setSla = (k, v) => setConfig((c) => ({ ...c, slaHours: { ...c.slaHours, [k]: v } }));
  const setTrigger = (k, v) => setConfig((c) => ({ ...c, triggers: { ...c.triggers, [k]: v } }));

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const d = await apiFetch("/escalations/config", {
        method: "PUT",
        body: {
          enabled: config.enabled,
          autoReassign: config.autoReassign,
          notifyAdmins: config.notifyAdmins,
          notifyOfficers: config.notifyOfficers,
          warnBeforeHours: Number(config.warnBeforeHours),
          reminderIntervalHours: Number(config.reminderIntervalHours),
          maxLevel: Number(config.maxLevel),
          slaHours: config.slaHours,
          triggers: config.triggers,
        },
      });
      setConfig(d.config);
      setMsg("Configuration saved.");
    } catch (err) {
      setMsg(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setRunResult(null);
    setMsg("");
    try {
      const d = await apiFetch("/escalations/run", { method: "POST" });
      setRunResult(d.summary);
    } catch (err) {
      setMsg(err?.message || "Run failed.");
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-lightPrimary px-3 py-2 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white";

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdRule className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">Escalation Rules</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Configure SLA thresholds and automatic escalation behavior for overdue complaints.
            </p>
          </div>
        </div>
        <Link to="/admin/escalations" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
          Escalation Dashboard <MdOpenInNew className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <CardSkeleton lines={8} />
      ) : error ? (
        <EmptyState icon={MdRule} title="Could not load configuration" message={error} />
      ) : config ? (
        <>
          <SectionCard
            title="Engine Status"
            action={
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <input type="checkbox" checked={config.enabled} onChange={(e) => setField("enabled", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                {config.enabled ? "Enabled" : "Disabled"}
              </label>
            }
          >
            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
              <MdInfoOutline className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                The engine runs automatically in the background. Complaints breaching their SLA are escalated, logged
                to history, and (optionally) reassigned to a senior officer. Existing complaint workflows are unaffected.
              </span>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="SLA Thresholds (hours)" subtitle="Time before a complaint of each severity is overdue">
              <div className="grid grid-cols-2 gap-4">
                {SEVERITIES.map((s) => (
                  <label key={s} className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                    {s}
                    <input
                      type="number"
                      min="1"
                      value={config.slaHours?.[s] ?? ""}
                      onChange={(e) => setSla(s, e.target.value)}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Escalation Behavior">
              <div className="space-y-4">
                <Toggle label="Auto-reassign to senior officer" hint="If off, escalated cases go to the queue for manual assignment." checked={config.autoReassign} onChange={(v) => setField("autoReassign", v)} />
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">Max escalation level
                    <input type="number" min="1" max="10" value={config.maxLevel} onChange={(e) => setField("maxLevel", e.target.value)} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">Reminder interval (hrs)
                    <input type="number" min="1" value={config.reminderIntervalHours} onChange={(e) => setField("reminderIntervalHours", e.target.value)} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">SLA warning before (hrs)
                    <input type="number" min="0" value={config.warnBeforeHours} onChange={(e) => setField("warnBeforeHours", e.target.value)} className={inputCls} />
                  </label>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Escalation Triggers" subtitle="Conditions that qualify a complaint for escalation">
              <div className="space-y-3">
                <Toggle label="Unassigned beyond SLA" checked={config.triggers?.unassigned} onChange={(v) => setTrigger("unassigned", v)} />
                <Toggle label="Not updated beyond SLA" checked={config.triggers?.notUpdated} onChange={(v) => setTrigger("notUpdated", v)} />
                <Toggle label="Investigation inactive beyond SLA" checked={config.triggers?.inactive} onChange={(v) => setTrigger("inactive", v)} />
              </div>
            </SectionCard>

            <SectionCard title="Notifications">
              <div className="space-y-3">
                <Toggle label="Notify administrators on escalation" checked={config.notifyAdmins} onChange={(v) => setField("notifyAdmins", v)} />
                <Toggle label="Notify officers (assignments & SLA warnings)" checked={config.notifyOfficers} onChange={(v) => setField("notifyOfficers", v)} />
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50">
                <MdSave className="h-4 w-4" /> {saving ? "Saving…" : "Save Configuration"}
              </button>
              <button type="button" onClick={runNow} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
                <MdPlayCircle className="h-4 w-4" /> Run engine now
              </button>
            </div>
            {msg ? <span className="text-sm font-medium text-brand-700 dark:text-brand-400">{msg}</span> : null}
          </div>

          {runResult ? (
            <SectionCard title="Last Run Summary">
              {runResult.skipped ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">Engine skipped: {runResult.reason}.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  {[
                    ["Processed", runResult.processed],
                    ["Escalated", runResult.escalated],
                    ["Reassigned", runResult.reassigned],
                    ["Queued", runResult.queued],
                    ["Warned", runResult.warned],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-gray-150 bg-gray-50/60 p-3 text-center dark:border-navy-700 dark:bg-navy-900/40">
                      <p className="text-lg font-bold text-navy-900 dark:text-white">{v ?? 0}</p>
                      <p className="text-xs text-gray-500">{k}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
      <span>
        <span className="text-sm font-semibold text-navy-900 dark:text-white">{label}</span>
        {hint ? <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span> : null}
      </span>
    </label>
  );
}
