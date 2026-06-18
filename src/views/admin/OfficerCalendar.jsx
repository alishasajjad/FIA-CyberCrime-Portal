import React from "react";
import { apiFetch } from "services/api";
import { useReminders, refreshReminders } from "utils/remindersStore";
import { REMINDER_CATEGORIES, categoryOf } from "constants/reminderCategories";
import { StatCard, SectionCard, EmptyState } from "components/ui";
import {
  MdChevronLeft,
  MdChevronRight,
  MdAdd,
  MdSearch,
  MdClose,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdDelete,
  MdEdit,
  MdEventNote,
  MdAlarm,
  MdTaskAlt,
  MdToday,
} from "react-icons/md";

const VIEWS = ["month", "week", "agenda"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameDay = (a, b) => dayKey(a) === dayKey(b);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const toLocalInput = (d) => {
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60000).toISOString().slice(0, 16);
};

function emptyForm() {
  const due = new Date();
  due.setMinutes(0, 0, 0);
  due.setHours(due.getHours() + 1);
  return {
    title: "",
    category: "EvidenceReview",
    dueAt: toLocalInput(due),
    notes: "",
    complaintRef: "",
    completed: false,
  };
}

export default function OfficerCalendar() {
  const { reminders } = useReminders();
  const [view, setView] = React.useState("month");
  const [cursor, setCursor] = React.useState(() => new Date());
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("All");
  const [modal, setModal] = React.useState(null); // { id?, form }
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    refreshReminders();
  }, []);

  const now = new Date();

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return reminders.filter((r) => {
      if (catFilter !== "All" && r.category !== catFilter) return false;
      if (!q) return true;
      return (
        String(r.title || "").toLowerCase().includes(q) ||
        String(r.notes || "").toLowerCase().includes(q) ||
        String(r.complaintRef || "").toLowerCase().includes(q)
      );
    });
  }, [reminders, search, catFilter]);

  const byDay = React.useMemo(() => {
    const m = {};
    filtered.forEach((r) => {
      if (!r.dueAt) return;
      const k = dayKey(new Date(r.dueAt));
      (m[k] = m[k] || []).push(r);
    });
    Object.values(m).forEach((list) => list.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)));
    return m;
  }, [filtered]);

  // stats
  const pending = reminders.filter((r) => !r.completed);
  const overdue = pending.filter((r) => new Date(r.dueAt) < now).length;
  const upcoming = pending.filter((r) => {
    const t = new Date(r.dueAt);
    return t >= now && t <= addDays(startOfDay(now), 7);
  }).length;
  const completedCount = reminders.filter((r) => r.completed).length;

  const isOverdue = (r) => !r.completed && new Date(r.dueAt) < now;

  const openCreate = (date) => {
    const f = emptyForm();
    if (date) {
      const d = new Date(date);
      d.setHours(10, 0, 0, 0);
      f.dueAt = toLocalInput(d);
    }
    setModal({ form: f });
  };
  const openEdit = (r) => {
    setModal({
      id: r._id,
      form: {
        title: r.title || "",
        category: r.category || "Custom",
        dueAt: toLocalInput(r.dueAt),
        notes: r.notes || "",
        complaintRef: r.complaintRef || "",
        completed: !!r.completed,
      },
    });
  };

  const saveModal = async () => {
    const f = modal.form;
    if (!f.title.trim() || !f.dueAt) {
      window.alert("Title and date/time are required.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: f.title.trim(),
        category: f.category,
        dueAt: new Date(f.dueAt).toISOString(),
        notes: f.notes.trim(),
        complaintRef: f.complaintRef.trim(),
      };
      if (modal.id) {
        await apiFetch(`/reminders/${modal.id}`, { method: "PATCH", body: { ...body, completed: f.completed } });
      } else {
        await apiFetch("/reminders", { method: "POST", body });
      }
      await refreshReminders();
      setModal(null);
    } catch (err) {
      window.alert(err?.message || "Failed to save reminder");
    } finally {
      setBusy(false);
    }
  };

  const toggleComplete = async (r) => {
    try {
      await apiFetch(`/reminders/${r._id}`, { method: "PATCH", body: { completed: !r.completed } });
      await refreshReminders();
    } catch (err) {
      window.alert(err?.message || "Update failed");
    }
  };

  const removeReminder = async (r) => {
    if (!window.confirm("Delete this reminder?")) return;
    try {
      await apiFetch(`/reminders/${r._id}`, { method: "DELETE" });
      await refreshReminders();
      setModal(null);
    } catch (err) {
      window.alert(err?.message || "Delete failed");
    }
  };

  const shift = (dir) => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else if (view === "week") setCursor(addDays(cursor, dir * 7));
    else setCursor(addDays(cursor, dir * 7));
  };

  const periodLabel =
    view === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
      ? `Week of ${weekStart(cursor).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : "Agenda";

  return (
    <div className="mt-3 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-400">
            <MdEventNote className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Investigation Calendar
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Schedule evidence reviews, meetings, deadlines, and follow-ups for
              your cases.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openCreate(null)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <MdAdd className="h-4 w-4" aria-hidden /> New Event
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdEventNote} label="Pending Events" value={pending.length} accent="brand" />
        <StatCard icon={MdAlarm} label="Overdue" value={overdue} accent="red" />
        <StatCard icon={MdToday} label="Next 7 Days" value={upcoming} accent="amber" />
        <StatCard icon={MdTaskAlt} label="Completed" value={completedCount} accent="navy" />
      </div>

      <SectionCard>
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous" className="rounded-lg border border-gray-200 p-2 text-navy-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
              <MdChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setCursor(new Date())} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
              Today
            </button>
            <button type="button" onClick={() => shift(1)} aria-label="Next" className="rounded-lg border border-gray-200 p-2 text-navy-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
              <MdChevronRight className="h-5 w-5" />
            </button>
            <span className="ml-2 text-sm font-bold text-navy-900 dark:text-white">{periodLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <MdSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                className="w-40 rounded-lg border border-gray-200 bg-lightPrimary py-2 pl-8 pr-2 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white sm:w-48"
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-lightPrimary px-2 py-2 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              <option value="All">All categories</option>
              {REMINDER_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-navy-600">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    view === v ? "bg-brand-700 text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-900"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === "month" && (
          <MonthGrid cursor={cursor} byDay={byDay} now={now} isOverdue={isOverdue} onDay={openCreate} onEvent={openEdit} />
        )}
        {view === "week" && (
          <WeekList cursor={cursor} byDay={byDay} now={now} isOverdue={isOverdue} onDay={openCreate} onEvent={openEdit} onToggle={toggleComplete} />
        )}
        {view === "agenda" && (
          <Agenda reminders={filtered} now={now} isOverdue={isOverdue} onEvent={openEdit} onToggle={toggleComplete} />
        )}
      </SectionCard>

      {modal && (
        <EventModal
          modal={modal}
          setModal={setModal}
          busy={busy}
          onSave={saveModal}
          onDelete={removeReminder}
        />
      )}
    </div>
  );
}

function weekStart(d) {
  return addDays(startOfDay(d), -d.getDay());
}

function EventChip({ r, isOverdue, onClick }) {
  const cat = categoryOf(r.category);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(r);
      }}
      title={r.title}
      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${cat.chip} ${
        r.completed ? "line-through opacity-60" : ""
      } ${isOverdue(r) ? "ring-1 ring-red-400" : ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cat.dot}`} />
      <span className="truncate">{r.title}</span>
    </button>
  );
}

