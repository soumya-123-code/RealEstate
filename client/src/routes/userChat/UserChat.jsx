import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { format } from 'timeago.js';
import {
  FiSend, FiSearch, FiMessageCircle, FiPhone, FiVideo,
  FiSmile, FiCheck, FiCheckSquare, FiX, FiArrowLeft,
  FiMic, FiMicOff, FiVideoOff, FiPhoneOff,
  FiEdit
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './UserChat.scss';

const EMOJIS = ['😊','😂','❤️','👍','🙏','🔥','✅','😎','🎉','💯','👋','🤔','😅','💪','🙌'];

// ── Emoji Picker ──────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  return (
    <div className="uc-emoji-picker">
      {EMOJIS.map((e) => (
        <button key={e} type="button" onClick={() => { onSelect(e); onClose(); }}>{e}</button>
      ))}
    </div>
  );
}

// ── Typing Bubble ─────────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="uc-typing-bubble">
      <div className="uc-typing-dots"><span /><span /><span /></div>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 40, online }) {
  const letter = (user?.username || '?')[0].toUpperCase();
  return (
    <div className="uc-avatar" style={{ width: size, height: size, minWidth: size }}>
      {user?.avatar
        ? <img src={user.avatar} alt={user.username} />
        : <span style={{ fontSize: size * 0.38 }}>{letter}</span>}
      {online !== undefined && (
        <span className={`uc-dot ${online ? 'uc-dot--on' : 'uc-dot--off'}`} />
      )}
    </div>
  );
}

