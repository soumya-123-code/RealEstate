import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { format } from "timeago.js";
import {
  FiSend,
  FiSmile,
  FiPaperclip,
  FiArrowLeft,
  FiPhone,
  FiVideo,
  FiSearch,
  FiMoreVertical,
  FiChevronDown,
  FiMessageCircle,
  FiReply,
  FiCornerUpRight,
  FiCopy,
  FiEdit3,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import MessageBubble from "./MessageBubble";
import { UploadPreviewBar } from "./FilePreview";
import EmojiPicker from "./EmojiPicker";
import ImageViewer from "./ImageViewer";

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator({ typingUser }) {
  if (!typingUser) return null;

  return (
    <div className="sc-typing">
      <div className="sc-typing__avatar">
        {typingUser.senderAvatar ? (
          <img src={typingUser.senderAvatar} alt="" />
        ) : (
          <span>{(typingUser.senderName || "?")[0].toUpperCase()}</span>
        )}
      </div>
      <div className="sc-typing__bubble">
        <span className="sc-typing__name">{typingUser.senderName}</span>
        <div className="sc-typing__dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

// ── Date separator ──────────────────────────────────────────────────────────
function DateSeparator({ date }) {
  const now = new Date();
  const msgDate = new Date(date);
  const isToday =
    now.toDateString() === msgDate.toDateString();
  const isYesterday =
    new Date(now - 86400000).toDateString() === msgDate.toDateString();

  let label;
  if (isToday) label = "Today";
  else if (isYesterday) label = "Yesterday";
  else
    label = msgDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: msgDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });

  return (
    <div className="sc-date-sep">
      <span>{label}</span>
    </div>
  );
}

// ── New messages separator ──────────────────────────────────────────────────
function NewMessagesSeparator({ onClick }) {
  return (
    <div className="sc-new-msgs-sep" onClick={onClick} role="button" tabIndex={0}>
      <span>New messages ↓</span>
    </div>
  );
}

// ── Context menu ─────────────────────────────────────────────────────────────
function ContextMenu({ x, y, message, isOwn, isAdmin, onClose, onReply, onForward, onCopy, onEdit, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (rect.right > vw) {
        menuRef.current.style.left = `${vw - rect.width - 8}px`;
      }
      if (rect.bottom > vh) {
        menuRef.current.style.top = `${vh - rect.height - 8}px`;
      }
    }
  }, [x, y]);

  const items = [
    { icon: FiReply, label: "Reply", action: () => { onReply(message); onClose(); } },
    { icon: FiCornerUpRight, label: "Forward", action: () => { onForward(message); onClose(); } },
    { icon: FiCopy, label: "Copy", action: () => { onCopy(message); onClose(); } },
  ];

  if (isOwn && !message.attachment) {
    items.push({ icon: FiEdit3, label: "Edit", action: () => { onEdit(message); onClose(); } });
  }

  if (isOwn || isAdmin) {
    items.push({
      icon: FiTrash2,
      label: "Delete",
      action: () => { onDelete(message); onClose(); },
      danger: true,
    });
  }

  return (
    <div
      ref={menuRef}
      className="sc-ctx-menu"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`sc-ctx-menu__item${item.danger ? " sc-ctx-menu__item--danger" : ""}`}
          onClick={item.action}
        >
          <item.icon size={14} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Reply bar (above input) ─────────────────────────────────────────────────
function ReplyBar({ replyTo, onCancel }) {
  if (!replyTo) return null;

  return (
    <div className="sc-reply-bar">
      <div className="sc-reply-bar__bar" />
      <div className="sc-reply-bar__content">
        <span className="sc-reply-bar__name">{replyTo.senderName || "Unknown"}</span>
        <span className="sc-reply-bar__text">
          {replyTo.text?.slice(0, 60) || replyTo.attachment?.name || "Attachment"}
        </span>
      </div>
      <button type="button" className="sc-reply-bar__close" onClick={onCancel}>
        <FiX size={14} />
      </button>
    </div>
  );
}

