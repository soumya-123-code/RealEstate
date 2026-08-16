import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import toast from "react-hot-toast";

const API_BASE = "/support/chat";

export default function useSupportChat() {
  const { socket, emitTyping, typingUsers, isUserOnline, setActiveChatId, clearChatNotification } = useSocket();
  const { currentUser } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [propertyInfo, setPropertyInfo] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [newMessagesAtBottom, setNewMessagesAtBottom] = useState(false);
  const [scrollPosition, setScrollPosition] = useState("bottom");

  // Refs for stable access in callbacks
  const activeConversationRef = useRef(null);
  const messagesRef = useRef([]);
  const typingTimerRef = useRef(null);
  const fetchConversationsRef = useRef(null);

  // Keep refs in sync
  activeConversationRef.current = activeConversation;
  messagesRef.current = messages;

  // ── Typing state derived from context ──────────────────────────────────────
  const isConversationTyping = useMemo(() => {
    if (!activeConversation) return null;
    return typingUsers[Number(activeConversation.id)] || null;
  }, [activeConversation, typingUsers]);

  // ── Fetch conversations list ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiRequest.get(`${API_BASE}/conversations`);
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchConversations error:", err);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  fetchConversationsRef.current = fetchConversations;

  // ── Fetch staff list ──────────────────────────────────────────────────────
  const fetchStaffList = useCallback(async () => {
    try {
      const res = await apiRequest.get(`${API_BASE}/staff`);
      setStaffList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchStaffList error:", err);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchConversations();
    fetchStaffList();
  }, [fetchConversations, fetchStaffList]);

  // ── Auto-refresh conversations every 30s ───────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversationsRef.current?.();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Listen for real-time updates ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onMessage = (data) => {
      const chatId = Number(data.conversationId || data.chatId);
      const cur = activeConversationRef.current;

      if (cur && Number(cur.id) === chatId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: data.id || `sock_${Date.now()}`,
              text: data.text || "",
              type: data.type || "text",
              attachment: data.attachment || null,
              replyTo: data.replyTo || null,
              forwarded: data.forwarded || false,
              userId: Number(data.userId),
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              conversationId: chatId,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || null,
              readBy: data.readBy || [],
              deleted: data.deleted || false,
              edited: data.edited || false,
            },
          ];
        });

        // Mark as read
        apiRequest.put(`${API_BASE}/conversations/${chatId}/read`).catch(() => {});

        // If scrolled to bottom, auto-scroll
        setNewMessagesAtBottom(true);
      }

      // Refresh list
      fetchConversationsRef.current?.();
    };

    const onMessageDeleted = (data) => {
      const chatId = Number(data.conversationId);
      const cur = activeConversationRef.current;
      if (cur && Number(cur.id) === chatId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId ? { ...m, deleted: true, text: "" } : m
          )
        );
      }
      fetchConversationsRef.current?.();
    };

    const onMessageEdited = (data) => {
      const chatId = Number(data.conversationId);
      const cur = activeConversationRef.current;
      if (cur && Number(cur.id) === chatId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, text: data.newText, edited: true, updatedAt: data.updatedAt || new Date().toISOString() }
              : m
          )
        );
      }
    };

    const onTyping = ({ conversationId, senderId, senderName, isTyping: typing }) => {
      // Typing state is handled by the parent SocketContext
    };

    const onChatUpdated = (event) => {
      const data = event.detail;
      if (data) {
        fetchConversationsRef.current?.();
        if (activeConversationRef.current && Number(activeConversationRef.current.id) === Number(data.conversationId)) {
          setActiveConversation((prev) => (prev ? { ...prev, ...data } : null));
        }
      }
    };

    socket.on("support:message", onMessage);
    socket.on("support:message:deleted", onMessageDeleted);
    socket.on("support:message:edited", onMessageEdited);
    socket.on("support:userTyping", onTyping);

    const handleChatUpdated = onChatUpdated;
    window.addEventListener("support:chatUpdated", handleChatUpdated);

    return () => {
      socket.off("support:message", onMessage);
      socket.off("support:message:deleted", onMessageDeleted);
      socket.off("support:message:edited", onMessageEdited);
      socket.off("support:userTyping", onTyping);
      window.removeEventListener("support:chatUpdated", handleChatUpdated);
    };
  }, [socket]);

  // ── Select conversation ──────────────────────────────────────────────────
  const selectConversation = useCallback(
    async (conversation) => {
      if (activeConversationRef.current?.id === conversation.id && !loadingMessages) return;

      setLoadingMessages(true);
      setEditingMessage(null);
      setForwardMessage(null);
      setContextMenu(null);
      setNewMessagesAtBottom(false);

      try {
        const res = await apiRequest.get(`${API_BASE}/conversations/${conversation.id}`);
        const full = res.data;
        setActiveConversation(full);
        setMessages(full.messages || []);
        setActiveChatId(Number(full.id));
        clearChatNotification(full.id);

        // Fetch customer info
        if (full.customerId) {
          try {
            const custRes = await apiRequest.get(`${API_BASE}/customers/${full.customerId}`);
            setCustomerInfo(custRes.data);
          } catch (_) {}
        }

        // Fetch property info
        if (full.propertyId) {
          try {
            const propRes = await apiRequest.get(`/properties/${full.propertyId}`);
            setPropertyInfo(propRes.data);
          } catch (_) {}
        }

        if (!full.propertyId) {
          setPropertyInfo(null);
        }
      } catch (err) {
        console.error("selectConversation error:", err);
        toast.error("Failed to open conversation");
      } finally {
        setLoadingMessages(false);
        setScrollPosition("bottom");
      }
    },
    [loadingMessages, setActiveChatId, clearChatNotification]
  );

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text, attachment = null, replyTo = null) => {
      const trimmed = (text || "").trim();
      if (!trimmed && !attachment) return;
      if (!activeConversationRef.current || sending) return;

      const conv = activeConversationRef.current;
      const tempId = `tmp_${Date.now()}`;
      const temp = {
        id: tempId,
        text: trimmed,
        type: attachment ? "attachment" : "text",
        attachment,
        replyTo,
        forwarded: false,
        userId: Number(currentUser.id),
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar || null,
        conversationId: Number(conv.id),
        createdAt: new Date().toISOString(),
        readBy: [],
        deleted: false,
        edited: false,
        _pending: true,
      };

      setMessages((prev) => [...prev, temp]);
      setSending(true);

      // Stop typing
      clearTimeout(typingTimerRef.current);
      if (conv.customerId) {
        emitTyping(conv.customerId, conv.id, false);
      }

      try {
        const payload = { text: trimmed };
        if (replyTo) payload.replyToId = replyTo;
        if (attachment) payload.attachmentId = attachment.id;

        const res = await apiRequest.post(`${API_BASE}/conversations/${conv.id}/messages`, payload);
        const saved = res.data;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...saved, _pending: false } : m
          )
        );

        // Emit via socket
        if (socket && conv.customerId) {
          socket.emit("support:sendMessage", {
            receiverId: conv.customerId,
            conversationId: Number(conv.id),
            id: saved.id,
            text: trimmed,
            type: saved.type || "text",
            attachment: saved.attachment || null,
            replyTo: saved.replyTo || null,
            userId: Number(currentUser.id),
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar || null,
            createdAt: saved.createdAt,
          });
        }

        fetchConversationsRef.current?.();
        setNewMessagesAtBottom(true);
      } catch (err) {
        console.error("sendMessage error:", err);
        toast.error("Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setSending(false);
      }
    },
    [sending, currentUser, socket, emitTyping]
  );

  // ── Upload and send attachment ────────────────────────────────────────────
  const sendAttachment = useCallback(
    async (file) => {
      if (!activeConversationRef.current || sending) return;

      const conv = activeConversationRef.current;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conv.id);

      setSending(true);

      try {
        const res = await apiRequest.post(`${API_BASE}/conversations/${conv.id}/attachments`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const attachment = res.data;

        setMessages((prev) => [
          ...prev,
          {
            id: `att_${Date.now()}`,
            text: attachment.caption || "",
            type: "attachment",
            attachment,
            replyTo: null,
            forwarded: false,
            userId: Number(currentUser.id),
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar || null,
            conversationId: Number(conv.id),
            createdAt: new Date().toISOString(),
            readBy: [],
            deleted: false,
            edited: false,
          },
        ]);

        if (socket && conv.customerId) {
          socket.emit("support:sendMessage", {
            receiverId: conv.customerId,
            conversationId: Number(conv.id),
            id: attachment.messageId,
            text: attachment.caption || "",
            type: "attachment",
            attachment,
            userId: Number(currentUser.id),
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar || null,
            createdAt: new Date().toISOString(),
          });
        }

        fetchConversationsRef.current?.();
        setNewMessagesAtBottom(true);
      } catch (err) {
        console.error("sendAttachment error:", err);
        toast.error("Failed to send file");
      } finally {
        setSending(false);
      }
    },
    [sending, currentUser, socket]
  );

  // ── Edit message ─────────────────────────────────────────────────────────
  const editMessage = useCallback(
    async (messageId, newText) => {
      if (!activeConversationRef.current || !newText.trim()) return;

      try {
        const res = await apiRequest.put(
          `${API_BASE}/conversations/${activeConversationRef.current.id}/messages/${messageId}`,
          { text: newText.trim() }
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, text: newText.trim(), edited: true, updatedAt: res.data?.updatedAt || new Date().toISOString() }
              : m
          )
        );

        if (socket) {
          socket.emit("support:message:edit", {
            messageId,
            conversationId: Number(activeConversationRef.current.id),
            newText: newText.trim(),
          });
        }

        toast.success("Message edited");
      } catch (err) {
        console.error("editMessage error:", err);
        toast.error("Failed to edit message");
      }
    },
    [socket]
  );

  // ── Delete message ────────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    async (messageId) => {
      if (!activeConversationRef.current) return;

      try {
        await apiRequest.delete(
          `${API_BASE}/conversations/${activeConversationRef.current.id}/messages/${messageId}`
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, deleted: true, text: "" } : m
          )
        );

        if (socket) {
          socket.emit("support:message:delete", {
            messageId,
            conversationId: Number(activeConversationRef.current.id),
          });
        }

        toast.success("Message deleted");
      } catch (err) {
        console.error("deleteMessage error:", err);
        toast.error("Failed to delete message");
      }
    },
    [socket]
  );

  // ── Forward message ──────────────────────────────────────────────────────
  const forwardMessage = useCallback(
    async (messageId, targetConversationId) => {
      try {
        await apiRequest.post(`${API_BASE}/conversations/${targetConversationId}/messages/forward`, {
          originalMessageId: messageId,
          sourceConversationId: activeConversationRef.current?.id,
        });
        toast.success("Message forwarded");
        fetchConversationsRef.current?.();
      } catch (err) {
        console.error("forwardMessage error:", err);
        toast.error("Failed to forward message");
      }
    },
    []
  );

  // ── Typing ────────────────────────────────────────────────────────────────
  const handleTyping = useCallback(
    (isTyping) => {
      const conv = activeConversationRef.current;
      if (!conv || !conv.customerId) return;

      emitTyping(conv.customerId, conv.id, isTyping);

      if (isTyping) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          emitTyping(conv.customerId, conv.id, false);
        }, 2000);
      } else {
        clearTimeout(typingTimerRef.current);
      }
    },
    [emitTyping]
  );

  // ── Assign staff ────────────────────────────────────────────────────────────
  const assignStaff = useCallback(
    async (conversationId, staffId) => {
      try {
        await apiRequest.put(`${API_BASE}/conversations/${conversationId}/assign`, { staffId });
        toast.success("Staff assigned");
        fetchConversationsRef.current?.();
        if (activeConversationRef.current?.id === conversationId) {
          setActiveConversation((prev) => (prev ? { ...prev, assignedStaffId: staffId } : null));
        }
      } catch (err) {
        console.error("assignStaff error:", err);
        toast.error("Failed to assign staff");
      }
    },
    []
  );

  // ── Resolve conversation ──────────────────────────────────────────────────
  const resolveConversation = useCallback(
    async (conversationId) => {
      try {
        await apiRequest.put(`${API_BASE}/conversations/${conversationId}/resolve`);
        toast.success("Conversation resolved");
        fetchConversationsRef.current?.();
        if (activeConversationRef.current?.id === conversationId) {
          setActiveConversation((prev) => (prev ? { ...prev, status: "resolved" } : null));
        }
      } catch (err) {
        console.error("resolveConversation error:", err);
        toast.error("Failed to resolve conversation");
      }
    },
    []
  );

  // ── Archive conversation ──────────────────────────────────────────────────
  const archiveConversation = useCallback(
    async (conversationId) => {
      try {
        await apiRequest.put(`${API_BASE}/conversations/${conversationId}/archive`);
        toast.success("Conversation archived");
        fetchConversationsRef.current?.();
        if (activeConversationRef.current?.id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
          setCustomerInfo(null);
          setPropertyInfo(null);
        }
      } catch (err) {
        console.error("archiveConversation error:", err);
        toast.error("Failed to archive conversation");
      }
    },
    []
  );

  // ── Load more messages (pagination) ───────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationRef.current || !hasMoreMessages || loadingMessages) return;

    setLoadingMessages(true);
    try {
      const before = messagesRef.current[0]?.createdAt;
      if (!before) return;

      const res = await apiRequest.get(
        `${API_BASE}/conversations/${activeConversationRef.current.id}/messages`,
        { params: { before, limit: 50 } }
      );

      const older = res.data.messages || [];
      if (older.length < 50) setHasMoreMessages(false);
      else setHasMoreMessages(true);

      setMessages((prev) => [...older, ...prev]);
    } catch (err) {
      console.error("loadMoreMessages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [hasMoreMessages, loadingMessages]);

  // ── Filtered conversations ────────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply filter tab
    switch (filter) {
      case "unread":
        filtered = filtered.filter((c) => (c.unreadCount || 0) > 0);
        break;
      case "assigned":
        filtered = filtered.filter((c) => c.assignedStaffId);
        break;
      case "unassigned":
        filtered = filtered.filter((c) => !c.assignedStaffId);
        break;
      case "resolved":
        filtered = filtered.filter((c) => c.status === "resolved");
        break;
      case "archived":
        filtered = filtered.filter((c) => c.status === "archived");
        break;
      default:
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => {
        return (
          c.customerName?.toLowerCase().includes(q) ||
          c.customerPhone?.toLowerCase().includes(q) ||
          c.customerEmail?.toLowerCase().includes(q) ||
          c.propertyName?.toLowerCase().includes(q) ||
          c.propertyId?.toString().toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [conversations, filter, searchQuery]);

  // ── Get customer for active conversation ──────────────────────────────────
  const activeCustomer = useMemo(() => {
    if (!activeConversation) return null;
    return {
      id: activeConversation.customerId,
      name: activeConversation.customerName || customerInfo?.username || "Unknown",
      phone: activeConversation.customerPhone || customerInfo?.phone || null,
      email: activeConversation.customerEmail || customerInfo?.email || null,
      avatar: activeConversation.customerAvatar || customerInfo?.avatar || null,
      online: activeConversation.customerId
        ? isUserOnline(activeConversation.customerId)
        : false,
    };
  }, [activeConversation, customerInfo, isUserOnline]);

  // ── Scroll helpers ─────────────────────────────────────────────────────────
  const setScrollPositionState = useCallback((pos) => {
    setScrollPosition(pos);
    setNewMessagesAtBottom(pos === "bottom");
  }, []);

  // ── Cleanup typing on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
    };
  }, []);

  return {
    // State
    conversations,
    activeConversation,
    messages,
    loading,
    loadingMessages,
    sending,
    filter,
    searchQuery,
    customerInfo,
    propertyInfo,
    staffList,
    hasMoreMessages,
    editingMessage,
    forwardMessage,
    contextMenu,
    isConversationTyping,
    filteredConversations,
    activeCustomer,
    newMessagesAtBottom,
    scrollPosition,

    // Setters
    setFilter,
    setSearchQuery,
    setEditingMessage,
    setForwardMessage,
    setContextMenu,
    setActiveConversation,
    setMessages,
    setHasMoreMessages,
    setScrollPositionState,

    // Actions
    fetchConversations,
    selectConversation,
    sendMessage,
    sendAttachment,
    editMessage,
    deleteMessage,
    forwardMessage: forwardMessage,
    assignStaff,
    resolveConversation,
    archiveConversation,
    loadMoreMessages,
    handleTyping,
  };
}