function MonthGrid({ cursor, byDay, now, isOverdue, onDay, onEvent }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = addDays(first, -first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-navy-700">
          {DAY_LABELS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = sameDay(day, now);
            const events = byDay[dayKey(day)] || [];
            return (
              <button
                type="button"
                key={i}
                onClick={() => onDay(day)}
                className={`min-h-[96px] border-b border-r border-gray-100 p-1.5 text-left align-top transition hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-navy-700 dark:hover:bg-navy-900/50 ${
                  inMonth ? "" : "bg-gray-50/50 dark:bg-navy-900/30"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isToday ? "bg-brand-700 text-white" : inMonth ? "text-navy-900 dark:text-white" : "text-gray-400"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 3).map((r) => (
                    <EventChip key={r._id} r={r} isOverdue={isOverdue} onClick={onEvent} />
                  ))}
                  {events.length > 3 ? (
                    <span className="block px-1 text-[10px] font-semibold text-gray-400">+{events.length - 3} more</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekList({ cursor, byDay, now, isOverdue, onDay, onEvent, onToggle }) {
  const start = weekStart(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
      {days.map((day) => {
        const events = byDay[dayKey(day)] || [];
        const isToday = sameDay(day, now);
        return (
          <div key={dayKey(day)} className={`rounded-xl border p-2 ${isToday ? "border-brand-400 bg-brand-50/40 dark:border-brand-500 dark:bg-navy-900" : "border-gray-150 dark:border-navy-700"}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-navy-900 dark:text-white">
                {DAY_LABELS[day.getDay()]} {day.getDate()}
              </span>
              <button type="button" onClick={() => onDay(day)} className="text-gray-400 hover:text-brand-700" aria-label="Add event">
                <MdAdd className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {events.length === 0 ? (
                <p className="px-1 py-2 text-[11px] text-gray-400">No events</p>
              ) : (
                events.map((r) => (
                  <AgendaRow key={r._id} r={r} isOverdue={isOverdue} onEvent={onEvent} onToggle={onToggle} compact />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Agenda({ reminders, now, isOverdue, onEvent, onToggle }) {
  const upcoming = [...reminders]
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const done = reminders.filter((r) => r.completed);
  if (reminders.length === 0) {
    return <EmptyState icon={MdEventNote} title="No events scheduled" message="Create your first investigation event with the New Event button." />;
  }
  return (
    <div className="space-y-2">
      {upcoming.map((r) => (
        <AgendaRow key={r._id} r={r} isOverdue={isOverdue} onEvent={onEvent} onToggle={onToggle} showDate />
      ))}
      {done.length > 0 ? (
        <p className="px-1 pt-4 text-xs font-bold uppercase tracking-wider text-gray-400">Completed</p>
      ) : null}
      {done.map((r) => (
        <AgendaRow key={r._id} r={r} isOverdue={isOverdue} onEvent={onEvent} onToggle={onToggle} showDate />
      ))}
    </div>
  );
}

function AgendaRow({ r, isOverdue, onEvent, onToggle, showDate, compact }) {
  const cat = categoryOf(r.category);
  const overdue = isOverdue(r);
  return (
    <div className={`flex items-center gap-2 rounded-lg border-l-4 ${cat.bar} bg-gray-50/70 p-2 dark:bg-navy-900/40 ${overdue ? "ring-1 ring-red-300 dark:ring-red-900" : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(r)}
        aria-label={r.completed ? "Mark pending" : "Mark complete"}
        className={`shrink-0 ${r.completed ? "text-green-600" : "text-gray-300 hover:text-brand-600 dark:text-navy-600"}`}
      >
        {r.completed ? <MdCheckCircle className="h-5 w-5" /> : <MdRadioButtonUnchecked className="h-5 w-5" />}
      </button>
      <button type="button" onClick={() => onEvent(r)} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-sm font-semibold ${r.completed ? "text-gray-400 line-through" : "text-navy-900 dark:text-white"}`}>
          {r.title}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500 dark:text-gray-400">
          <span className={`rounded px-1.5 py-0.5 ${cat.chip}`}>{cat.label}</span>
          {showDate ? <span>{new Date(r.dueAt).toLocaleDateString()}</span> : null}
          <span>{fmtTime(r.dueAt)}</span>
          {r.complaintRef ? <span className="font-mono">· {r.complaintRef}</span> : null}
          {overdue ? <span className="font-bold text-red-600 dark:text-red-400">· Overdue</span> : null}
        </p>
      </button>
      {!compact ? (
        <button type="button" onClick={() => onEvent(r)} className="shrink-0 text-gray-400 hover:text-brand-700" aria-label="Edit">
          <MdEdit className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function EventModal({ modal, setModal, busy, onSave, onDelete }) {
  const f = modal.form;
  const set = (k, v) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }));
  const input =
    "w-full rounded-xl border border-gray-200 bg-lightPrimary p-2.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-navy-700 dark:bg-navy-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white">
            {modal.id ? "Edit Event" : "New Event"}
          </h3>
          <button type="button" onClick={() => setModal(null)} aria-label="Close" className="text-gray-400 hover:text-navy-900 dark:hover:text-white">
            <MdClose className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Title</label>
            <input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Review fraud evidence" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Category</label>
              <select className={input} value={f.category} onChange={(e) => set("category", e.target.value)}>
                {REMINDER_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Due</label>
              <input type="datetime-local" className={input} value={f.dueAt} onChange={(e) => set("dueAt", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Linked case (optional)</label>
            <input className={input} value={f.complaintRef} onChange={(e) => set("complaintRef", e.target.value)} placeholder="Reference ID e.g. CR-2026-..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Notes</label>
            <textarea rows="3" className={input} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional details" />
          </div>
          {modal.id ? (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input type="checkbox" checked={f.completed} onChange={(e) => set("completed", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              Mark as completed
            </label>
          ) : null}
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          {modal.id ? (
            <button type="button" onClick={() => onDelete({ _id: modal.id })} className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900 dark:text-red-300 dark:hover:bg-navy-900">
              <MdDelete className="h-4 w-4" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-navy-600 dark:text-white dark:hover:bg-navy-900">
              Cancel
            </button>
            <button type="button" onClick={onSave} disabled={busy} className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-bold text-white hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
