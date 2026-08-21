import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { format } from 'timeago.js';
import {
  FiSend, FiSearch, FiMessageCircle, FiPhone, FiVideo, FiX,
  FiSmile, FiCheck, FiCheckSquare, FiEdit, FiArrowLeft,
  FiMic, FiMicOff, FiVideoOff, FiPhoneOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminChat.scss';

// ── Emojis ───────────────────────────────────────────────────────────────────
const EMOJIS = ['😊','😂','❤️','👍','🙏','🔥','✅','😎','🎉','💯','👋','🤔','😅','💪','🙌'];

function EmojiPicker({ onSelect, onClose }) {
  return (
    <div className="ac-emoji-picker">
      {EMOJIS.map((e) => (
        <button key={e} type="button" onClick={() => { onSelect(e); onClose(); }}>{e}</button>
      ))}
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="ac-typing-bubble">
      <div className="ac-typing-dots"><span /><span /><span /></div>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 40, online }) {
  const letter = (user?.username || '?')[0].toUpperCase();
  return (
    <div className="ac-avatar" style={{ width: size, height: size, minWidth: size }}>
      {user?.avatar
        ? <img src={user.avatar} alt={user.username} />
        : <span style={{ fontSize: size * 0.38 }}>{letter}</span>}
      {online !== undefined && (
        <span className={`ac-dot ${online ? 'ac-dot--on' : 'ac-dot--off'}`} />
      )}
    </div>
  );
}

// ── New-chat modal ───────────────────────────────────────────────────────────
function NewChatModal({ onClose, onSelect, excludeUserId }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest.get('/users')
      .then(r => setUsers((Array.isArray(r.data) ? r.data : []).filter(u => u.isActive !== false && Number(u.id) !== Number(excludeUserId))))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [excludeUserId]);

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={e => e.stopPropagation()}>
        <div className="ac-modal__head">
          <h4>New Conversation</h4>
          <button type="button" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="ac-modal__search">
          <FiSearch size={14} />
          <input
            autoFocus
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ac-modal__list">
          {loading ? (
            <div className="ac-modal__empty"><div className="ac-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="ac-modal__empty"><p>No users found</p></div>
          ) : (
            filtered.map(u => (
              <div key={u.id} className="ac-modal__user" onClick={() => onSelect(u)}>
                <Avatar user={u} size={36} />
                <div>
                  <p className="ac-modal__uname">{u.username}</p>
                  <p className="ac-modal__uemail">{u.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Message row ──────────────────────────────────────────────────────────────
function MessageRow({ msg, isMine, showAvatar, sender }) {
  return (
    <div className={`ac-msg ${isMine ? 'ac-msg--out' : 'ac-msg--in'}`}>
      {!isMine && (
        showAvatar
          ? <Avatar user={sender} size={28} />
          : <div style={{ width: 28, minWidth: 28 }} />
      )}
      <div className="ac-msg__col">
        {!isMine && showAvatar && (
          <span className="ac-msg__name">{sender?.username}</span>
        )}
        <div className={`ac-msg__bubble${msg._pending ? ' ac-msg__bubble--pending' : ''}`}>
          {msg.text}
        </div>
        <div className="ac-msg__meta">
          {format(msg.createdAt)}
          {isMine && (
            <span className="ac-msg__tick">
              {msg._seen ? <FiCheckSquare size={10} /> : <FiCheck size={10} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin Call UI (in-call overlay) ─────────────────────────────────────────
function AdminCallUI({ callState, onEnd, localStreamRef, toggleMute, toggleCamera }) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted]   = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    const onRemote = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.detail;
    };
    window.addEventListener('remoteStream', onRemote);
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => { window.removeEventListener('remoteStream', onRemote); clearInterval(timer); };
  }, [localStreamRef]);
  const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  return (
    <div className="ac-call-overlay">
      <div className={`ac-active-call ${callState.type === 'video' ? 'ac-active-call--video' : ''}`}>
        {callState.type === 'video' ? (
          <>
            <video ref={remoteVideoRef} className="ac-video-remote" autoPlay playsInline />
            <video ref={localVideoRef}  className="ac-video-local"  autoPlay playsInline muted />
          </>
        ) : (
          <div className="ac-audio-call-ui">
            <Avatar user={callState.remoteUser} size={80} />
            <h3 style={{ color: '#fff', margin: 0 }}>{callState.remoteUser?.username}</h3>
            <p style={{ color: '#a5b4fc', margin: 0 }}>{fmt(duration)}</p>
            <audio ref={remoteVideoRef} autoPlay style={{ display: 'none' }} />
          </div>
        )}
        <div className="ac-call-controls-bar">
          <button className={`ac-ctrl ${muted ? 'ac-ctrl--on' : ''}`} onClick={() => { toggleMute(); setMuted(m=>!m); }}>{muted ? <FiMicOff size={18}/> : <FiMic size={18}/>}</button>
          {callState.type === 'video' && <button className={`ac-ctrl ${camOff ? 'ac-ctrl--on' : ''}`} onClick={() => { toggleCamera(); setCamOff(c=>!c); }}>{camOff ? <FiVideoOff size={18}/> : <FiVideo size={18}/>}</button>}
          <button className="ac-ctrl ac-ctrl--end" onClick={() => onEnd(duration)}><FiPhoneOff size={18}/></button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminChat component ─────────────────────────────────────────────────
export default function AdminChat() {
  const {
    socket, isUserOnline, emitTyping,
    typingUsers, setActiveChatId,
    chatNotifications, clearChatNotification,
    callState, localStreamRef, startCall, answerCall, rejectCall, endCall,
    toggleMute, toggleCamera,
  } = useSocket();
  const { currentUser } = useAuth();

  const [chats, setChats]               = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState('');
  const [search, setSearch]             = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [sending, setSending]           = useState(false);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [showNewChat, setShowNewChat]   = useState(false);
  const [mobileChatOpen, setMobileChat] = useState(false);

  const bottomRef       = useRef(null);
  const inputRef        = useRef(null);
  const typingTimer     = useRef(null);
  // Keep selectedChat in a ref so socket callbacks always have the latest value
  const selectedChatRef = useRef(null);
  selectedChatRef.current = selectedChat;
  // Keep loadChats in a ref to avoid stale closures inside socket handlers
  const loadChatsRef = useRef(null);

  // ── scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── load chat list ───────────────────────────────────────────────────────
  const [chatsError, setChatsError] = useState(false);
  const loadChats = useCallback(async () => {
    try {
      const res = await apiRequest.get('/chats');
      setChats(res.data || []);
      setChatsError(false);
    } catch (err) {
      console.error('loadChats:', err);
      setChatsError(true);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // Store latest loadChats in ref so socket handlers can call it without staleness
  useEffect(() => { loadChatsRef.current = loadChats; }, [loadChats]);

  useEffect(() => { loadChats(); }, [loadChats]);

  // ── socket: incoming message ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onMessage = (data) => {
      const inChatId = Number(data.chatId);
      const cur = selectedChatRef.current;

      if (cur && Number(cur.id) === inChatId) {
        // Append to open conversation — dedupe by id (socket echo vs saved row)
        setMessages(prev => {
          if (data.id != null && prev.some(m => Number(m.id) === Number(data.id))) return prev;
          return [...prev, {
            id       : data.id ?? `sock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            text     : data.text,
            userId   : Number(data.userId),
            chatId   : inChatId,
            createdAt: data.createdAt || new Date().toISOString(),
            user     : { username: data.senderName, avatar: data.senderAvatar },
          }];
        });
        // Silently mark read
        apiRequest.put(`/chats/read/${inChatId}`).catch(() => {});
      }

      // Always refresh sidebar (updates lastMessage, timestamp, unread)
      loadChatsRef.current?.();
    };

    socket.on('getMessage', onMessage);
    return () => socket.off('getMessage', onMessage);
  }, [socket]);

  // ── open a chat ──────────────────────────────────────────────────────────
  const openChat = useCallback(async (chat) => {
    // Avoid re-opening the same chat
    if (selectedChatRef.current?.id === chat.id && !loadingMsgs) return;

    setLoadingMsgs(true);
    setMobileChat(true);
    setShowEmoji(false);
    setText('');

    try {
      const res = await apiRequest.get(`/chats/${chat.id}`);
      const full = res.data;
      setSelectedChat(full);
      setMessages(full.messages || []);
      setActiveChatId(Number(full.id));
      clearChatNotification(full.id);
    } catch (err) {
      console.error('openChat:', err);
      toast.error('Could not open chat');
    } finally {
      setLoadingMsgs(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [setActiveChatId, clearChatNotification]);

  // ── start a new chat with a user (from the modal) ────────────────────────
  const startChat = useCallback(async (user) => {
    setShowNewChat(false);
    try {
      const res = await apiRequest.post('/chats', { receiverId: user.id });
      const chat = res.data;
      // Add/refresh in sidebar
      await loadChats();
      // Open it
      openChat(chat);
    } catch (err) {
      console.error('startChat:', err);
      toast.error('Could not start conversation');
    }
  }, [loadChats, openChat]);

  // ── send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedChatRef.current || sending) return;

    const chat   = selectedChatRef.current;
    const tempId = `tmp_${Date.now()}`;
    const temp   = {
      id       : tempId,
      text     : trimmed,
      userId   : Number(currentUser.id),
      chatId   : Number(chat.id),
      createdAt: new Date().toISOString(),
      _pending : true,
    };

    setMessages(prev => [...prev, temp]);
    setText('');
    setSending(true);

    // stop typing
    clearTimeout(typingTimer.current);
    const receiver = getReceiver(chat);
    if (receiver) emitTyping(receiver.id, chat.id, false);

    try {
      const res  = await apiRequest.post(`/messages/${chat.id}`, { text: trimmed });
      const saved = res.data;

      setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, _pending: false } : m));

      // Emit via socket so receiver gets it live
      if (socket && receiver) {
        socket.emit('sendMessage', {
          receiverId  : receiver.id,
          chatId      : Number(chat.id),
          id          : saved.id,
          text        : trimmed,
          userId      : Number(currentUser.id),
          senderName  : currentUser.username,
          senderAvatar: currentUser.avatar || null,
          createdAt   : saved.createdAt,
        });
      }

      loadChatsRef.current?.();
    } catch (err) {
      console.error('sendMessage:', err);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(trimmed); // restore
    } finally {
      setSending(false);
    }
  }, [text, sending, currentUser, socket, emitTyping]);

  // ── typing ───────────────────────────────────────────────────────────────
  const onTextChange = (e) => {
    setText(e.target.value);
    const chat = selectedChatRef.current;
    if (!chat) return;
    const receiver = getReceiver(chat);
    if (!receiver) return;
    emitTyping(receiver.id, chat.id, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(receiver.id, chat.id, false), 2000);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  // Works for getChats shape { receiver } AND getChat shape { participants[] }
  const getReceiver = (chat) => {
    if (!chat) return null;
    if (chat.receiver) return chat.receiver;
    const p = chat.participants?.find(p => Number(p.userId) !== Number(currentUser.id));
    return p?.user || null;
  };

  const getUnread = (chat) =>
    chatNotifications.find(n => n.chatId === Number(chat.id))?.count || 0;

  const isUnread = (chat) =>
    getUnread(chat) > 0 || chat.hasSeen === false;

  const filteredChats = chats.filter(c => {
    const u = getReceiver(c);
    if (!u) return false;
    const q = search.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const otherUser     = getReceiver(selectedChat);
  const otherOnline   = isUserOnline(otherUser?.id);
  const isTyping      = selectedChat ? typingUsers[Number(selectedChat.id)] : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-chat">
      {/* WebRTC: Incoming call */}
      {callState.status === 'ringing' && (
        <div className="ac-call-overlay">
          <div className="ac-incoming-call">
            <Avatar user={callState.remoteUser} size={64} />
            <h3>{callState.remoteUser?.username || 'User'}</h3>
            <p>Incoming {callState.type === 'video' ? '📹 Video' : '📞 Audio'} Call…</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <button className="ac-call-btn ac-call-btn--reject" onClick={rejectCall}><FiPhoneOff size={20} /></button>
              <button className="ac-call-btn ac-call-btn--answer" onClick={answerCall}><FiPhone size={20} /></button>
            </div>
          </div>
        </div>
      )}
      {/* WebRTC: Calling outgoing */}
      {callState.status === 'calling' && (
        <div className="ac-call-overlay">
          <div className="ac-incoming-call">
            <Avatar user={callState.remoteUser} size={64} />
            <h3>{callState.remoteUser?.username || 'User'}</h3>
            <p>Calling…</p>
            <button className="ac-call-btn ac-call-btn--reject" onClick={() => endCall(0)}><FiPhoneOff size={20} /></button>
          </div>
        </div>
      )}
      {/* WebRTC: In call */}
      {callState.status === 'in-call' && <AdminCallUI callState={callState} onEnd={endCall} localStreamRef={localStreamRef} toggleMute={toggleMute} toggleCamera={toggleCamera} />}

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} onSelect={startChat} excludeUserId={currentUser?.id} />
      )}

      <div className={`ac-root ${mobileChatOpen ? 'ac-root--chat' : ''}`}>

        {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
        <aside className="ac-sidebar">
          <div className="ac-sidebar__head">
            <span className="ac-sidebar__title">Messages</span>
            <button
              type="button"
              className="ac-new-btn"
              onClick={() => setShowNewChat(true)}
              title="New conversation"
            >
              <FiEdit size={16} />
            </button>
          </div>

          <div className="ac-sidebar__search">
            <FiSearch size={14} />
            <input
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}><FiX size={13} /></button>
            )}
          </div>

          <div className="ac-sidebar__list">
            {loadingChats ? (
              <div className="ac-placeholder"><div className="ac-spinner" /></div>
            ) : chatsError ? (
              <div className="ac-placeholder ac-placeholder--empty">
                <FiMessageCircle size={30} />
                <p>Couldn&apos;t load conversations</p>
                <button className="ac-start-btn" onClick={() => { setLoadingChats(true); loadChats(); }}>
                  Try again
                </button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="ac-placeholder ac-placeholder--empty">
                <FiMessageCircle size={30} />
                <p>{search ? 'No results' : 'No conversations yet'}</p>
                {!search && (
                  <button className="ac-start-btn" onClick={() => setShowNewChat(true)}>
                    Start a conversation
                  </button>
                )}
              </div>
            ) : (
              filteredChats.map(chat => {
                const u      = getReceiver(chat);
                if (!u) return null;
                const online = isUserOnline(u.id);
                const unread = isUnread(chat);
                const cnt    = getUnread(chat);
                const active = selectedChat?.id === chat.id;
                const typing = typingUsers[Number(chat.id)];

                return (
                  <div
                    key={chat.id}
                    className={`ac-thread${active ? ' ac-thread--active' : ''}${unread ? ' ac-thread--unread' : ''}`}
                    onClick={() => openChat(chat)}
                  >
                    <Avatar user={u} size={44} online={online} />
                    <div className="ac-thread__body">
                      <div className="ac-thread__top">
                        <span className="ac-thread__name">{u.username}</span>
                        <span className="ac-thread__time">
                          {chat.updatedAt ? format(chat.updatedAt) : ''}
                        </span>
                      </div>
                      <div className="ac-thread__bot">
                        <span className="ac-thread__preview">
                          {typing
                            ? <em className="ac-thread__typing">typing…</em>
                            : (chat.lastMessage || 'No messages yet')}
                        </span>
                        {cnt > 0 && (
                          <span className="ac-badge">{cnt > 99 ? '99+' : cnt}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ══ CHAT PANEL ═══════════════════════════════════════════════════ */}
        <main className={`ac-panel${mobileChatOpen ? ' ac-panel--open' : ''}`}>
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="ac-panel__head">
                <button
                  type="button"
                  className="ac-back"
                  onClick={() => { setMobileChat(false); setActiveChatId(null); }}
                >
                  <FiArrowLeft size={18} />
                </button>

                <Avatar user={otherUser} size={36} online={otherOnline} />

                <div className="ac-panel__info">
                  <span className="ac-panel__name">{otherUser?.username || 'User'}</span>
                  <span className={`ac-panel__status${otherOnline ? ' online' : ''}`}>
                    {otherOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {otherUser?.phone && (
                  <a href={`tel:${otherUser.phone}`} className="ac-head-btn" title="Call">
                    <FiPhone size={16} />
                  </a>
                )}
                <button
                  className="ac-head-btn"
                  title="Audio Call"
                  disabled={callState.status !== 'idle'}
                  onClick={() => otherUser && startCall(otherUser, selectedChat.id, 'audio')}
                >
                  <FiPhone size={16} />
                </button>
                <button
                  className="ac-head-btn ac-head-btn--video"
                  title="Video Call"
                  disabled={callState.status !== 'idle'}
                  onClick={() => otherUser && startCall(otherUser, selectedChat.id, 'video')}
                >
                  <FiVideo size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="ac-panel__msgs">
                {loadingMsgs ? (
                  <div className="ac-placeholder"><div className="ac-spinner" /><p>Loading…</p></div>
                ) : messages.length === 0 ? (
                  <div className="ac-placeholder ac-placeholder--empty">
                    <FiMessageCircle size={40} />
                    <p>No messages yet — say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine    = Number(msg.userId) === Number(currentUser.id);
                    const prev      = messages[idx - 1];
                    const showAvatar = !isMine && (!prev || Number(prev.userId) !== Number(msg.userId));
                    const sender    = msg.user || otherUser;
                    return (
                      <MessageRow
                        key={msg.id ?? idx}
                        msg={msg}
                        isMine={isMine}
                        showAvatar={showAvatar}
                        sender={sender}
                      />
                    );
                  })
                )}
                {isTyping && <TypingBubble />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="ac-panel__input">
                {showEmoji && (
                  <EmojiPicker
                    onSelect={e => setText(p => p + e)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
                <button
                  type="button"
                  className="ac-icon-btn"
                  onClick={() => setShowEmoji(v => !v)}
                  title="Emoji"
                >
                  <FiSmile size={19} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message…"
                  value={text}
                  onChange={onTextChange}
                  onKeyDown={onKeyDown}
                  disabled={sending}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className={`ac-send${text.trim() && !sending ? ' ac-send--on' : ''}`}
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                >
                  {sending ? <span className="ac-send-spin" /> : <FiSend size={16} />}
                </button>
              </div>
            </>
          ) : (
            <div className="ac-placeholder ac-placeholder--empty ac-placeholder--full">
              <FiMessageCircle size={56} />
              <h3>Your Messages</h3>
              <p>Select a conversation or start a new one</p>
              <button className="ac-start-btn" onClick={() => setShowNewChat(true)}>
                <FiEdit size={14} /> New Conversation
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
