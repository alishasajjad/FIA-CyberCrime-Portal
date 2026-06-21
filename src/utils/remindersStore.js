import { useSyncExternalStore } from "react";
import { apiFetch } from "services/api";
import { connectSocket, onSocket } from "services/socket";

// Shared single-source store for officer reminders (calendar events). Reminder
// due/overdue alerts arrive over Socket.IO; a slow poll remains as fallback.
let state = { reminders: [], loaded: false };
const listeners = new Set();
let timer = null;
let socketCleanups = [];
const POLL_MS = 60000;

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
  connectSocket();
  // A reminder due/overdue alert is delivered as a notification carrying a
  // reminderId — refresh the calendar store when one arrives.
  socketCleanups.push(
    onSocket("notification:new", (payload) => {
      if (payload?.notification?.meta?.reminderId) refreshReminders();
    })
  );
  socketCleanups.push(onSocket("connect", refreshReminders));
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  socketCleanups.forEach((fn) => fn());
  socketCleanups = [];
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
