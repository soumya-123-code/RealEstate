import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

// Use an explicit Socket.IO origin when the chat app and API are separate.
// Otherwise, same-origin deployment works behind a reverse proxy without a
// production localhost fallback.
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:8800");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      auth: { token: getToken() },
    });
  }
  return socket;
}

export function connectSocket(userId: number): Socket {
  const s = getSocket();
  s.auth = { token: getToken() };

  if (!s.connected) {
    s.connect();
    s.once("connect", () => {
      console.log("[Socket] Connected:", s.id);
      s.emit("newUser", userId);
    });
  } else {
    s.emit("newUser", userId);
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
