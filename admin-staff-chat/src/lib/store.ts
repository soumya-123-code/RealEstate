import { create } from "zustand";
import type { Chat, Message, User, TypingPayload, CallPayload, CallAnswerPayload, ICECandidatePayload, CallType } from "./types";

interface ChatState {
  // ── Auth ──
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;

  // ── Chats ──
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  updateChatInList: (chatId: number, data: Partial<Chat>) => void;

  // ── Active Chat ──
  activeChatId: number | null;
  setActiveChatId: (id: number | null) => void;
  activeMessages: Message[];
  setActiveMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;

  // ── Typing ──
  typingUsers: Record<number, TypingPayload>;
  setTyping: (payload: TypingPayload) => void;

  // ── Online Users ──
  onlineUserIds: string[];
  setOnlineUsers: (ids: string[]) => void;
  isUserOnline: (userId: number) => boolean;

  // ── UI ──
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mobileShowMessages: boolean;
  setMobileShowMessages: (show: boolean) => void;
  showNewChat: boolean;
  setShowNewChat: (show: boolean) => void;
  activeTab: "all" | "unread" | "customers" | "staff";
  setActiveTab: (tab: "all" | "unread" | "customers" | "staff") => void;

  // ── Call State ──
  activeCall: {
    callType: CallType;
    remoteUserId: number;
    remoteUserName: string;
    remoteUserAvatar?: string | null;
    isIncoming: boolean;
  } | null;
  setActiveCall: (call: ChatState["activeCall"]) => void;
  callStatus: "idle" | "ringing" | "connected" | "ended";
  setCallStatus: (status: ChatState["callStatus"]) => void;

  // ── Loading ──
  chatsLoading: boolean;
  setChatsLoading: (loading: boolean) => void;
  messagesLoading: boolean;
  setMessagesLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // ── Auth ──
  currentUser: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) =>
    set({ currentUser: user, token, isAuthenticated: true }),
  logout: () =>
    set({
      currentUser: null,
      token: null,
      isAuthenticated: false,
      chats: [],
      activeChatId: null,
      activeMessages: [],
      activeCall: null,
      callStatus: "idle",
    }),

  // ── Chats ──
  chats: [],
  setChats: (chats) => set({ chats }),
  updateChatInList: (chatId, data) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, ...data } : c
      ),
    })),

  // ── Active Chat ──
  activeChatId: null,
  setActiveChatId: (id) =>
    set({ activeChatId: id, mobileShowMessages: id !== null }),
  activeMessages: [],
  setActiveMessages: (msgs) => set({ activeMessages: msgs }),
  addMessage: (msg) =>
    set((s) => {
      const exists = s.activeMessages.some((m) => m.id === msg.id);
      if (exists) return s;
      return { activeMessages: [...s.activeMessages, msg] };
    }),

  // ── Typing ──
  typingUsers: {},
  setTyping: (payload) =>
    set((s) => {
      const next = { ...s.typingUsers };
      if (payload.isTyping) {
        next[payload.chatId] = payload;
      } else {
        delete next[payload.chatId];
      }
      return { typingUsers: next };
    }),

  // ── Online Users ──
  onlineUserIds: [],
  setOnlineUsers: (ids) => set({ onlineUserIds: ids }),
  isUserOnline: (userId) => get().onlineUserIds.includes(String(userId)),

  // ── UI ──
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  mobileShowMessages: false,
  setMobileShowMessages: (show) => set({ mobileShowMessages: show }),
  showNewChat: false,
  setShowNewChat: (show) => set({ showNewChat: show }),
  activeTab: "all",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Call State ──
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),
  callStatus: "idle",
  setCallStatus: (status) => set({ callStatus: status }),

  // ── Loading ──
  chatsLoading: false,
  setChatsLoading: (loading) => set({ chatsLoading: loading }),
  messagesLoading: false,
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),
}));