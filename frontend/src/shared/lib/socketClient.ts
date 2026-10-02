import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketToken: string | null = null;

/** API root without the /api/v1 suffix, e.g. http://localhost:4000 */
export function getSocketBaseUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
  return base.replace(/\/api\/v1\/?$/, "") || window.location.origin;
}

/**
 * Shared singleton socket. Connects once per token; reconnects automatically
 * when the token changes (e.g. after logout/login). Consumers must remove
 * their own listeners on unmount (socket.off(...)) but must NOT disconnect —
 * the connection is shared (chat + notifications).
 */
export function initSocket(token?: string): Socket | null {
  if (typeof window === "undefined") return null;
  const authToken = token ?? localStorage.getItem("accessToken");
  if (!authToken) return null;

  if (socket && socketToken === authToken) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(getSocketBaseUrl(), {
    auth: { token: authToken },
    transports: ["websocket"],
  });
  socketToken = authToken;
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

/** Call on explicit logout to drop the authenticated connection. */
export function closeSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}
