/**
 * CustomerChat.jsx
 *
 * Customer-facing chat page at /chat.
 * Lets a customer start a 1-1 chat with: Admin, Agent, or Support Staff.
 *
 * Layout (3-pane):
 *   - Left:    Chat list (existing conversations) + "Start new chat" role picker
 *   - Center:  Active chat with messages, attachment bar, input box
 *   - Right:   (optional) Counterpart info — phone, video call buttons
 *
 * Features:
 *   - Real-time messaging via socket (getMessage event)
 *   - Typing indicator (userTyping event)
 *   - Online status (onlineUsers from SocketContext)
 *   - Per-message read receipts (messageRead event)
 *   - File / Image / PDF sharing (POST /api/messages/:chatId/upload)
 *   - Audio call button (uses CallContext.startCall)
 *   - Video call button (uses CallContext.startCall)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import apiRequest from '../lib/apiRequest';
import { format, isToday, isYesterday } from 'timeago.js';
import {
  FiSend, FiSearch, FiMessageCircle, FiPaperclip, FiX, FiArrowLeft,
  FiPhone, FiVideo, FiImage, FiFile, FiCheck, FiCheckCircle,
  FiPlus, FiLoader,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './CustomerChat.scss';

function formatMessageTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isYesterday(d)) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return format(d);
}

function ChatFilePreview({ attachment }) {
  const fullUrl = attachment.url.startsWith('http')
    ? attachment.url
    : `${window.location.origin}${attachment.url}`;

  if (attachment.type === 'IMAGE') {
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="chat-attachment-image">
        <img src={fullUrl} alt={attachment.fileName} />
      </a>
    );
  }
  if (attachment.type === 'PDF') {
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="chat-attachment-file">
        <FiFile size={20} /> <span>{attachment.fileName}</span> <small>{(attachment.fileSize / 1024).toFixed(0)} KB</small>
      </a>
    );
  }
  return (
    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="chat-attachment-file">
      <FiFile size={20} /> <span>{attachment.fileName}</span> <small>{(attachment.fileSize / 1024).toFixed(0)} KB</small>
    </a>
  );
}

function CustomerChat() {
  const { currentUser } = useAuth();
  const { socket, onlineUsers, typingUsers, emitTyping, isUserOnline, setActiveChatId } = useSocket();
  const { startCall } = useCall();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatRole, setNewChatRole] = useState('ADMIN');
  const [newChatUsers, setNewChatUsers] = useState([]);
  const [newChatLoading, setNewChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ========================================
  // Fetch chats list
  // ========================================
  const fetchChats = useCallback(async () => {
    try {
      const res = await apiRequest.get('/chats');
      setChats(res.data);
    } catch (err) {
      console.error('fetchChats error:', err);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // ========================================
  // When active chat changes, fetch messages
  // ========================================
  useEffect(() => {
    if (!activeChat) {
      setActiveChatId(null);
      return;
    }
    setActiveChatId(activeChat.id);
    apiRequest
      .get(`/chats/${activeChat.id}`)
      .then((res) => setMessages(res.data.messages || []))
      .catch((err) => console.error('fetchMessages error:', err));
  }, [activeChat, setActiveChatId]);

  // ========================================
  // Real-time: incoming message
  // ========================================
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (Number(data.chatId) === Number(activeChat?.id)) {
        setMessages((prev) => {
          // Avoid duplicates (in case we also posted it locally)
          if (prev.some((m) => m.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id,
              text: data.text,
              userId: data.userId,
              createdAt: data.createdAt,
              attachments: data.attachments || [],
              user: {
                id: data.userId,
                username: data.senderName,
                avatar: data.senderAvatar,
              },
              readReceipts: [],
              isOwn: data.userId === currentUser?.id,
            },
          ];
        });
        // Auto-mark-as-read if it's not our own message
        if (data.userId !== currentUser?.id) {
          apiRequest.post(`/messages/${data.id}/read`).catch(() => {});
        }
      } else {
        // Refresh chats list to show updated last message
        fetchChats();
      }
    };
    socket.on('getMessage', handler);
    return () => socket.off('getMessage', handler);
  }, [socket, activeChat, currentUser, fetchChats]);

  // ========================================
  // Real-time: message read receipt
  // ========================================
  useEffect(() => {
    if (!socket) return;
    const handler = ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                readReceipts: [
                  ...(m.readReceipts || []).filter((r) => r.userId !== readBy),
                  { userId: readBy, readAt: new Date().toISOString() },
                ],
              }
            : m
        )
      );
    };
    socket.on('messageRead', handler);
    return () => socket.off('messageRead', handler);
  }, [socket]);

  // ========================================
  // Auto-scroll to bottom on new messages
  // ========================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ========================================
  // Send text message
  // ========================================
  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;
    const messageText = text.trim();
    setText('');
    try {
      const res = await apiRequest.post(`/messages/${activeChat.id}`, {
        text: messageText,
      });
      const msg = res.data;
      // Add to local state
      setMessages((prev) => [...prev, msg]);
      // Emit via socket (for real-time delivery to other party)
      if (socket) {
        socket.emit('sendMessage', {
          receiverId: activeChat.receiver?.id,
          chatId: activeChat.id,
          text: messageText,
          userId: currentUser.id,
          senderName: currentUser.username,
          senderAvatar: currentUser.avatar,
          createdAt: msg.createdAt,
        });
      }
    } catch (err) {
      console.error('send error:', err);
      toast.error('Failed to send message');
    }
  };

  // ========================================
  // Typing indicator
  // ========================================
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!activeChat) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(activeChat.receiver?.id, activeChat.id, true);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(activeChat.receiver?.id, activeChat.id, false);
    }, 1500);
  };

  // ========================================
  // File upload
  // ========================================
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset input
    if (!file || !activeChat) return;

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10 MB)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await apiRequest.post(`/messages/${activeChat.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const attachment = uploadRes.data;

      // Now send the message with the attachment metadata
      const msgRes = await apiRequest.post(`/messages/${activeChat.id}`, {
        text: null,
        attachments: [attachment],
      });
      setMessages((prev) => [...prev, msgRes.data]);
      if (socket) {
        socket.emit('sendMessage', {
          receiverId: activeChat.receiver?.id,
          chatId: activeChat.id,
          text: null,
          userId: currentUser.id,
          senderName: currentUser.username,
          senderAvatar: currentUser.avatar,
          createdAt: msgRes.data.createdAt,
          attachments: msgRes.data.attachments,
        });
      }
      toast.success('File sent');
    } catch (err) {
      console.error('upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // ========================================
  // Start audio call
  // ========================================
  const handleAudioCall = () => {
    if (!activeChat?.receiver) return;
    startCall(activeChat.receiver.id, 'AUDIO', activeChat.receiver);
  };
  const handleVideoCall = () => {
    if (!activeChat?.receiver) return;
    startCall(activeChat.receiver.id, 'VIDEO', activeChat.receiver);
  };

  // ========================================
  // Start new chat (role picker)
  // ========================================
  const openNewChat = async (role) => {
    setNewChatRole(role);
    setShowNewChat(true);
    setNewChatLoading(true);
    try {
      const res = await apiRequest.get(`/users/staff/by-role`, { params: { role } });
      setNewChatUsers(res.data);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setNewChatLoading(false);
    }
  };

  const startNewChat = async (user) => {
    try {
      const res = await apiRequest.post('/chats', { receiverId: user.id });
      const newChat = res.data;
      // Add to chats list (if not already there)
      setChats((prev) => {
        if (prev.some((c) => c.id === newChat.id)) return prev;
        return [newChat, ...prev];
      });
      setActiveChat(newChat);
      setShowNewChat(false);
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error('Failed to start chat');
    }
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${window.location.origin}${avatar}`;
  };

  if (loading) {
    return (
      <div className="customer-chat-loading">
        <FiLoader className="spin" size={32} />
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="customer-chat">
      <div className="customer-chat__layout">
        {/* LEFT: Chat list + new chat picker */}
        <div className="customer-chat__sidebar">
          <div className="customer-chat__sidebar-header">
            <h2>Messages</h2>
            <button className="customer-chat__new-btn" onClick={() => setShowNewChat(true)}>
              <FiPlus /> New
            </button>
          </div>

          {/* New chat role picker */}
          {showNewChat && (
            <div className="customer-chat__role-picker">
              <div className="customer-chat__role-picker-head">
                <h4>Start conversation with:</h4>
                <button onClick={() => setShowNewChat(false)}><FiX size={16} /></button>
              </div>
              <div className="customer-chat__role-tabs">
                {['ADMIN', 'AGENT', 'STAFF'].map((r) => (
                  <button
                    key={r}
                    className={newChatRole === r ? 'active' : ''}
                    onClick={() => openNewChat(r)}
                  >
                    {r === 'ADMIN' ? 'Admin' : r === 'AGENT' ? 'Agent' : 'Support'}
                  </button>
                ))}
              </div>
              <div className="customer-chat__user-list">
                {newChatLoading ? (
                  <div className="customer-chat__user-list-loading"><FiLoader className="spin" /></div>
                ) : newChatUsers.length === 0 ? (
                  <p className="customer-chat__user-list-empty">No {newChatRole.toLowerCase()}s available</p>
                ) : (
                  newChatUsers.map((u) => (
                    <button
                      key={u.id}
                      className="customer-chat__user-item"
                      onClick={() => startNewChat(u)}
                    >
                      <div className="customer-chat__avatar">
                        {getAvatarUrl(u.avatar) ? (
                          <img src={getAvatarUrl(u.avatar)} alt={u.username} />
                        ) : (
                          <span>{u.username[0].toUpperCase()}</span>
                        )}
                        {isUserOnline(u.id) && <span className="customer-chat__online-dot" />}
                      </div>
                      <div>
                        <strong>{u.username}</strong>
                        <small>{u.role.toLowerCase()}</small>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Existing chats */}
          <div className="customer-chat__chat-list">
            {chats.length === 0 ? (
              <div className="customer-chat__empty">
                <FiMessageCircle size={32} />
                <p>No conversations yet</p>
                <button onClick={() => setShowNewChat(true)}>Start a chat</button>
              </div>
            ) : (
              chats.map((chat) => {
                const isActive = activeChat?.id === chat.id;
                const isOnline = isUserOnline(chat.receiver?.id);
                return (
                  <button
                    key={chat.id}
                    className={`customer-chat__chat-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveChat(chat)}
                  >
                    <div className="customer-chat__avatar">
                      {getAvatarUrl(chat.receiver?.avatar) ? (
                        <img src={getAvatarUrl(chat.receiver?.avatar)} alt={chat.receiver?.username} />
                      ) : (
                        <span>{chat.receiver?.username?.[0]?.toUpperCase() || '?'}</span>
                      )}
                      {isOnline && <span className="customer-chat__online-dot" />}
                    </div>
                    <div className="customer-chat__chat-info">
                      <div className="customer-chat__chat-top">
                        <strong>{chat.receiver?.username}</strong>
                        <small>{chat.lastMessage ? formatMessageTime(chat.updatedAt) : ''}</small>
                      </div>
                      <p className="customer-chat__chat-preview">
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {!chat.hasSeen && chat.lastMessage && (
                      <span className="customer-chat__unread-dot" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER: Active chat */}
        <div className="customer-chat__main">
          {!activeChat ? (
            <div className="customer-chat__no-active">
              <FiMessageCircle size={64} />
              <h2>Select a conversation</h2>
              <p>Choose a chat from the sidebar or start a new conversation with our admin, agent, or support staff.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="customer-chat__chat-header">
                <button className="customer-chat__back" onClick={() => setActiveChat(null)}>
                  <FiArrowLeft />
                </button>
                <div className="customer-chat__avatar">
                  {getAvatarUrl(activeChat.receiver?.avatar) ? (
                    <img src={getAvatarUrl(activeChat.receiver?.avatar)} alt={activeChat.receiver?.username} />
                  ) : (
                    <span>{activeChat.receiver?.username?.[0]?.toUpperCase() || '?'}</span>
                  )}
                  {isUserOnline(activeChat.receiver?.id) && <span className="customer-chat__online-dot" />}
                </div>
                <div className="customer-chat__chat-header-info">
                  <strong>{activeChat.receiver?.username}</strong>
                  <small>
                    {typingUsers[activeChat.id]
                      ? 'typing...'
                      : isUserOnline(activeChat.receiver?.id)
                      ? 'Online'
                      : 'Offline'}
                  </small>
                </div>
                <div className="customer-chat__chat-header-actions">
                  <button onClick={handleAudioCall} title="Audio call">
                    <FiPhone size={18} />
                  </button>
                  <button onClick={handleVideoCall} title="Video call">
                    <FiVideo size={18} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="customer-chat__messages">
                {messages.map((msg) => {
                  const isOwn = msg.userId === currentUser?.id;
                  const isRead = (msg.readReceipts || []).some(
                    (r) => r.userId !== currentUser?.id
                  );
                  return (
                    <div
                      key={msg.id}
                      className={`customer-chat__msg ${isOwn ? 'own' : 'other'}`}
                    >
                      <div className="customer-chat__msg-bubble">
                        {msg.text && <p>{msg.text}</p>}
                        {msg.attachments?.map((att, idx) => (
                          <ChatFilePreview key={idx} attachment={att} />
                        ))}
                      </div>
                      <div className="customer-chat__msg-meta">
                        <small>{formatMessageTime(msg.createdAt)}</small>
                        {isOwn && (
                          isRead ? <FiCheckCircle size={12} color="#3b82f6" /> : <FiCheck size={12} color="#94a3b8" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="customer-chat__input-bar">
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                />
                <button
                  className="customer-chat__attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach file"
                >
                  {uploading ? <FiLoader className="spin" /> : <FiPaperclip />}
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  className="customer-chat__send-btn"
                  onClick={handleSend}
                  disabled={!text.trim()}
                >
                  <FiSend />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerChat;
