import { useSyncExternalStore } from "react";
import { apiFetch } from "services/api";

// Shared single-source poller for officer reminders (calendar events). Mirrors
// notificationsStore so the calendar, alert center, and officer dashboard all
// stay in sync without each running its own interval.
let state = { reminders: [], loaded: false };
const listeners = new Set();
let timer = null;
const POLL_MS = 30000;

function emit() {
  listeners.forEach((l) => l());
}

export async function refreshReminders() {
  if (typeof localStorage !== "undefined" && !localStorage.getItem("token")) {
    state = { reminders: [], loaded: true };
    emit();
    return;
  }
  try {
    const data = await apiFetch("/reminders");
    state = {
      reminders: Array.isArray(data?.reminders) ? data.reminders : [],
      loaded: true,
    };
    emit();
  } catch {
    // keep prior state on transient/permission errors (e.g. non-officer roles)
    if (!state.loaded) {
      state = { reminders: [], loaded: true };
      emit();
    }
  }
}

function start() {
  if (timer) return;
  refreshReminders();
  timer = setInterval(refreshReminders, POLL_MS);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function subscribe(cb) {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) stop();
  };
}

export function useReminders() {
  return useSyncExternalStore(subscribe, () => state);
}
