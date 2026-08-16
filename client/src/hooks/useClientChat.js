import { useState, useEffect, useCallback, useRef } from "react";
import apiRequest from "../lib/apiRequest";
import { useSocket } from "../context/SocketContext";

/**
 * useClientChat
 *
 * React hook for the client-side chat experience.
 * Uses the existing SocketContext for socket + online status + typing.
 * Handles REST API calls for chats and messages.
 *
 * @param {object} currentUser - The logged-in user from AuthContext
 */
export function useClientChat(currentUser) {
  const { socket, isUserOnline, emitTyping, typingUsers, setActiveChatId, clearChatNotification } =
    useSocket();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatIdLocal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // ── Fetch all chats ─────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    if (!currentUser) return;
    setLoadingChats(true);
    try {
      const res = await apiRequest.get("/chats");
      setChats(res.data || []);
    } catch (e) {
      console.error("fetchChats:", e);
    } finally {
      setLoadingChats(false);
    }
  }, [currentUser]);

  // ── Open a chat and load messages ────────────────────────────────────────
  const openChat = useCallback(
    async (chatId) => {
      const numId = Number(chatId);
      setActiveChatIdLocal(numId);
      setActiveChatId(numId); // sync with SocketContext for unread tracking
      clearChatNotification(numId);
      setLoadingMessages(true);
      try {
        const res = await apiRequest.get(`/chats/${numId}`);
        setMessages(res.data?.messages || []);
        // Mark hasSeen in local state
        setChats((prev) =>
          prev.map((c) => (c.id === numId ? { ...c, hasSeen: true } : c))
        );
      } catch (e) {
        console.error("openChat:", e);
      } finally {
        setLoadingMessages(false);
      }
    },
    [setActiveChatId, clearChatNotification]
  );

  // ── Close chat ───────────────────────────────────────────────────────────
  const closeChat = useCallback(() => {
    setActiveChatIdLocal(null);
    setActiveChatId(null);
    setMessages([]);
  }, [setActiveChatId]);

  // ── Start or find existing chat with a receiver ──────────────────────────
  const startChatWith = useCallback(
    async (receiverId) => {
      if (!currentUser) return null;
      try {
        const res = await apiRequest.post("/chats", { receiverId });
        const chat = res.data;
        setChats((prev) => {
          const exists = prev.find((c) => c.id === chat.id);
          return exists ? prev : [chat, ...prev];
        });
        openChat(chat.id);
        return chat;
      } catch (e) {
        console.error("startChatWith:", e);
        return null;
      }
    },
    [currentUser, openChat]
  );

  // ── Send a message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      if (!activeChatId || !text.trim() || !currentUser) return;

      setSendingMessage(true);
      try {
        const res = await apiRequest.post(`/messages/${activeChatId}`, { text });
        const msg = res.data;

        // Optimistic update
        setMessages((prev) => [...prev, msg]);
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? { ...c, lastMessage: text, updatedAt: new Date().toISOString() }
              : c
          )
        );

        // Emit via socket
        const chat = chats.find((c) => c.id === activeChatId);
        const receiverId = chat?.participants?.find(
          (p) => p.userId !== currentUser.id
        )?.userId;

        if (socket && receiverId) {
          socket.emit("sendMessage", {
            receiverId,
            chatId: activeChatId,
            id: msg.id,
            text,
            userId: currentUser.id,
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar || null,
            createdAt: msg.createdAt,
          });
        }
      } catch (e) {
        console.error("sendMessage:", e);
      } finally {
        setSendingMessage(false);
      }
    },
    [activeChatId, currentUser, chats, socket]
  );

  // ── Typing indicator ─────────────────────────────────────────────────────
  const handleTyping = useCallback(
    (isTyping) => {
      if (!activeChatId || !currentUser) return;
      const chat = chats.find((c) => c.id === activeChatId);
      const receiverId = chat?.participants?.find(
        (p) => p.userId !== currentUser.id
      )?.userId;
      if (receiverId) emitTyping(receiverId, activeChatId, isTyping);
    },
    [activeChatId, currentUser, chats, emitTyping]
  );

  // ── Listen for incoming messages via SocketContext ────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      const incomingChatId = Number(data.chatId);
      if (incomingChatId === activeChatId) {
        // Add to current conversation
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Date.now(),
            text: data.text,
            userId: Number(data.userId),
            chatId: incomingChatId,
            createdAt: data.createdAt || new Date().toISOString(),
            user: {
              id: Number(data.userId),
              username: data.senderName,
              avatar: data.senderAvatar || null,
            },
          },
        ]);
      }
      // Update lastMessage in chat list
      setChats((prev) =>
        prev.map((c) =>
          c.id === incomingChatId
            ? {
                ...c,
                lastMessage: data.text,
                updatedAt: new Date().toISOString(),
                hasSeen: c.id === activeChatId,
              }
            : c
        )
      );
    };

    socket.on("getMessage", handleMessage);
    return () => socket.off("getMessage", handleMessage);
  }, [socket, activeChatId]);

  // ── Load chats on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) fetchChats();
  }, [currentUser?.id, fetchChats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const isTypingInCurrentChat =
    activeChatId !== null && !!typingUsers[activeChatId];
  const typingSenderName = activeChatId
    ? typingUsers[activeChatId]?.senderName || null
    : null;

  return {
    // State
    chats,
    activeChat,
    activeChatId,
    messages,
    loadingChats,
    loadingMessages,
    sendingMessage,
    isTypingInCurrentChat,
    typingSenderName,

    // Helpers
    isOnline: (userId) => isUserOnline(userId),

    // Actions
    fetchChats,
    openChat,
    closeChat,
    startChatWith,
    sendMessage,
    handleTyping,
  };
}
