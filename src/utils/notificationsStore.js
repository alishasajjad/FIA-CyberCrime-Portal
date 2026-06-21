import { useSyncExternalStore } from "react";
import { apiFetch } from "services/api";
import { connectSocket, onSocket } from "services/socket";

// Single shared notifications store. Updates arrive instantly over Socket.IO;
// a slow poll remains as a safe fallback when the socket is unavailable.
let state = { notifications: [], unread: 0, loaded: false };
const listeners = new Set();
let timer = null;
let socketCleanups = [];
const POLL_MS = 30000;

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
  // Instant delivery + catch-up on (re)connect.
  connectSocket();
  socketCleanups.push(onSocket("notification:new", refreshNotifications));
  socketCleanups.push(onSocket("connect", refreshNotifications));
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

export function useNotifications() {
  return useSyncExternalStore(subscribe, () => state);
}

export function useUnreadCount() {
  return useSyncExternalStore(
    subscribe,
    () => state.unread
  );
}
