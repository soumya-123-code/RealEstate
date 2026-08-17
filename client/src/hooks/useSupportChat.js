import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import toast from "react-hot-toast";

const API_BASE = "/support/chat";

export default function useSupportChat() {
  const { socket, typingUsers, isUserOnline, setActiveChatId, clearChatNotification } = useSocket();
  const { currentUser } = useAuth();
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

  const activeConversationRef = useRef(null);
  const messagesRef = useRef([]);
  const typingTimerRef = useRef(null);
  const fetchConversationsRef = useRef(null);
  activeConversationRef.current = activeConversation;
  messagesRef.current = messages;

  const isConversationTyping = useMemo(() => {
    if (!activeConversation) return null;
    return typingUsers[Number(activeConversation.id)] || null;
  }, [activeConversation, typingUsers]);

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

  const fetchStaffList = useCallback(async () => {
    try {
      const res = await apiRequest.get(`${API_BASE}/staff`);
      setStaffList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchStaffList error:", err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchStaffList();
  }, [fetchConversations, fetchStaffList]);

  useEffect(() => {
    const interval = setInterval(() => fetchConversationsRef.current?.(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (data) => {
      const raw = data?.message || data || {};
      const chatId = Number(raw.conversationId || data?.conversationId || raw.chatId || data?.chatId);
      const cur = activeConversationRef.current;
      if (!chatId) return;

      if (cur && Number(cur.id) === chatId) {
        setMessages((prev) => {
          const exists = prev.some((m) => Number(m.id) === Number(raw.id));
          if (exists) return prev;
          return [...prev, {
            ...raw,
            id: raw.id || `sock_${Date.now()}`,
            conversationId: chatId,
            chatId: Number(raw.chatId || cur.chatId || 0),
            userId: Number(raw.userId ?? raw.senderId),
            senderId: Number(raw.senderId ?? raw.userId),
            senderName: raw.senderName || raw.sender?.username,
            senderAvatar: raw.senderAvatar || raw.sender?.avatar || null,
            createdAt: raw.createdAt || new Date().toISOString(),
            readBy: raw.readBy || raw.readReceipts || [],
            attachment: raw.attachment || (raw.attachments?.[0] || null),
          }];
        });
        apiRequest.put(`${API_BASE}/conversations/${chatId}/read`).catch(() => {});
        setNewMessagesAtBottom(true);
      }
      fetchConversationsRef.current?.();
    };

    const onNewConversation = () => fetchConversationsRef.current?.();

    const onMessageRead = (data) => {
      const chatId = Number(data?.conversationId);
      const messageId = Number(data?.messageId);
      if (!chatId || !messageId) return;
      if (activeConversationRef.current && Number(activeConversationRef.current.id) === chatId) {
        setMessages((prev) => prev.map((m) => Number(m.id) === messageId
          ? { ...m, readReceipts: [...(m.readReceipts || m.readBy || []), { userId: Number(data.readBy), readAt: new Date().toISOString() }], readBy: [...(m.readBy || []), Number(data.readBy)] }
          : m));
      }
    };

    const onTyping = ({ conversationId, senderId, senderName, isTyping: typing }) => {
      if (!conversationId) return;
      // SocketContext owns the generic typing state; this listener intentionally
      // exists for compatibility with older support UI versions.
      void senderId; void senderName; void typing;
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

    // Backend support.controller.v2 emits support:newMessage. The previous
    // client listened to support:message, so staff/customer never received the
    // persisted message over Socket.IO.
    socket.on("support:newMessage", onMessage);
    socket.on("support:newConversation", onNewConversation);
    socket.on("support:messageRead", onMessageRead);
    socket.on("support:typing", onTyping);
    socket.on("support:message:deleted", onMessage);
    socket.on("support:message:edited", onMessage);
    window.addEventListener("support:chatUpdated", onChatUpdated);

    return () => {
      socket.off("support:newMessage", onMessage);
      socket.off("support:newConversation", onNewConversation);
      socket.off("support:messageRead", onMessageRead);
      socket.off("support:typing", onTyping);
      socket.off("support:message:deleted", onMessage);
      socket.off("support:message:edited", onMessage);
      window.removeEventListener("support:chatUpdated", onChatUpdated);
    };
  }, [socket]);

  const selectConversation = useCallback(async (conversation) => {
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
      setHasMoreMessages((full.messages || []).length >= 30);
      setActiveChatId(Number(full.id));
      clearChatNotification(full.id);
      if (full.customerId) {
        try {
          const custRes = await apiRequest.get(`${API_BASE}/customers/${full.customerId}`);
          setCustomerInfo(custRes.data);
        } catch (_) {}
      }
      if (full.propertyId) {
        try {
          const propRes = await apiRequest.get(`/properties/${full.propertyId}`);
          setPropertyInfo(propRes.data);
        } catch (_) {}
      } else setPropertyInfo(null);
    } catch (err) {
      console.error("selectConversation error:", err);
      toast.error("Failed to open conversation");
    } finally {
      setLoadingMessages(false);
      setScrollPosition("bottom");
    }
  }, [loadingMessages, setActiveChatId, clearChatNotification]);

  const sendMessage = useCallback(async (text, attachment = null, replyTo = null) => {
    const trimmed = (text || "").trim();
    if (!trimmed && !attachment) return;
    if (!activeConversationRef.current || sending || !currentUser?.id) return;
    const conv = activeConversationRef.current;
    const tempId = `tmp_${Date.now()}`;
    const temp = {
      id: tempId, text: trimmed, type: attachment ? "attachment" : "TEXT", attachment,
      attachments: attachment ? [attachment] : [], replyTo, forwarded: false,
      userId: Number(currentUser.id), senderId: Number(currentUser.id), senderName: currentUser.username,
      senderAvatar: currentUser.avatar || null, conversationId: Number(conv.id), createdAt: new Date().toISOString(),
      readBy: [], readReceipts: [], deleted: false, edited: false, _pending: true,
    };
    setMessages((prev) => [...prev, temp]);
    setSending(true);
    clearTimeout(typingTimerRef.current);
    if (socket) socket.emit("support:typing", { conversationId: Number(conv.id), isTyping: false });
    try {
      const payload = { text: trimmed };
      if (replyTo) payload.replyToId = Number(replyTo.id || replyTo);
      if (attachment) payload.attachments = [attachment];
      const res = await apiRequest.post(`${API_BASE}/conversations/${conv.id}/messages`, payload);
      const saved = res.data;
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...saved, _pending: false } : m));
      // Do not emit the message from the browser. The API persists it and the
      // backend securely emits support:newMessage to authorized recipients.
      fetchConversationsRef.current?.();
      setNewMessagesAtBottom(true);
    } catch (err) {
      console.error("sendMessage error:", err);
      toast.error(err?.response?.data?.message || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }, [sending, currentUser, socket]);

  const sendAttachment = useCallback(async (file) => {
    if (!activeConversationRef.current || sending) return;
    const conv = activeConversationRef.current;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conv.id);
    setSending(true);
    try {
      const res = await apiRequest.post(`${API_BASE}/conversations/${conv.id}/attachments`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const attachment = res.data;
      if (attachment?.messageId) {
        setMessages((prev) => [...prev, { id: attachment.messageId, text: attachment.caption || "", type: "ATTACHMENT", attachment, attachments: [attachment], userId: Number(currentUser.id), senderId: Number(currentUser.id), senderName: currentUser.username, senderAvatar: currentUser.avatar || null, conversationId: Number(conv.id), createdAt: new Date().toISOString(), readBy: [], readReceipts: [] }]);
      }
      fetchConversationsRef.current?.();
      setNewMessagesAtBottom(true);
    } catch (err) {
      console.error("sendAttachment error:", err);
      toast.error(err?.response?.data?.message || "Failed to send file");
    } finally {
      setSending(false);
    }
  }, [sending, currentUser]);

  const editMessage = useCallback(async (messageId, newText) => {
    if (!activeConversationRef.current || !newText.trim()) return;
    try {
      const res = await apiRequest.put(`${API_BASE}/conversations/${activeConversationRef.current.id}/messages/${messageId}`, { text: newText.trim() });
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, text: newText.trim(), edited: true, updatedAt: res.data?.updatedAt || new Date().toISOString() } : m));
      toast.success("Message edited");
    } catch (err) {
      console.error("editMessage error:", err);
      toast.error("Failed to edit message");
    }
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    if (!activeConversationRef.current) return;
    try {
      await apiRequest.delete(`${API_BASE}/conversations/${activeConversationRef.current.id}/messages/${messageId}`);
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deleted: true, text: "" } : m));
      toast.success("Message deleted");
    } catch (err) {
      console.error("deleteMessage error:", err);
      toast.error("Failed to delete message");
    }
  }, []);

  const forwardMessageToConversation = useCallback(async (messageId, targetConversationId) => {
    try {
      await apiRequest.post(`${API_BASE}/conversations/${targetConversationId}/messages/forward`, { originalMessageId: messageId, sourceConversationId: activeConversationRef.current?.id });
      toast.success("Message forwarded");
      fetchConversationsRef.current?.();
    } catch (err) {
      console.error("forwardMessage error:", err);
      toast.error("Failed to forward message");
    }
  }, []);

  const handleTyping = useCallback((isTyping) => {
    const conv = activeConversationRef.current;
    if (!conv || !socket) return;
    socket.emit("support:typing", { conversationId: Number(conv.id), isTyping: Boolean(isTyping) });
    if (isTyping) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => socket.emit("support:typing", { conversationId: Number(conv.id), isTyping: false }), 2000);
    } else clearTimeout(typingTimerRef.current);
  }, [socket]);

  const assignStaff = useCallback(async (conversationId, staffId) => {
    try {
      await apiRequest.patch(`/support/conversations/${conversationId}/assign`, { assignedToId: staffId });
      toast.success("Staff assigned");
      fetchConversationsRef.current?.();
      if (activeConversationRef.current?.id === conversationId) setActiveConversation((prev) => prev ? { ...prev, assignedToId: staffId } : null);
    } catch (err) {
      console.error("assignStaff error:", err);
      toast.error(err?.response?.data?.message || "Failed to assign staff");
    }
  }, []);

  const resolveConversation = useCallback(async (conversationId) => {
    try {
      await apiRequest.patch(`/support/conversations/${conversationId}/status`, { status: "RESOLVED" });
      toast.success("Conversation resolved");
      fetchConversationsRef.current?.();
      if (activeConversationRef.current?.id === conversationId) setActiveConversation((prev) => prev ? { ...prev, status: "RESOLVED" } : null);
    } catch (err) {
      console.error("resolveConversation error:", err);
      toast.error(err?.response?.data?.message || "Failed to resolve conversation");
    }
  }, []);

  const archiveConversation = useCallback(async (conversationId) => {
    try {
      await apiRequest.patch(`/support/conversations/${conversationId}/status`, { status: "CLOSED" });
      toast.success("Conversation closed");
      fetchConversationsRef.current?.();
      if (activeConversationRef.current?.id === conversationId) setActiveConversation((prev) => prev ? { ...prev, status: "CLOSED" } : null);
    } catch (err) {
      console.error("archiveConversation error:", err);
      toast.error(err?.response?.data?.message || "Failed to close conversation");
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationRef.current || !hasMoreMessages || loadingMessages) return;
    setLoadingMessages(true);
    try {
      const before = messagesRef.current[0]?.createdAt;
      if (!before) return;
      const res = await apiRequest.get(`${API_BASE}/conversations/${activeConversationRef.current.id}/messages`, { params: { before, limit: 50 } });
      const older = res.data.messages || [];
      setHasMoreMessages(Boolean(res.data.hasMore));
      setMessages((prev) => [...older, ...prev]);
    } catch (err) {
      console.error("loadMoreMessages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [hasMoreMessages, loadingMessages]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    switch (filter) {
      case "unread": filtered = filtered.filter((c) => (c.unreadCount || 0) > 0); break;
      case "assigned": filtered = filtered.filter((c) => c.assignedToId); break;
      case "unassigned": filtered = filtered.filter((c) => !c.assignedToId); break;
      case "resolved": filtered = filtered.filter((c) => String(c.status).toUpperCase() === "RESOLVED"); break;
      case "archived": filtered = filtered.filter((c) => String(c.status).toUpperCase() === "CLOSED"); break;
      default: break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => [c.customerName, c.customerPhone, c.customerEmail, c.propertyName, c.property?.title, c.propertyId?.toString(), c.lastMessageText, c.lastMessage?.text].some((v) => String(v || "").toLowerCase().includes(q)));
    }
    return filtered;
  }, [conversations, filter, searchQuery]);

  const activeCustomer = useMemo(() => {
    if (!activeConversation) return null;
    return {
      id: activeConversation.customerId,
      name: activeConversation.customerName || activeConversation.customer?.username || customerInfo?.username || "Unknown",
      phone: activeConversation.customerPhone || activeConversation.customer?.phone || customerInfo?.phone || null,
      email: activeConversation.customerEmail || activeConversation.customer?.email || customerInfo?.email || null,
      avatar: activeConversation.customerAvatar || activeConversation.customer?.avatar || customerInfo?.avatar || null,
      online: activeConversation.customerId ? isUserOnline(activeConversation.customerId) : false,
    };
  }, [activeConversation, customerInfo, isUserOnline]);

  const setScrollPositionState = useCallback((pos) => {
    setScrollPosition(pos);
    setNewMessagesAtBottom(pos === "bottom");
  }, []);

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  return {
    conversations, activeConversation, messages, loading, loadingMessages, sending, filter, searchQuery,
    customerInfo, propertyInfo, staffList, hasMoreMessages, editingMessage, forwardMessage, contextMenu,
    isConversationTyping, filteredConversations, activeCustomer, newMessagesAtBottom, scrollPosition,
    setFilter, setSearchQuery, setEditingMessage, setForwardMessage, setContextMenu, setActiveConversation,
    setMessages, setHasMoreMessages, setScrollPositionState, fetchConversations, selectConversation,
    sendMessage, sendAttachment, editMessage, deleteMessage, forwardMessageToConversation, assignStaff,
    resolveConversation, archiveConversation, loadMoreMessages, handleTyping,
  };
}
