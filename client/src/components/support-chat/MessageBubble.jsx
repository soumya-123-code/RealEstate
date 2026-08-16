import { memo, useState, useRef, useCallback, useMemo } from "react";
import { format } from "timeago.js";
import { FiCheck, FiCheckSquare } from "react-icons/fi";
import { MessageAttachment } from "./FilePreview";

// ── Link detection utility ──────────────────────────────────────────────────
function linkify(text) {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s<>)"']+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

// ── Read receipt component ─────────────────────────────────────────────────
function ReadReceipt({ readBy, isOwn, createdAt }) {
  if (!isOwn) return null;

  const hasRead = Array.isArray(readBy) && readBy.length > 0;
  const timestamp = createdAt ? format(createdAt) : "";

  return (
    <span className="sc-msg__receipt">
      {timestamp}
      <span
        className={`sc-msg__tick${hasRead ? " sc-msg__tick--seen" : ""}`}
      >
        {hasRead ? <FiCheckSquare size={11} /> : <FiCheck size={11} />}
      </span>
    </span>
  );
}

// ── Reply reference ───────────────────────────────────────────────────────
function ReplyReference({ replyTo, onClick }) {
  if (!replyTo) return null;

  return (
    <div
      className="sc-msg__reply-ref"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="sc-msg__reply-bar" />
      <div className="sc-msg__reply-content">
        <span className="sc-msg__reply-name">
          {replyTo.senderName || "Unknown"}
        </span>
        <span className="sc-msg__reply-text">
          {replyTo.text || (replyTo.attachment?.name) || "Attachment"}
        </span>
      </div>
    </div>
  );
}

// ── MessageBubble component ────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar = false,
  senderAvatar = null,
  senderName = "",
  isGroupLast = false,
  onReply,
  onForward,
  onDelete,
  onEdit,
  onCopy,
  onImageClick,
  onContextMenu,
  editingMessageId,
  setEditingMessageId,
  editMessage,
  currentUser,
}) {
  const [showMeta, setShowMeta] = useState(false);
  const longPressTimerRef = useRef(null);
  const bubbleRef = useRef(null);

  // ── Handle right-click context menu ─────────────────────────────────────
  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      if (message.deleted) return;
      onContextMenu?.(e, message);
    },
    [message, onContextMenu]
  );

  // ── Handle long-press for mobile ─────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e) => {
      if (message.deleted) return;
      longPressTimerRef.current = setTimeout(() => {
        const touch = e.touches[0];
        onContextMenu?.(
          { clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} },
          message
        );
      }, 500);
    },
    [message, onContextMenu]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // ── Handle copy ──────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (message.text) {
      navigator.clipboard.writeText(message.text).then(
        () => {},
        () => {
          // Fallback for older browsers
          const ta = document.createElement("textarea");
          ta.value = message.text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
      );
    }
    onCopy?.();
  }, [message.text, onCopy]);

  // ── Is this message currently being edited? ──────────────────────────────
  const isEditing = editingMessageId === message.id;

  // ── Processed text with links ───────────────────────────────────────────
  const processedText = useMemo(() => {
    if (message.deleted) return null;
    return linkify(message.text);
  }, [message.text, message.deleted]);

  // ── Can current user perform actions? ────────────────────────────────────
  const canEdit = isOwn && !message.deleted && !message.attachment;
  const canDelete = isOwn && !message.deleted;

  if (message.deleted) {
    return (
      <div className={`sc-msg${isOwn ? " sc-msg--own" : ""}`}>
        {!isOwn && (
          <div className="sc-msg__avatar-space">
            {showAvatar ? (
              <div className="sc-msg__avatar">
                {senderAvatar ? (
                  <img src={senderAvatar} alt="" loading="lazy" />
                ) : (
                  <span>{(senderName || "?")[0].toUpperCase()}</span>
                )}
              </div>
            ) : (
              <div className="sc-msg__avatar-spacer" />
            )}
          </div>
        )}
        <div className="sc-msg__col sc-msg__col--own">
          <div className="sc-msg__deleted">
            <span className="sc-msg__deleted-icon" />
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={bubbleRef}
      className={`sc-msg${isOwn ? " sc-msg--own" : ""}${showAvatar ? " sc-msg--group-start" : ""}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Avatar for received messages */}
      {!isOwn && (
        <div className="sc-msg__avatar-space">
          {showAvatar ? (
            <div className="sc-msg__avatar">
              {senderAvatar ? (
                <img src={senderAvatar} alt={senderName} loading="lazy" />
              ) : (
                <span>{(senderName || "?")[0].toUpperCase()}</span>
              )}
            </div>
          ) : (
            <div className="sc-msg__avatar-spacer" />
          )}
        </div>
      )}

      <div className={`sc-msg__col${isOwn ? " sc-msg__col--own" : ""}`}>
        {/* Sender name */}
        {!isOwn && showAvatar && senderName && (
          <span className="sc-msg__sender-name">{senderName}</span>
        )}

        {/* Reply reference */}
        <ReplyReference replyTo={message.replyTo} />

        {/* Message bubble */}
        <div
          className={`sc-msg__bubble${isOwn ? " sc-msg__bubble--own" : ""}${message._pending ? " sc-msg__bubble--pending" : ""}`}
          onMouseEnter={() => setShowMeta(true)}
          onMouseLeave={() => setShowMeta(false)}
        >
          {/* Forwarded label */}
          {message.forwarded && (
            <div className="sc-msg__forwarded">Forwarded message</div>
          )}

          {/* Editing mode */}
          {isEditing ? (
            <div className="sc-msg__edit-area">
              <textarea
                autoFocus
                defaultValue={message.text}
                className="sc-msg__edit-input"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const newText = e.target.value.trim();
                    if (newText && newText !== message.text) {
                      editMessage(message.id, newText);
                    }
                    setEditingMessageId(null);
                  }
                  if (e.key === "Escape") {
                    setEditingMessageId(null);
                  }
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
              <div className="sc-msg__edit-actions">
                <button
                  type="button"
                  className="sc-msg__edit-btn sc-msg__edit-btn--save"
                  onClick={(e) => {
                    const textarea = e.target.closest(".sc-msg__edit-area").querySelector("textarea");
                    const newText = textarea?.value.trim();
                    if (newText && newText !== message.text) {
                      editMessage(message.id, newText);
                    }
                    setEditingMessageId(null);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="sc-msg__edit-btn sc-msg__edit-btn--cancel"
                  onClick={() => setEditingMessageId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Attachment */}
              {message.attachment && (
                <MessageAttachment
                  attachment={message.attachment}
                  isOwn={isOwn}
                  onImageClick={onImageClick}
                />
              )}

              {/* Text */}
              {processedText && (
                <span
                  className="sc-msg__text"
                  dangerouslySetInnerHTML={{ __html: processedText }}
                />
              )}
            </>
          )}
        </div>

        {/* Meta: timestamp + read receipt */}
        <div className={`sc-msg__meta${showMeta || isGroupLast ? " sc-msg__meta--visible" : ""}`}>
          {message.edited && !isEditing && <span className="sc-msg__edited">edited</span>}
          <ReadReceipt
            readBy={message.readBy}
            isOwn={isOwn}
            createdAt={message.createdAt}
          />
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
