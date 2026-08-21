/**
 * SupportContext.jsx
 *
 * State management for the Customer Support Chat Module.
 *
 * Holds:
 *   - conversations[] (sidebar list)
 *   - activeConversation (full detail object — customer + property + lead + messages + notes + callbacks)
 *   - filter, search, page (sidebar controls)
 *   - typingUsers (per-conversation typing state)
 *
 * Subscribes to socket events:
 *   - support:newMessage       → append to messages + update sidebar preview + toast
 *   - support:typing           → set typing indicator
 *   - support:messageRead      → update read receipts
 *   - support:conversationUpdated → update sidebar preview
 *   - support:assigned         → update assignment
 *   - support:statusChanged    → update status badge
 *   - support:noteAdded        → append note to active conversation
 *   - support:callbackScheduled → append callback
 *
 * Also bridges to mobile WebView push notifications via window.ReactNativeWebView.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import apiRequest from '../lib/apiRequest';
import toast from 'react-hot-toast';

const SupportContext = createContext(null);

// Mobile WebView bridge — fire-and-forget
const pushToNative = (payload) => {
  try {
    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  } catch(_) { /* intentionally ignored */ }
};

export const SupportContextProvider = ({ children }) => {
  const { socket, onlineUsers, isUserOnline } = useSocket();
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [typingUsers, setTypingUsers] = useState({}); // { [conversationId]: { userId, senderName } }
  const [stats, setStats] = useState(null);

  const activeConversationIdRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // ========================================
  // Fetch conversations list
  // ========================================
  const fetchConversations = useCallback(async (resetPage = false) => {
    setLoadingList(true);
    try {
      // Translate sidebar filter chips into the query params the backend
      // `/support/conversations` endpoint understands. The backend overloads
      // the `filter` query param: it can be a status (OPEN/PENDING/RESOLVED/CLOSED)
      // OR a special value (`unread`/`assigned`/`unassigned`). For "mine"
      // we use the dedicated `assignedToId` param instead.
      const params = { search, page: resetPage ? 1 : page, limit: 20 };
      let assignedToId;
      switch (filter) {
        case 'unread':
          params.filter = 'unread';
          break;
        case 'unassigned':
          params.filter = 'unassigned';
          break;
        case 'mine':
          // Only show conversations assigned to the current staff member.
          if (currentUser?.id) assignedToId = currentUser.id;
          break;
        case 'resolved':
          params.filter = 'RESOLVED';
          break;
        case 'archived':
          // The backend has no ARCHIVED status; map to CLOSED.
          params.filter = 'CLOSED';
          break;
        case 'all':
        default:
          break;
      }
      if (assignedToId != null) params.assignedToId = assignedToId;
      const res = await apiRequest.get('/support/conversations', { params });
      setConversations(res.data.conversations);
      setPagination(res.data.pagination);
      if (resetPage) setPage(1);
    } catch (err) {
      console.error('fetchConversations error:', err);
      if (err.response?.status !== 403) {
        toast.error('Failed to load conversations');
      }
    } finally {
      setLoadingList(false);
    }
  }, [filter, search, page, currentUser]);

  // ========================================
  // Fetch single conversation
  // ========================================
  const selectConversation = useCallback(async (id) => {
    if (!id) {
      setActiveConversation(null);
      activeConversationIdRef.current = null;
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await apiRequest.get(`/support/conversations/${id}`);
      setActiveConversation(res.data);
      activeConversationIdRef.current = id;
    } catch (err) {
      console.error('selectConversation error:', err);
      toast.error('Failed to load conversation');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ========================================
  // Send message
  // ========================================
  const sendMessage = useCallback(async (conversationId, { text, replyToId, attachments }) => {
    try {
      const res = await apiRequest.post(`/support/conversations/${conversationId}/messages`, {
        text,
        replyToId,
        attachments,
      });
      // Append to active conversation messages
      setActiveConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        return { ...prev, messages: [...(prev.messages || []), res.data] };
      });
      // Update sidebar preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessageText: text || `[${attachments?.[0]?.type?.toLowerCase() || 'file'}]`,
                lastMessageAt: res.data.createdAt,
                lastMessageSenderId: res.data.senderId,
                lastMessageType: attachments?.[0]?.type?.toLowerCase() || 'text',
                updatedAt: res.data.createdAt,
              }
            : c
        )
      );
      return res.data;
    } catch (err) {
      console.error('sendMessage error:', err);
      toast.error('Failed to send message');
      throw err;
    }
  }, []);

  // ========================================
  // Upload attachment
  // ========================================
  const uploadAttachment = useCallback(async (conversationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest.post(
      `/support/conversations/${conversationId}/messages/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }, []);

  // ========================================
  // Edit message
  // ========================================
  const editMessage = useCallback(async (conversationId, messageId, text) => {
    try {
      const res = await apiRequest.patch(
        `/support/conversations/${conversationId}/messages/${messageId}`,
        { text }
      );
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) => (m.id === messageId ? res.data : m)),
        };
      });
      toast.success('Message edited');
    } catch (err) {
      console.error('editMessage error:', err);
      toast.error('Failed to edit message');
    }
  }, []);

  // ========================================
  // Delete message (soft)
  // ========================================
  const deleteMessage = useCallback(async (conversationId, messageId) => {
    try {
      await apiRequest.delete(`/support/conversations/${conversationId}/messages/${messageId}`);
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, text: null, deletedAt: new Date().toISOString() } : m
          ),
        };
      });
      toast.success('Message deleted');
    } catch (err) {
      console.error('deleteMessage error:', err);
      toast.error('Failed to delete message');
    }
  }, []);

  // ========================================
  // Forward message
  // ========================================
  const forwardMessage = useCallback(async (conversationId, messageId, targetConversationId) => {
    try {
      await apiRequest.post(
        `/support/conversations/${conversationId}/messages/${messageId}/forward`,
        { targetConversationId }
      );
      toast.success('Message forwarded');
    } catch (err) {
      console.error('forwardMessage error:', err);
      toast.error('Failed to forward message');
    }
  }, []);

  // ========================================
  // Mark message as read
  // ========================================
  const markMessageRead = useCallback(async (conversationId, messageId) => {
    try {
      await apiRequest.post(`/support/conversations/${conversationId}/messages/${messageId}/read`);
    } catch(_) { /* intentionally ignored */ }
  }, []);

  // ========================================
  // Mark all read
  // ========================================
  const markAllRead = useCallback(async (conversationId) => {
    try {
      await apiRequest.put(`/support/conversations/${conversationId}/read`);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, staffUnreadCount: 0 } : c))
      );
    } catch(_) { /* intentionally ignored */ }
  }, []);

  // ========================================
  // Update status (resolve / archive / reopen)
  // ========================================
  const updateStatus = useCallback(async (conversationId, status) => {
    try {
      await apiRequest.patch(`/support/conversations/${conversationId}/status`, { status });
      setActiveConversation((prev) => (prev ? { ...prev, status } : prev));
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, status } : c)));
      toast.success(`Conversation marked as ${status.toLowerCase()}`);
    } catch (err) {
      console.error('updateStatus error:', err);
      toast.error('Failed to update status');
    }
  }, []);

  // ========================================
  // Assign staff
  // ========================================
  const assignStaff = useCallback(async (conversationId, assignedToId, note) => {
    try {
      const res = await apiRequest.patch(`/support/conversations/${conversationId}/assign`, {
        assignedToId,
        note,
      });
      setActiveConversation((prev) =>
        prev ? { ...prev, assignedTo: res.data.conversation.assignedTo, assignedAt: new Date().toISOString() } : prev
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, assignedTo: res.data.conversation.assignedTo, assignedAt: new Date().toISOString() }
            : c
        )
      );
      toast.success('Conversation assigned');
    } catch (err) {
      console.error('assignStaff error:', err);
      toast.error('Failed to assign');
    }
  }, []);

  // ========================================
  // Notes CRUD
  // ========================================
  const addNote = useCallback(async (conversationId, body, pinned = false) => {
    try {
      const res = await apiRequest.post(`/support/conversations/${conversationId}/notes`, {
        body,
        pinned,
      });
      setActiveConversation((prev) =>
        prev ? { ...prev, notes: [res.data, ...(prev.notes || [])] } : prev
      );
      toast.success('Note added');
    } catch (err) {
      console.error('addNote error:', err);
      toast.error('Failed to add note');
    }
  }, []);

  const editNote = useCallback(async (conversationId, noteId, body, pinned) => {
    try {
      const res = await apiRequest.patch(
        `/support/conversations/${conversationId}/notes/${noteId}`,
        { body, pinned }
      );
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: prev.notes.map((n) => (n.id === noteId ? res.data : n)),
        };
      });
    } catch (err) {
      console.error('editNote error:', err);
      toast.error('Failed to edit note');
    }
  }, []);

  const deleteNote = useCallback(async (conversationId, noteId) => {
    try {
      await apiRequest.delete(`/support/conversations/${conversationId}/notes/${noteId}`);
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) };
      });
      toast.success('Note deleted');
    } catch (err) {
      console.error('deleteNote error:', err);
      toast.error('Failed to delete note');
    }
  }, []);

  // ========================================
  // Callbacks
  // ========================================
  const scheduleCallback = useCallback(async (conversationId, { scheduledAt, note, assignedToId }) => {
    try {
      const res = await apiRequest.post(`/support/conversations/${conversationId}/callbacks`, {
        scheduledAt,
        note,
        assignedToId,
      });
      setActiveConversation((prev) =>
        prev ? { ...prev, callbacks: [...(prev.callbacks || []), res.data] } : prev
      );
      toast.success('Callback scheduled');
    } catch (err) {
      console.error('scheduleCallback error:', err);
      toast.error('Failed to schedule callback');
    }
  }, []);

  const updateCallback = useCallback(async (conversationId, callbackId, status) => {
    try {
      const res = await apiRequest.patch(
        `/support/conversations/${conversationId}/callbacks/${callbackId}`,
        { status }
      );
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          callbacks: prev.callbacks.map((cb) => (cb.id === callbackId ? res.data : cb)),
        };
      });
    } catch (err) {
      console.error('updateCallback error:', err);
      toast.error('Failed to update callback');
    }
  }, []);

  // ========================================
  // Fetch admin stats
  // ========================================
  const fetchStats = useCallback(async () => {
    if (currentUser?.role !== 'ADMIN') return;
    try {
      const res = await apiRequest.get('/support/conversations/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  }, [currentUser]);

  // ========================================
  // Socket event listeners
  // ========================================
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ conversationId, message, senderInfo }) => {
      // Update sidebar preview
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) {
          // New conversation — refresh list
          fetchConversations();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessageText: message.text || `[${(message.attachments?.[0]?.type || 'file').toLowerCase()}]`,
          lastMessageAt: message.createdAt,
          lastMessageSenderId: message.senderId,
          lastMessageType: message.attachments?.[0]?.type?.toLowerCase() || 'text',
          updatedAt: message.createdAt,
          staffUnreadCount:
            message.senderId !== currentUser?.id
              ? (updated[idx].staffUnreadCount || 0) + 1
              : updated[idx].staffUnreadCount,
        };
        // Move to top
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
        return updated;
      });

      // Append to active conversation messages if it's the open one
      if (activeConversationIdRef.current === conversationId) {
        setActiveConversation((prev) => {
          if (!prev) return prev;
          // Avoid duplicates
          if (prev.messages?.some((m) => m.id === message.id)) return prev;
          return { ...prev, messages: [...(prev.messages || []), message] };
        });

        // Auto-mark as read if active and message is from customer
        if (message.senderId !== currentUser?.id) {
          markMessageRead(conversationId, message.id);
        }
      } else if (message.senderId !== currentUser?.id) {
        // Toast notification for inactive conversation
        toast.custom(
          (t) => (
            <div
              style={{
                background: '#1e2a45',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
              onClick={() => {
                selectConversation(conversationId);
                toast.dismiss(t.id);
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#7c6ef7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
              >
                {senderInfo?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {senderInfo?.username || 'New message'}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  {message.text
                    ? message.text.slice(0, 60) + (message.text.length > 60 ? '…' : '')
                    : `[${message.attachments?.[0]?.type?.toLowerCase() || 'attachment'}]`}
                </div>
              </div>
            </div>
          ),
          { duration: 5000, position: 'top-right' }
        );

        // Push to native WebView
        pushToNative({
          type: 'push',
          title: `New message from ${senderInfo?.username || 'Customer'}`,
          body: message.text || 'New attachment',
          conversationId,
        });
      }
    };

    const handleTyping = ({ conversationId, userId, senderName, isTyping }) => {
      if (userId === currentUser?.id) return;
      setTypingUsers((prev) => {
        if (isTyping) return { ...prev, [conversationId]: { userId, senderName } };
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    };

    const handleMessageRead = ({ conversationId, messageId, readBy }) => {
      if (readBy === currentUser?.id) return;
      setActiveConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  readReceipts: [
                    ...(m.readReceipts || []).filter((r) => r.userId !== readBy),
                    { userId: readBy, readAt: new Date().toISOString() },
                  ],
                }
              : m
          ),
        };
      });
    };

    const handleConversationUpdated = (data) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                lastMessageText: data.lastMessageText ?? c.lastMessageText,
                lastMessageAt: data.lastMessageAt ?? c.lastMessageAt,
                lastMessageSenderId: data.lastMessageSenderId ?? c.lastMessageSenderId,
                lastMessageType: data.lastMessageType ?? c.lastMessageType,
                staffUnreadCount:
                  typeof data.staffUnreadCount === 'number'
                    ? data.staffUnreadCount
                    : c.staffUnreadCount,
                customerUnreadCount:
                  typeof data.customerUnreadCount === 'number'
                    ? data.customerUnreadCount
                    : c.customerUnreadCount,
                updatedAt: data.lastMessageAt ?? c.updatedAt,
              }
            : c
        )
      );
    };

    const handleAssigned = ({ conversationId, assignedToId, assignedById }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, assignedToId, assignedAt: new Date().toISOString() }
            : c
        )
      );
      if (assignedToId === currentUser?.id && assignedById !== currentUser?.id) {
        toast.success('A conversation has been assigned to you');
        pushToNative({
          type: 'push',
          title: 'New assignment',
          body: 'A conversation has been assigned to you',
          conversationId,
        });
      }
    };

    const handleStatusChanged = ({ conversationId, status, changedBy }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, status } : c))
      );
      setActiveConversation((prev) =>
        prev && prev.id === conversationId ? { ...prev, status } : prev
      );
    };

    const handleNoteAdded = ({ conversationId, note }) => {
      if (activeConversationIdRef.current === conversationId) {
        setActiveConversation((prev) =>
          prev ? { ...prev, notes: [note, ...(prev.notes || [])] } : prev
        );
      }
    };

    const handleCallbackScheduled = ({ conversationId, callback }) => {
      if (activeConversationIdRef.current === conversationId) {
        setActiveConversation((prev) =>
          prev ? { ...prev, callbacks: [...(prev.callbacks || []), callback] } : prev
        );
      }
    };

    socket.on('support:newMessage', handleNewMessage);
    socket.on('support:typing', handleTyping);
    socket.on('support:messageRead', handleMessageRead);
    socket.on('support:conversationUpdated', handleConversationUpdated);
    socket.on('support:assigned', handleAssigned);
    socket.on('support:statusChanged', handleStatusChanged);
    socket.on('support:noteAdded', handleNoteAdded);
    socket.on('support:callbackScheduled', handleCallbackScheduled);

    return () => {
      socket.off('support:newMessage', handleNewMessage);
      socket.off('support:typing', handleTyping);
      socket.off('support:messageRead', handleMessageRead);
      socket.off('support:conversationUpdated', handleConversationUpdated);
      socket.off('support:assigned', handleAssigned);
      socket.off('support:statusChanged', handleStatusChanged);
      socket.off('support:noteAdded', handleNoteAdded);
      socket.off('support:callbackScheduled', handleCallbackScheduled);
    };
  }, [socket, currentUser, fetchConversations, markMessageRead, selectConversation]);

  // ========================================
  // Debounced search refetch
  // ========================================
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchConversations(true);
    }, 350);
    return () => searchTimeoutRef.current && clearTimeout(searchTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Refetch on filter change
  useEffect(() => {
    fetchConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Fetch stats on mount (admin only)
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ========================================
  // Emit typing indicator
  // ========================================
  const emitTyping = useCallback(
    (conversationId, isTyping) => {
      if (!socket || !activeConversation) return;
      socket.emit('support:staffTyping', {
        conversationId,
        customerId: activeConversation.customerId,
        isTyping,
        staffName: currentUser?.username,
      });
    },
    [socket, activeConversation, currentUser]
  );

  const value = {
    // State
    conversations,
    activeConversation,
    loadingList,
    loadingDetail,
    filter,
    setFilter,
    search,
    setSearch,
    page,
    setPage,
    pagination,
    typingUsers,
    stats,
    // Actions
    fetchConversations,
    selectConversation,
    sendMessage,
    uploadAttachment,
    editMessage,
    deleteMessage,
    forwardMessage,
    markMessageRead,
    markAllRead,
    updateStatus,
    assignStaff,
    addNote,
    editNote,
    deleteNote,
    scheduleCallback,
    updateCallback,
    fetchStats,
    emitTyping,
  };

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
};

export const useSupport = () => {
  const ctx = useContext(SupportContext);
  if (!ctx) throw new Error('useSupport must be used within SupportContextProvider');
  return ctx;
};
