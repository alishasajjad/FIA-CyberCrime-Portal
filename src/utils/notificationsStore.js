import { useSyncExternalStore } from "react";
import { apiFetch } from "services/api";

// Single shared notifications poller. Components subscribe via the hooks
// below, so the app polls the real /notifications endpoint only once
// regardless of how many badges/menus are mounted.
let state = { notifications: [], unread: 0, loaded: false };
const listeners = new Set();
let timer = null;
const POLL_MS = 10000;

function emit() {
  listeners.forEach((l) => l());
}

function setState(next) {
  state = { ...state, ...next };
  emit();
}

export async function refreshNotifications() {
  if (typeof localStorage !== "undefined" && !localStorage.getItem("token")) {
    if (state.notifications.length || state.unread || !state.loaded) {
      setState({ notifications: [], unread: 0, loaded: true });
    }
    return;
  }
  try {
    const data = await apiFetch("/notifications");
    const list = Array.isArray(data?.notifications) ? data.notifications : [];
    setState({
      notifications: list,
      unread: list.filter((n) => !n.read).length,
      loaded: true,
    });
  } catch {
    /* keep last known state on transient errors */
  }
}

function start() {
  if (timer) return;
  refreshNotifications();
  timer = setInterval(refreshNotifications, POLL_MS);
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

export function useNotifications() {
  return useSyncExternalStore(subscribe, () => state);
}

export function useUnreadCount() {
  return useSyncExternalStore(
    subscribe,
    () => state.unread
  );
}
