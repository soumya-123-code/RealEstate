import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiCheckCircle, FiClock, FiImage, FiMessageCircle, FiPaperclip, FiSend, FiUser, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import apiRequest from "../../lib/apiRequest";
import toast from "react-hot-toast";
import "./CustomerSupport.scss";

const PAGE_SIZE = 30;
const MAX_TEXT = 5000;
const formatTime = (value) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
const formatDate = (value) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function CustomerSupport() {
  const { currentUser } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]); const [active, setActive] = useState(null); const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); const [loadingMessages, setLoadingMessages] = useState(false); const [sending, setSending] = useState(false);
  const [text, setText] = useState(""); const [subject, setSubject] = useState(""); const [newConversation, setNewConversation] = useState(false); const [typing, setTyping] = useState(false);
  const [hasMore, setHasMore] = useState(false); const [filter, setFilter] = useState("ALL"); const [mobileList, setMobileList] = useState(true); const [selectedFile, setSelectedFile] = useState(null);
  const bottomRef = useRef(null); const typingTimer = useRef(null); const activeRef = useRef(null); activeRef.current = active;
  const unreadTotal = useMemo(() => conversations.reduce((sum, c) => sum + Number(c.unreadCount || c.customerUnreadCount || 0), 0), [conversations]);

  const openConversation = useCallback(async (conversation) => {
    setLoadingMessages(true); setMobileList(false); setNewConversation(false); setSelectedFile(null);
    try {
      const res = await apiRequest.get(`/support/chat/conversations/${conversation.id}`);
      setActive(res.data); setMessages(res.data.messages || []); setHasMore(true); setSearchParams({ conversation: String(conversation.id) });
      await apiRequest.put(`/support/chat/conversations/${conversation.id}/read`);
      setConversations((prev) => prev.map((c) => c.id === conversation.id ? { ...c, unreadCount: 0, customerUnreadCount: 0 } : c));
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (error) { console.error(error); toast.error(error.response?.data?.message || "Unable to open conversation"); }
    finally { setLoadingMessages(false); }
  }, [setSearchParams]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiRequest.get("/support/chat/conversations"); const data = Array.isArray(res.data) ? res.data : []; setConversations(data);
      const requestedId = Number(searchParams.get("conversation")); const target = requestedId ? data.find((c) => Number(c.id) === requestedId) : null;
      if (target && !activeRef.current) openConversation(target);
    } catch (error) { console.error(error); toast.error("Unable to load support conversations"); }
    finally { setLoading(false); }
  }, [searchParams, openConversation]);
  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = ({ conversationId, message }) => {
      const id = Number(conversationId); if (message?.senderId === Number(currentUser?.id)) return;
      setConversations((prev) => prev.map((c) => c.id === id ? { ...c, lastMessageText: message.text || "Attachment", lastMessageAt: message.createdAt, unreadCount: activeRef.current?.id === id ? 0 : Number(c.unreadCount || 0) + 1, customerUnreadCount: activeRef.current?.id === id ? 0 : Number(c.customerUnreadCount || 0) + 1, updatedAt: message.createdAt } : c));
      if (activeRef.current?.id === id) { setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]); apiRequest.post(`/support/chat/conversations/${id}/messages/${message.id}/read`).catch(() => {}); requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })); }
    };
    const onTyping = ({ conversationId, userId, isTyping }) => { if (activeRef.current?.id === Number(conversationId) && Number(userId) !== Number(currentUser?.id)) setTyping(Boolean(isTyping)); };
    const onUpdated = ({ conversationId, status, assignedToId }) => { setConversations((prev) => prev.map((c) => c.id === Number(conversationId) ? { ...c, status: status || c.status, assignedToId: assignedToId ?? c.assignedToId } : c)); if (activeRef.current?.id === Number(conversationId)) setActive((prev) => prev ? { ...prev, status: status || prev.status, assignedToId: assignedToId ?? prev.assignedToId } : prev); };
    socket.on("support:newMessage", onMessage); socket.on("support:typing", onTyping); socket.on("support:statusChanged", onUpdated); socket.on("support:assigned", onUpdated);
    return () => { socket.off("support:newMessage", onMessage); socket.off("support:typing", onTyping); socket.off("support:statusChanged", onUpdated); socket.off("support:assigned", onUpdated); };
  }, [socket, currentUser?.id]);

  const loadOlder = async () => {
    if (!active || !hasMore || loadingMessages || !messages[0]) return; setLoadingMessages(true);
    try { const res = await apiRequest.get(`/support/chat/conversations/${active.id}/messages`, { params: { before: messages[0].createdAt, limit: PAGE_SIZE } }); setHasMore(Boolean(res.data.hasMore)); setMessages((prev) => [...(res.data.messages || []), ...prev]); }
    catch { toast.error("Unable to load older messages"); } finally { setLoadingMessages(false); }
  };
  const emitTyping = (value) => { if (!socket || !active) return; socket.emit("support:typing", { conversationId: active.id, isTyping: value }); clearTimeout(typingTimer.current); if (value) typingTimer.current = setTimeout(() => socket.emit("support:typing", { conversationId: active.id, isTyping: false }), 1800); };

  const send = async (event) => {
    event?.preventDefault(); const clean = text.trim(); if (!clean && !selectedFile) return; setSending(true);
    try {
      let conversation = active;
      if (!conversation) {
        const created = await apiRequest.post("/support/chat/conversations", { subject: subject.trim() || "Support request", text: clean });
        const detail = await apiRequest.get(`/support/chat/conversations/${created.data.id}`); conversation = detail.data;
        setActive(conversation); setNewConversation(false); setSearchParams({ conversation: String(conversation.id) }); setMessages(conversation.messages || []); setText(""); setSubject(""); await loadConversations(); requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })); return;
      }
      let attachment = null;
      if (selectedFile) { const form = new FormData(); form.append("file", selectedFile); const upload = await apiRequest.post(`/support/chat/conversations/${conversation.id}/attachments`, form, { headers: { "Content-Type": "multipart/form-data" } }); attachment = upload.data; }
      const optimistic = { id: `tmp-${Date.now()}`, conversationId: conversation.id, senderId: currentUser.id, text: clean, attachments: attachment ? [attachment] : [], createdAt: new Date().toISOString(), _pending: true };
      setMessages((prev) => [...prev, optimistic]); setText(""); setSelectedFile(null); emitTyping(false);
      const res = await apiRequest.post(`/support/chat/conversations/${conversation.id}/messages`, { text: clean, attachments: attachment ? [attachment] : [] });
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? res.data : m)); setConversations((prev) => prev.map((c) => c.id === conversation.id ? { ...c, lastMessageText: res.data.text || "Attachment", lastMessageAt: res.data.createdAt, updatedAt: res.data.createdAt } : c)); requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (error) { setMessages((prev) => prev.filter((m) => !String(m.id).startsWith("tmp-"))); toast.error(error.response?.data?.message || "Message could not be sent"); }
    finally { setSending(false); }
  };
  const startNew = () => { setActive(null); setMessages([]); setNewConversation(true); setSubject(""); setText(""); setSelectedFile(null); setMobileList(false); setSearchParams({}); };

  const visible = conversations.filter((c) => filter === "ALL" || c.status === filter);
  return <div className="customer-support"><div className="customer-support__shell">
    <aside className={`customer-support__list ${mobileList ? "is-mobile-visible" : "is-mobile-hidden"}`}>
      <div className="customer-support__list-head"><div><span className="eyebrow">SURETREAVEN</span><h1>Support</h1><p>{unreadTotal ? `${unreadTotal} unread` : "We’re here to help"}</p></div><button className="support-primary-btn" onClick={startNew}><FiMessageCircle /> New chat</button></div>
      <div className="customer-support__filters">{["ALL","OPEN","PENDING","RESOLVED"].map((value)=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{value==="ALL"?"All":value[0]+value.slice(1).toLowerCase()}</button>)}</div>
      <div className="customer-support__conversation-list">{loading?<div className="support-empty">Loading conversations…</div>:!visible.length?<div className="support-empty"><FiMessageCircle size={28}/><strong>No conversations yet</strong><span>Start a chat with our support team.</span><button onClick={startNew}>Start support chat</button></div>:visible.map((c)=><button key={c.id} className={`customer-support__conversation ${active?.id===c.id?"active":""}`} onClick={()=>openConversation(c)}><span className="support-avatar"><FiUser/></span><span className="customer-support__conversation-copy"><strong>{c.subject||"Support request"}</strong><span>{c.lastMessageText||"No messages yet"}</span><small>{c.lastMessageAt?formatDate(c.lastMessageAt):formatDate(c.createdAt)}</small></span><span className="customer-support__conversation-meta"><span className={`status-dot ${String(c.status).toLowerCase()}`}/><span className="support-status-text">{String(c.status).toLowerCase()}</span>{c.unreadCount>0&&<b>{c.unreadCount>9?"9+":c.unreadCount}</b>}</span></button>)}</div>
    </aside>
    <main className={`customer-support__chat ${!mobileList?"is-mobile-visible":"is-mobile-hidden"}`}>
      {!active&&!newConversation?<div className="support-welcome"><div className="support-welcome__icon"><FiMessageCircle/></div><h2>How can we help?</h2><p>Chat with the Suretreaven support team about properties, bookings, visits or anything else you need.</p><button onClick={startNew}>Start a support conversation</button></div>:<>
        <header className="customer-support__chat-head"><button className="mobile-back" onClick={()=>setMobileList(true)}><FiArrowLeft/></button><div className="support-avatar"><FiMessageCircle/></div><div className="customer-support__chat-title"><strong>{active?.subject||subject||"New support conversation"}</strong><span>{active?`${isUserOnline(active.assignedToId)?"Support is online":"Support team"} · ${String(active.status).toLowerCase()}`:"A support specialist will reply shortly"}</span></div>{active&&<span className={`support-chip ${String(active.status).toLowerCase()}`}>{String(active.status).toLowerCase()}</span>}</header>
        <div className="customer-support__messages" onScroll={(e)=>{if(e.currentTarget.scrollTop<120)loadOlder();}}>{loadingMessages?<div className="support-loading">Loading messages…</div>:messages.length===0&&!newConversation?<div className="support-empty"><FiMessageCircle size={28}/><strong>No messages yet</strong><span>Send a message to begin.</span></div>:<>{messages.map((m)=><div key={m.id} className={`support-message-row ${Number(m.senderId||m.userId)===Number(currentUser?.id)?"mine":"theirs"}`}><div className="support-message"><div className="support-message__bubble">{m.text&&<div>{m.text}</div>}{m.attachments?.map((a,idx)=><a key={idx} href={a.url} target="_blank" rel="noreferrer" className="support-attachment"><FiImage/>{a.name||"Attachment"}</a>)}</div><div className="support-message__meta">{formatTime(m.createdAt)} {Number(m.senderId||m.userId)===Number(currentUser?.id)&&(m._pending?<FiClock/>:m.readReceipts?.length?<FiCheckCircle/>:<FiCheck/>)}</div></div></div>)}</>}{typing&&<div className="support-typing"><span/><span/><span/> Support is typing…</div>}<div ref={bottomRef}/></div>
        <form className="customer-support__composer" onSubmit={send}>{newConversation&&<input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject (optional)" maxLength={120}/>} {selectedFile&&<div className="selected-file"><FiPaperclip/>{selectedFile.name}<button type="button" onClick={()=>setSelectedFile(null)}><FiX/></button></div>}<div className="customer-support__composer-row"><label className="icon-action" title="Attach image"><FiPaperclip/><input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e)=>setSelectedFile(e.target.files?.[0]||null)} hidden/></label><textarea value={text} onChange={(e)=>{setText(e.target.value);emitTyping(Boolean(e.target.value.trim()));}} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(e);}}} placeholder="Write a message…" rows={1} maxLength={MAX_TEXT}/><button className="send-btn" disabled={sending||(!text.trim()&&!selectedFile)}>{sending?<FiClock className="spin"/>:<FiSend/>}</button></div></form>
      </>}
    </main>
  </div></div>;
}
