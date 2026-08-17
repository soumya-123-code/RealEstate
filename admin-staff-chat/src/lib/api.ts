// ─── API Client for existing Express backend ─────────────────────
import type { Chat, LoginResponse, Message } from "./types";

// Configure this to point to your API server
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800/api";

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("chat_token", token);
    } else {
      localStorage.removeItem("chat_token");
    }
  }
}

export function getToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("chat_token");
  }
  return authToken;
}

export function getUser(): { id: number; role: string; username: string; avatar?: string } | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("chat_user");
  return data ? JSON.parse(data) : null;
}

export function setUser(user: object) {
  if (typeof window !== "undefined") {
    localStorage.setItem("chat_user", JSON.stringify(user));
  }
}

export function clearAuth() {
  setToken(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem("chat_user");
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────
function isEmail(value: string): boolean {
  return value.includes("@");
}

// ─── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  /** Request OTP (email or phone login step 1). Returns { message, devOtp?, ... } */
  requestOtp: (identifier: string) =>
    request<{ message: string; devOtp?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),

  /** Password-based login for admin/staff. */
  loginWithPassword: (identifier: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),

  /** Verify OTP — correctly sends email or phone field based on identifier. */
  verifyOtp: (identifier: string, otp: string) =>
    request<LoginResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(isEmail(identifier) ? { email: identifier, otp } : { phone: identifier, otp }),
    }),

  me: () =>
    request<{ user: LoginResponse["user"] }>("/auth/me"),
};

// ─── Chat ─────────────────────────────────────────────────────────
export const chatApi = {
  list: () => request<Chat[]>("/chats"),

  get: (chatId: number) => request<Chat & { messages: Message[] }>(`/chats/${chatId}`),

  create: (receiverId: number) =>
    request<Chat>("/chats", {
      method: "POST",
      body: JSON.stringify({ receiverId }),
    }),

  markRead: (chatId: number) =>
    request<{ message: string }>(`/chats/read/${chatId}`, {
      method: "PUT",
    }),
};

// ─── Messages ─────────────────────────────────────────────────────
export const messageApi = {
  send: (chatId: number, text: string) =>
    request<Message>(`/messages/${chatId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

// ─── Users (for starting new conversations) ───────────────────────
export const usersApi = {
  list: (role?: string) => {
    const q = role ? `?role=${role}` : "";
    return request<{ users: { id: number; username: string; email: string; avatar?: string; role: string }[] }>(`/users${q}`);
  },
};