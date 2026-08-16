import { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiMessageCircle, FiPlus, FiSearch, FiSend, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import apiRequest from '../../lib/apiRequest';
import './UserChat.scss';

const getOther = (chat, userId) => chat?.receiver || chat?.participants?.find((p) => Number(p.userId) !== Number(userId))?.user || null;

export default function UserChat() {
  const { currentUser } = useAuth();
  const { socket, setActiveChatId, clearChatNotification } = useSocket();
  const [chats, setChats] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bottomRef = useRef(null);

  const loadChats = async () => {
    try { const res = await apiRequest.get('/chats'); setChats(res.data || []); }
    catch { toast.error("We couldn't load your conversations."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadChats(); apiRequest.get('/cms/agents').then((res) => setAgents(res.data || [])).catch(() => {}); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = (data) => {
      if (selected && Number(data.chatId) === Number(selected.id)) {
        setMessages((prev) => [...prev, { id: data.id || `socket-${Date.now()}`, text: data.text, userId: Number(data.userId), createdAt: data.createdAt || new Date().toISOString(), user: { username: data.senderName, avatar: data.senderAvatar } }]);
        apiRequest.put(`/chats/read/${selected.id}`).catch(() => {});
      }
      loadChats();
    };
    socket.on('getMessage', onMessage);
    return () => socket.off('getMessage', onMessage);
  }, [socket, selected]);

  const openChat = async (chat) => {
    setLoadingMessages(true); setMobileOpen(true);
    try { const res = await apiRequest.get(`/chats/${chat.id}`); setSelected(res.data); setMessages(res.data.messages || []); setActiveChatId(Number(chat.id)); clearChatNotification(chat.id); }
    catch { toast.error("We couldn't open this conversation."); }
    finally { setLoadingMessages(false); }
  };

  const startChat = async (agent) => {
    const receiverId = agent.user?.id || agent.id;
    try { const res = await apiRequest.post('/chats', { receiverId }); await loadChats(); await openChat(res.data); }
    catch { toast.error("We couldn't start the conversation."); }
  };

  const send = async (event) => {
    event?.preventDefault();
    const value = text.trim();
    if (!value || !selected || !currentUser) return;
    setText('');
    try {
      const res = await apiRequest.post(`/messages/${selected.id}`, { text: value });
      setMessages((prev) => [...prev, res.data]);
      const receiver = getOther(selected, currentUser.id);
      if (socket && receiver?.id) socket.emit('sendMessage', { chatId: selected.id, receiverId: receiver.id, data: { id: res.data.id, text: value, createdAt: res.data.createdAt, senderName: currentUser.username, senderAvatar: currentUser.avatar } });
      await loadChats();
    } catch { setText(value); toast.error('Message could not be sent. Please try again.'); }
  };

  const filteredChats = useMemo(() => chats.filter((chat) => { const user = getOther(chat, currentUser?.id); return !query || user?.username?.toLowerCase().includes(query.toLowerCase()) || user?.email?.toLowerCase().includes(query.toLowerCase()); }), [chats, query, currentUser?.id]);

  return <main className={`customer-chat${mobileOpen ? ' mobile-open' : ''}`}>
    <section className="chat-list-panel"><div className="chat-list-header"><div><span className="eyebrow">Suretreaven</span><h1>Chat</h1></div><button onClick={() => document.querySelector('.agent-picker')?.classList.toggle('open')} aria-label="Start new chat"><FiPlus /></button></div><div className="chat-search"><FiSearch /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations" /></div><div className="agent-picker"><div className="agent-picker-title">Chat with an agent</div>{agents.map((agent) => <button key={agent.id} onClick={() => startChat(agent)}><span className="avatar"><FiUser /></span><span>{agent.user?.username || agent.name || 'Agent'}</span></button>)}</div><div className="chat-list">{loading ? <p className="chat-empty">Loading conversations…</p> : filteredChats.length === 0 ? <div className="chat-empty"><FiMessageCircle /><p>No conversations yet.</p><small>Start a chat with a Suretreaven agent.</small></div> : filteredChats.map((chat) => { const user = getOther(chat, currentUser?.id); return <button key={chat.id} className={`chat-list-item${selected?.id === chat.id ? ' active' : ''}`} onClick={() => openChat(chat)}><span className="avatar">{user?.avatar ? <img src={user.avatar} alt="" /> : <span>{user?.username?.charAt(0).toUpperCase() || 'A'}</span>}</span><span className="chat-list-copy"><strong>{user?.username || 'Agent'}</strong><small>{chat.lastMessage || 'Start a conversation'}</small></span>{chat.hasSeen === false && <span className="unread-dot" />}</button>; })}</div></section>
    <section className="chat-window-panel">{!selected ? <div className="chat-empty large"><FiMessageCircle /><h2>Speak with a Suretreaven agent</h2><p>Ask about a property, booking or next steps.</p></div> : <><header className="chat-window-header"><button className="mobile-back" onClick={() => setMobileOpen(false)}><FiArrowLeft /></button><span className="avatar">{getOther(selected, currentUser?.id)?.username?.charAt(0).toUpperCase() || 'A'}</span><div><strong>{getOther(selected, currentUser?.id)?.username || 'Agent'}</strong><small>Suretreaven Agent</small></div></header><div className="messages">{loadingMessages ? <p className="chat-empty">Loading messages…</p> : messages.map((message) => { const mine = Number(message.userId) === Number(currentUser?.id); return <div key={message.id} className={`message ${mine ? 'mine' : ''}`}><div className="message-bubble">{message.text}</div><time>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</time></div>; })}<div ref={bottomRef} /></div><form className="message-composer" onSubmit={send}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" aria-label="Message" /><button type="submit" disabled={!text.trim()} aria-label="Send message"><FiSend /></button></form></>}</section>
  </main>;
}