// ── Message Row ───────────────────────────────────────────────────────────────
function MessageRow({ msg, isMine, showAvatar, sender }) {
  return (
    <div className={`uc-msg ${isMine ? 'uc-msg--out' : 'uc-msg--in'}`}>
      {!isMine && (
        showAvatar
          ? <Avatar user={sender} size={28} />
          : <div style={{ width: 28, minWidth: 28 }} />
      )}
      <div className="uc-msg__col">
        {!isMine && showAvatar && (
          <span className="uc-msg__name">{sender?.username}</span>
        )}
        <div className={`uc-msg__bubble${msg._pending ? ' uc-msg__bubble--pending' : ''}`}>
          {msg.text}
        </div>
        <div className="uc-msg__meta">
          {format(msg.createdAt)}
          {isMine && (
            <span className="uc-msg__tick">
              {msg._seen ? <FiCheckSquare size={10} /> : <FiCheck size={10} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New Chat Modal ────────────────────────────────────────────────────────────
function NewChatModal({ onClose, onSelect }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest.get('/users/admin')
      .then(r => setUsers(r.data ? [r.data] : []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="uc-modal-overlay" onClick={onClose}>
      <div className="uc-modal" onClick={e => e.stopPropagation()}>
        <div className="uc-modal__head">
          <h4>New Conversation</h4>
          <button type="button" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="uc-modal__search">
          <FiSearch size={14} />
          <input autoFocus placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="uc-modal__list">
          {loading ? (
            <div className="uc-modal__empty"><div className="uc-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="uc-modal__empty"><p>No users found</p></div>
          ) : (
            filtered.map(u => (
              <div key={u.id} className="uc-modal__user" onClick={() => onSelect(u)}>
                <Avatar user={u} size={36} />
                <div>
                  <p className="uc-modal__uname">{u.username}</p>
                  <p className="uc-modal__uemail">{u.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Incoming Call Modal ───────────────────────────────────────────────────────
function IncomingCallModal({ callState, onAnswer, onReject }) {
  return (
    <div className="uc-call-overlay">
      <div className="uc-incoming-call">
        <div className="uc-incoming-call__pulse" />
        <Avatar user={callState.remoteUser} size={72} />
        <h3>{callState.remoteUser?.username || 'Unknown'}</h3>
        <p className="uc-incoming-call__type">
          Incoming {callState.type === 'video' ? '📹 Video' : '📞 Audio'} Call…
        </p>
        <div className="uc-incoming-call__actions">
          <button className="uc-call-btn uc-call-btn--reject" onClick={onReject} title="Decline">
            <FiPhoneOff size={22} />
          </button>
          <button className="uc-call-btn uc-call-btn--answer" onClick={onAnswer} title="Answer">
            <FiPhone size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Active Call Overlay ───────────────────────────────────────────────────────
function ActiveCallOverlay({ callState, onEnd, localStreamRef, toggleMute, toggleCamera }) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted]     = useState(false);
  const [camOff, setCamOff]   = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Attach local stream
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    // Listen for remote stream
    const onRemote = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.detail;
      }
    };
    window.addEventListener('remoteStream', onRemote);

    // Duration timer
    const timer = setInterval(() => setDuration(d => d + 1), 1000);

    return () => {
      window.removeEventListener('remoteStream', onRemote);
      clearInterval(timer);
    };
  }, [localStreamRef]);

  const fmtDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleMute = () => {
    toggleMute();
    setMuted(m => !m);
  };
  const handleCam = () => {
    toggleCamera();
    setCamOff(c => !c);
  };

  return (
    <div className="uc-call-overlay">
      <div className={`uc-active-call ${callState.type === 'video' ? 'uc-active-call--video' : ''}`}>
        {callState.type === 'video' ? (
          <>
            <video ref={remoteVideoRef} className="uc-video-remote" autoPlay playsInline />
            <video ref={localVideoRef}  className="uc-video-local"  autoPlay playsInline muted />
          </>
        ) : (
          <div className="uc-audio-call-ui">
            <div className="uc-audio-rings">
              <div className="uc-audio-ring uc-audio-ring--1" />
              <div className="uc-audio-ring uc-audio-ring--2" />
              <Avatar user={callState.remoteUser} size={88} />
            </div>
            <h3>{callState.remoteUser?.username || 'User'}</h3>
            <p className="uc-call-duration">{fmtDuration(duration)}</p>
            {/* Hidden audio element for remote */}
            <audio ref={remoteVideoRef} autoPlay style={{ display: 'none' }} />
          </div>
        )}

        <div className="uc-call-controls">
          <button
            className={`uc-ctrl-btn ${muted ? 'uc-ctrl-btn--active' : ''}`}
            onClick={handleMute}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <FiMicOff size={20} /> : <FiMic size={20} />}
          </button>
          {callState.type === 'video' && (
            <button
              className={`uc-ctrl-btn ${camOff ? 'uc-ctrl-btn--active' : ''}`}
              onClick={handleCam}
              title={camOff ? 'Camera On' : 'Camera Off'}
            >
              {camOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
            </button>
          )}
          <button className="uc-ctrl-btn uc-ctrl-btn--end" onClick={() => onEnd(duration)} title="End Call">
            <FiPhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Calling Overlay (outgoing) ────────────────────────────────────────────────
function CallingOverlay({ callState, onCancel }) {
  return (
    <div className="uc-call-overlay">
      <div className="uc-calling-modal">
        <div className="uc-incoming-call__pulse" />
        <Avatar user={callState.remoteUser} size={72} />
        <h3>{callState.remoteUser?.username || 'User'}</h3>
        <p className="uc-incoming-call__type">
          Calling… {callState.type === 'video' ? '📹 Video' : '📞 Audio'}
        </p>
        <button className="uc-call-btn uc-call-btn--reject" onClick={onCancel}>
          <FiPhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}

// ── Main UserChat ─────────────────────────────────────────────────────────────
export default function UserChat() {
  const navigate = useNavigate();
  const {
    socket, isUserOnline, emitTyping, typingUsers,
    setActiveChatId, chatNotifications, clearChatNotification,
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
  const selectedChatRef = useRef(null);
  const loadChatsRef    = useRef(null);
  selectedChatRef.current = selectedChat;

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat list
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
  useEffect(() => { loadChatsRef.current = loadChats; }, [loadChats]);
  useEffect(() => { loadChats(); }, [loadChats]);

  // Socket: incoming message
  useEffect(() => {
    if (!socket) return;
    const onMessage = (data) => {
      const inChatId = Number(data.chatId);
      const cur = selectedChatRef.current;
      if (cur && Number(cur.id) === inChatId) {
        setMessages(prev => {
          // Dedupe by id — the same message can arrive via socket echo
          // while the saved row is already in the list.
          if (data.id != null && prev.some(m => m.id === data.id)) return prev;
          return [...prev, {
            id       : data.id ?? `sock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            text     : data.text,
            userId   : Number(data.userId),
            chatId   : inChatId,
            createdAt: data.createdAt || new Date().toISOString(),
            user     : { username: data.senderName, avatar: data.senderAvatar },
          }];
        });
        apiRequest.put(`/chats/read/${inChatId}`).catch(() => {});
      }
      loadChatsRef.current?.();
    };
    socket.on('getMessage', onMessage);
    return () => socket.off('getMessage', onMessage);
  }, [socket]);

  // Open a chat
  const openChat = useCallback(async (chat) => {
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
      toast.error('Could not open chat');
    } finally {
      setLoadingMsgs(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [setActiveChatId, clearChatNotification]);

  // Start new chat
  const startChat = useCallback(async (user) => {
    setShowNewChat(false);
    try {
      const res = await apiRequest.post('/chats', { receiverId: user.id });
      await loadChats();
      openChat(res.data);
    } catch (err) {
      toast.error('Could not start conversation');
    }
  }, [loadChats, openChat]);

  // Send message
  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedChatRef.current || sending) return;
    const chat = selectedChatRef.current;
    const tempId = `tmp_${Date.now()}`;
    const temp = {
      id: tempId, text: trimmed,
      userId: Number(currentUser.id), chatId: Number(chat.id),
      createdAt: new Date().toISOString(), _pending: true,
    };
    setMessages(prev => [...prev, temp]);
    setText('');
    setSending(true);
    clearTimeout(typingTimer.current);
    const receiver = getReceiver(chat);
    if (receiver) emitTyping(receiver.id, chat.id, false);
    try {
      const res = await apiRequest.post(`/messages/${chat.id}`, { text: trimmed });
      const saved = res.data;
      setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, _pending: false } : m));
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
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, sending, currentUser, socket, emitTyping]);

  // Typing
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

  // Helpers
  const getReceiver = (chat) => {
    if (!chat) return null;
    if (chat.receiver) return chat.receiver;
    const p = chat.participants?.find(p => Number(p.userId) !== Number(currentUser?.id));
    return p?.user || null;
  };

  const getUnread = (chat) =>
    chatNotifications.find(n => n.chatId === Number(chat.id))?.count || 0;
  const isUnread = (chat) => getUnread(chat) > 0 || chat.hasSeen === false;

  const filteredChats = chats.filter(c => {
    const u = getReceiver(c);
    if (!u) return false;
    const q = search.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const otherUser   = getReceiver(selectedChat);
  const otherOnline = isUserOnline(otherUser?.id);
  const isTyping    = selectedChat ? typingUsers[Number(selectedChat.id)] : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="user-chat">
      {/* WebRTC Modals */}
      {callState.status === 'ringing' && (
        <IncomingCallModal callState={callState} onAnswer={answerCall} onReject={rejectCall} />
      )}
      {callState.status === 'calling' && (
        <CallingOverlay callState={callState} onCancel={() => endCall(0)} />
      )}
      {callState.status === 'in-call' && (
        <ActiveCallOverlay
          callState={callState}
          onEnd={endCall}
          localStreamRef={localStreamRef}
          toggleMute={toggleMute}
          toggleCamera={toggleCamera}
        />
      )}

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} onSelect={startChat} />
      )}

      <div className={`uc-root ${mobileChatOpen ? 'uc-root--chat' : ''}`}>

        {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
        <aside className="uc-sidebar">
          <div className="uc-sidebar__head">
            <span className="uc-sidebar__title">Messages</span>
            <button type="button" className="uc-new-btn" onClick={() => setShowNewChat(true)} title="New conversation">
              <FiEdit size={16} />
            </button>
          </div>

          <div className="uc-sidebar__search">
            <FiSearch size={14} />
            <input
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button type="button" onClick={() => setSearch('')}><FiX size={13} /></button>}
          </div>

          <div className="uc-sidebar__list">
            {loadingChats ? (
              <div className="uc-placeholder"><div className="uc-spinner" /></div>
            ) : chatsError ? (
              <div className="uc-placeholder uc-placeholder--empty">
                <FiMessageCircle size={30} />
                <p>Couldn&apos;t load conversations</p>
                <button className="uc-start-btn" onClick={() => { setLoadingChats(true); loadChats(); }}>
                  Try again
                </button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="uc-placeholder uc-placeholder--empty">
                <FiMessageCircle size={30} />
                <p>{search ? 'No results' : 'No conversations yet'}</p>
                {!search && (
                  <button className="uc-start-btn" onClick={() => setShowNewChat(true)}>
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
                    className={`uc-thread${active ? ' uc-thread--active' : ''}${unread ? ' uc-thread--unread' : ''}`}
                    onClick={() => openChat(chat)}
                  >
                    <Avatar user={u} size={44} online={online} />
                    <div className="uc-thread__body">
                      <div className="uc-thread__top">
                        <span className="uc-thread__name">{u.username}</span>
                        <span className="uc-thread__time">{chat.updatedAt ? format(chat.updatedAt) : ''}</span>
                      </div>
                      <div className="uc-thread__bot">
                        <span className="uc-thread__preview">
                          {typing
                            ? <em className="uc-thread__typing">typing…</em>
                            : (chat.lastMessage || 'No messages yet')}
                        </span>
                        {cnt > 0 && <span className="uc-badge">{cnt > 99 ? '99+' : cnt}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ══ CHAT PANEL ═══════════════════════════════════════════════════ */}
        <main className={`uc-panel${mobileChatOpen ? ' uc-panel--open' : ''}`}>
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="uc-panel__head">
                <button type="button" className="uc-back" onClick={() => { setMobileChat(false); setActiveChatId(null); }}>
                  <FiArrowLeft size={18} />
                </button>
                <Avatar user={otherUser} size={36} online={otherOnline} />
                <div className="uc-panel__info">
                  <span className="uc-panel__name">{otherUser?.username || 'User'}</span>
                  <span className={`uc-panel__status${otherOnline ? ' online' : ''}`}>
                    {otherOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Audio Call Button */}
                <button
                  type="button"
                  className="uc-head-btn"
                  title="Audio Call"
                  disabled={callState.status !== 'idle'}
                  onClick={() => otherUser && startCall(otherUser, selectedChat.id, 'audio')}
                >
                  <FiPhone size={17} />
                </button>

                {/* Video Call Button */}
                <button
                  type="button"
                  className="uc-head-btn uc-head-btn--video"
                  title="Video Call"
                  disabled={callState.status !== 'idle'}
                  onClick={() => otherUser && startCall(otherUser, selectedChat.id, 'video')}
                >
                  <FiVideo size={17} />
                </button>
              </div>

              {/* Messages */}
              <div className="uc-panel__msgs">
                {loadingMsgs ? (
                  <div className="uc-placeholder"><div className="uc-spinner" /><p>Loading…</p></div>
                ) : messages.length === 0 ? (
                  <div className="uc-placeholder uc-placeholder--empty">
                    <FiMessageCircle size={40} />
                    <p>No messages yet — say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine     = Number(msg.userId) === Number(currentUser.id);
                    const prev       = messages[idx - 1];
                    const showAvatar = !isMine && (!prev || Number(prev.userId) !== Number(msg.userId));
                    const sender     = msg.user || otherUser;
                    return (
                      <MessageRow key={msg.id ?? idx} msg={msg} isMine={isMine} showAvatar={showAvatar} sender={sender} />
                    );
                  })
                )}
                {isTyping && <TypingBubble />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="uc-panel__input">
                {showEmoji && (
                  <EmojiPicker
                    onSelect={e => setText(p => p + e)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
                <button type="button" className="uc-icon-btn" onClick={() => setShowEmoji(v => !v)} title="Emoji">
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
                  className={`uc-send${text.trim() && !sending ? ' uc-send--on' : ''}`}
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                >
                  {sending ? <span className="uc-send-spin" /> : <FiSend size={16} />}
                </button>
              </div>
            </>
          ) : (
            <div className="uc-placeholder uc-placeholder--empty uc-placeholder--full">
              <FiMessageCircle size={56} />
              <h3>Your Messages</h3>
              <p>Select a conversation or start a new one</p>
              <button className="uc-start-btn" onClick={() => setShowNewChat(true)}>
                <FiEdit size={14} /> New Conversation
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