// ── Search messages modal ────────────────────────────────────────────────────
function SearchMessages({ onClose, messages, onJumpToMessage }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const found = messages.filter(
      (m) =>
        !m.deleted &&
        m.text?.toLowerCase().includes(q)
    );
    setResults(found.slice(0, 20));
  }, [query, messages]);

  return (
    <div className="sc-search-modal" onClick={onClose}>
      <div className="sc-search-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="sc-search-modal__header">
          <h4>Search Messages</h4>
          <button type="button" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="sc-search-modal__input">
          <FiSearch size={14} />
          <input
            autoFocus
            type="text"
            placeholder="Search in conversation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sc-search-modal__results">
          {results.length === 0 && query && (
            <div className="sc-search-modal__empty">No results found</div>
          )}
          {results.map((msg) => (
            <div
              key={msg.id}
              className="sc-search-modal__result"
              onClick={() => {
                onJumpToMessage(msg.id);
                onClose();
              }}
            >
              <span className="sc-search-modal__text">
                {msg.text?.slice(0, 100)}
              </span>
              <span className="sc-search-modal__time">
                {format(msg.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Forward modal ───────────────────────────────────────────────────────────
function ForwardModal({ onClose, conversations, activeId, onForward }) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (c.id === activeId) return false;
    if (!search.trim()) return true;
    return c.customerName?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="sc-fwd-modal" onClick={onClose}>
      <div className="sc-fwd-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="sc-fwd-modal__header">
          <h4>Forward Message</h4>
          <button type="button" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="sc-fwd-modal__input">
          <FiSearch size={14} />
          <input
            autoFocus
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sc-fwd-modal__list">
          {filtered.length === 0 ? (
            <div className="sc-fwd-modal__empty">No conversations available</div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="sc-fwd-modal__item"
                onClick={() => {
                  onForward(c.id);
                  onClose();
                }}
              >
                <div className="sc-fwd-modal__avatar">
                  {c.customerAvatar ? (
                    <img src={c.customerAvatar} alt="" />
                  ) : (
                    <span>{(c.customerName || "?")[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="sc-fwd-modal__name">{c.customerName}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── ChatWindow component ────────────────────────────────────────────────────
export default function ChatWindow({
  activeConversation,
  messages,
  loadingMessages,
  sending,
  activeCustomer,
  isConversationTyping,
  hasMoreMessages,
  newMessagesAtBottom,
  conversations,
  onSendMessage,
  onSendAttachment,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
  onHandleTyping,
  onLoadMoreMessages,
  onGoBack,
  onInitiateAudioCall,
  onInitiateVideoCall,
  showBack,
}) {
  const [inputText, setInputText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const prevScrollTopRef = useRef(0);

  // ── Auto-scroll to bottom ───────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    if (newMessagesAtBottom) {
      scrollToBottom();
    }
  }, [messages, newMessagesAtBottom, scrollToBottom]);

  // ── Detect scroll position ──────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    prevScrollTopRef.current = scrollTop;

    if (scrollTop === 0 && hasMoreMessages && !loadingMessages) {
      onLoadMoreMessages();
    }
  }, [hasMoreMessages, loadingMessages, onLoadMoreMessages]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed && selectedFiles.length === 0) return;
    if (!activeConversation) return;

    if (trimmed) {
      onSendMessage(trimmed, null, replyTo?.id);
    }

    // Send files
    selectedFiles.forEach((file) => {
      onSendAttachment(file);
    });

    setInputText("");
    setReplyTo(null);
    setSelectedFiles([]);
    setShowEmoji(false);
    setEditingMessageId(null);
    scrollToBottom();
  }, [inputText, selectedFiles, activeConversation, replyTo, onSendMessage, onSendAttachment, scrollToBottom]);

  // ── Handle textarea input ───────────────────────────────────────────────
  const handleInputChange = useCallback(
    (e) => {
      setInputText(e.target.value);
      onHandleTyping(true);

      // Auto-grow
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    },
    [onHandleTyping]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Typing stop detection ────────────────────────────────────────────────
  useEffect(() => {
    if (!inputText.trim()) return;
    const timer = setTimeout(() => {
      onHandleTyping(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [inputText, onHandleTyping]);

  // ── File selection ───────────────────────────────────────────────────────
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }, []);

  const handleRemoveFile = useCallback((file) => {
    setSelectedFiles((prev) => prev.filter((f) => f !== file));
  }, []);

  const handleClearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // ── Context menu actions ──────────────────────────────────────────────────
  const handleContextMenu = useCallback((e, message) => {
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  }, []);

  const handleCopy = useCallback((message) => {
    if (message.text) {
      navigator.clipboard.writeText(message.text).catch(() => {});
    }
  }, []);

  const handleReply = useCallback((message) => {
    setReplyTo(message);
    setEditingMessageId(null);
    textareaRef.current?.focus();
  }, []);

  const handleForward = useCallback((message) => {
    setForwardingMessage(message);
  }, []);

  const handleEdit = useCallback((message) => {
    setEditingMessageId(message.id);
    setInputText(message.text);
    setReplyTo(null);
    textareaRef.current?.focus();
  }, []);

  const handleDelete = useCallback(
    (message) => {
      if (window.confirm("Delete this message?")) {
        onDeleteMessage(message.id);
      }
    },
    [onDeleteMessage]
  );

  const handleForwardToConversation = useCallback(
    (targetConvId) => {
      if (forwardingMessage) {
        onForwardMessage(forwardingMessage.id, targetConvId);
      }
      setForwardingMessage(null);
    },
    [forwardingMessage, onForwardMessage]
  );

  // ── Image viewer ─────────────────────────────────────────────────────────
  const [imageViewer, setImageViewer] = useState({ open: false, images: [], index: 0 });

  const handleImageClick = useCallback((url) => {
    // Gather all image attachments from messages
    const allImages = messages
      .filter((m) => m.attachment?.url && ["image", "pdf"].includes(m.attachment.fileType || "") === false)
      .filter((m) => {
        const u = m.attachment?.url || "";
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(u);
      })
      .map((m) => m.attachment.url);

    const idx = allImages.indexOf(url);
    setImageViewer({ open: true, images: allImages, index: idx >= 0 ? idx : 0 });
  }, [messages]);

  // ── Group messages for avatar display ────────────────────────────────────
  const messageGroups = useMemo(() => {
    return messages.map((msg, idx) => {
      const prev = messages[idx - 1];
      const next = messages[idx + 1];
      const isOwn = Number(msg.userId) === Number(activeConversation?.currentUserId);
      const sameSenderAsPrev =
        prev && Number(prev.userId) === Number(msg.userId);
      const sameSenderAsNext =
        next && Number(next.userId) === Number(msg.userId);
      const sameMinuteAsPrev =
        prev &&
        new Date(prev.createdAt).getMinutes() ===
          new Date(msg.createdAt).getMinutes() &&
        new Date(prev.createdAt).getHours() ===
          new Date(msg.createdAt).getHours();

      return {
        ...msg,
        isOwn,
        showAvatar:
          !isOwn &&
          (!sameSenderAsPrev || !sameMinuteAsPrev),
        isGroupLast:
          !sameSenderAsNext || !sameMinuteAsNext,
      };
    });
  }, [messages, activeConversation]);

  // ── Show date separators ─────────────────────────────────────────────────
  const renderDateSep = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const prevDate = new Date(prev.createdAt).toDateString();
    const currDate = new Date(msg.createdAt).toDateString();
    return prevDate !== currDate;
  };

  // ── Collect all images for viewer navigation ─────────────────────────────
  const allMessageImages = useMemo(() => {
    return messages
      .filter((m) => {
        const u = m.attachment?.url || m.text?.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i)?.[1];
        return u;
      })
      .map((m) => m.attachment?.url || m.text?.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i)?.[1]);
  }, [messages]);

  // ── Close menus on outside click ────────────────────────────────────────
  useEffect(() => {
    const close = () => {
      setContextMenu(null);
      setShowMoreMenu(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!activeConversation) {
    return (
      <div className="sc-chat-window sc-chat-window--empty">
        <div className="sc-chat-window__empty-state">
          <div className="sc-chat-window__empty-icon">
            <FiMessageCircle size={56} />
          </div>
          <h3>Support Chat</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-chat-window">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="sc-chat-window__header">
        {showBack && (
          <button
            type="button"
            className="sc-chat-window__back"
            onClick={onGoBack}
          >
            <FiArrowLeft size={18} />
          </button>
        )}

        <div className="sc-chat-window__user">
          <div className="sc-chat-window__user-avatar">
            {activeCustomer?.avatar ? (
              <img src={activeCustomer.avatar} alt={activeCustomer?.name} />
            ) : (
              <span>{(activeCustomer?.name || "?")[0].toUpperCase()}</span>
            )}
            <span className={`sc-chat-window__status-dot${activeCustomer?.online ? " sc-chat-window__status-dot--on" : ""}`} />
          </div>
          <div className="sc-chat-window__user-info">
            <span className="sc-chat-window__user-name">{activeCustomer?.name || "Unknown"}</span>
            <span className="sc-chat-window__user-meta">
              {activeConversation.propertyName
                ? `🏢 ${activeConversation.propertyName}`
                : ""}
              {activeCustomer?.online ? " • Online" : ""}
            </span>
          </div>
        </div>

        <div className="sc-chat-window__actions">
          <button
            type="button"
            className="sc-chat-window__action-btn"
            onClick={() => onInitiateAudioCall?.(activeCustomer?.id, activeConversation?.id, activeCustomer?.name, activeCustomer?.avatar)}
            title="Audio call"
          >
            <FiPhone size={16} />
          </button>
          <button
            type="button"
            className="sc-chat-window__action-btn"
            onClick={() => onInitiateVideoCall?.(activeCustomer?.id, activeConversation?.id, activeCustomer?.name, activeCustomer?.avatar)}
            title="Video call"
          >
            <FiVideo size={16} />
          </button>
          <button
            type="button"
            className="sc-chat-window__action-btn"
            onClick={() => setShowSearch(true)}
            title="Search messages"
          >
            <FiSearch size={16} />
          </button>
          <div className="sc-chat-window__more-wrap">
            <button
              type="button"
              className="sc-chat-window__action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu((v) => !v);
              }}
              title="More"
            >
              <FiMoreVertical size={16} />
            </button>
            {showMoreMenu && (
              <div className="sc-chat-window__more-menu" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => { setShowSearch(true); setShowMoreMenu(false); }}>
                  <FiSearch size={14} /> Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────────── */}
      <div
        className="sc-chat-window__messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loadingMessages && messages.length === 0 ? (
          <div className="sc-chat-window__loading">
            <div className="sc-spinner" />
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="sc-chat-window__empty-conv">
            <FiMessageCircle size={36} />
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <>
            {messageGroups.map((msg, idx) => (
              <div key={msg.id || idx}>
                {renderDateSep(msg, idx) && (
                  <DateSeparator date={msg.createdAt} />
                )}
                <MessageBubble
                  message={msg}
                  isOwn={msg.isOwn}
                  showAvatar={msg.showAvatar}
                  senderAvatar={msg.senderAvatar || activeCustomer?.avatar}
                  senderName={msg.senderName || activeCustomer?.name}
                  isGroupLast={msg.isGroupLast}
                  onReply={handleReply}
                  onForward={handleForward}
                  onCopy={handleCopy}
                  onEdit={handleEdit}
                  onContextMenu={handleContextMenu}
                  onImageClick={handleImageClick}
                  editingMessageId={editingMessageId}
                  setEditingMessageId={setEditingMessageId}
                  editMessage={onEditMessage}
                />
              </div>
            ))}
            {isConversationTyping && (
              <TypingIndicator typingUser={isConversationTyping} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {newMessagesAtBottom === false && (
        <button
          type="button"
          className="sc-chat-window__scroll-bottom"
          onClick={() => scrollToBottom()}
          title="Scroll to bottom"
        >
          <FiChevronDown size={18} />
        </button>
      )}

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="sc-chat-window__input-area">
        {/* File upload preview */}
        <UploadPreviewBar
          files={selectedFiles}
          onRemoveAll={handleClearFiles}
          onRemoveOne={handleRemoveFile}
        />

        {/* Reply bar */}
        <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />

        {/* Emoji picker */}
        {showEmoji && (
          <EmojiPicker
            onSelect={(emoji) => {
              setInputText((prev) => prev + emoji);
              textareaRef.current?.focus();
            }}
            onClose={() => setShowEmoji(false)}
            position="top"
          />
        )}

        <div className="sc-chat-window__input-row">
          {/* Emoji button */}
          <button
            type="button"
            className="sc-chat-window__input-btn"
            onClick={() => setShowEmoji((v) => !v)}
            title="Emoji"
          >
            <FiSmile size={20} />
          </button>

          {/* Attachment button */}
          <button
            type="button"
            className="sc-chat-window__input-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <FiPaperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="sc-chat-window__file-input"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.mp3,.wav,.ogg,.m4a"
            onChange={handleFileSelect}
          />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            className="sc-chat-window__textarea"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
            autoComplete="off"
          />

          {/* Send button */}
          <button
            type="button"
            className={`sc-chat-window__send-btn${inputText.trim() || selectedFiles.length > 0 ? " sc-chat-window__send-btn--active" : ""}`}
            onClick={handleSend}
            disabled={!inputText.trim() && selectedFiles.length === 0}
            title="Send"
          >
            {sending ? (
              <div className="sc-chat-window__send-spinner" />
            ) : (
              <FiSend size={18} />
            )}
          </button>
        </div>
      </div>

      {/* ── Context menu ────────────────────────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          isOwn={contextMenu.message.userId === activeConversation?.currentUserId}
          isAdmin={true}
          onClose={() => setContextMenu(null)}
          onReply={handleReply}
          onForward={handleForward}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ── Image viewer ───────────────────────────────────────────────────── */}
      {imageViewer.open && (
        <ImageViewer
          images={imageViewer.images}
          initialIndex={imageViewer.index}
          onClose={() => setImageViewer({ open: false, images: [], index: 0 })}
        />
      )}

      {/* ── Search messages modal ──────────────────────────────────────────── */}
      {showSearch && (
        <SearchMessages
          onClose={() => setShowSearch(false)}
          messages={messages}
          onJumpToMessage={(msgId) => {
            const el = document.querySelector(`[data-msg-id="${msgId}"]`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}

      {/* ── Forward modal ──────────────────────────────────────────────────── */}
      {forwardingMessage && (
        <ForwardModal
          onClose={() => setForwardingMessage(null)}
          conversations={conversations}
          activeId={activeConversation.id}
          onForward={handleForwardToConversation}
        />
      )}
    </div>
  );
}
