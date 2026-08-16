import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

// Configure this to point to your API server (same origin, Socket.io shares the HTTP server)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8800";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: {
        token: getToken(),
      },
    });
  }
  return socket;
}

export function connectSocket(userId: number): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: getToken() };
    s.connect();
    s.on("connect", () => {
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
    socket.disconnect();
    socket = null;
  }
}