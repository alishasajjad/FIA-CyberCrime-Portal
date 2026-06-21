import { io } from "socket.io-client";
import { API_BASE } from "services/api";

// Socket origin is the API base without the trailing /api segment.
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

let socket = null;

/**
 * Connect (or reuse) the authenticated Socket.IO connection. Safe to call
 * repeatedly — returns the existing socket. No-op without an auth token.
 */
export function connectSocket() {
  const token =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  if (!token) return null;

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Subscribe to a server event. Returns an unsubscribe function.
 * Establishes the connection lazily so any component can listen safely.
 */
export function onSocket(event, handler) {
  const s = connectSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => {
    try {
      s.off(event, handler);
    } catch {
      /* socket may already be torn down */
    }
  };
}

/** Tell the server we're viewing a complaint (joins its room). */
export function subscribeComplaint(id) {
  const s = connectSocket();
  if (s && id) s.emit("complaint:subscribe", id);
}

export function unsubscribeComplaint(id) {
  const s = getSocket();
  if (s && id) s.emit("complaint:unsubscribe", id);
}
