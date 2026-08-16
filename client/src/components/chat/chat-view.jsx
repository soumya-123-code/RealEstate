import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, Send, Phone, Video, MoreHorizontal } from "lucide-react";

// Avatar helper
function Avatar({ user, size = 9 }) {
  const initials = (user?.username || "?").slice(0, 2).toUpperCase();
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        className={`size-${size} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`flex size-${size} items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold`}
    >
      {initials}
    </div>
  );
}

export default function ClientChatView({
  currentUser,
  chat,
  messages,
  loadingMessages,
  sendingMessage,
  isOnline,
  isTyping,
  typingSenderName,
  onSendMessage,
  onTyping,
  onBack,
  onStartCall,
}) {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const typingTimerRef = useRef(null);

  const receiver = chat?.receiver || null;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => onTyping(false), 1500);
    },
    [onTyping]
  );

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
    onTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [input, onSendMessage, onTyping]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gray-100 mb-3">
            <Send size={24} className="text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700">Select a conversation</h3>
          <p className="text-sm text-gray-500 mt-1">Choose a chat from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex size-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="relative">
            <Avatar user={receiver} size={9} />
            {isOnline(receiver?.id) && (
              <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{receiver?.username || "Unknown"}</h3>
            <p className="text-[11px] text-gray-500">
              {isTyping ? (
                <span className="text-primary">typing...</span>
              ) : isOnline(receiver?.id) ? (
                "Online"
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>

        {/* Call buttons */}
        <div className="flex items-center gap-1">
          {onStartCall && (
            <>
              <button
                onClick={() => onStartCall(receiver, "audio")}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                title="Audio call"
              >
                <Phone size={16} />
              </button>
              <button
                onClick={() => onStartCall(receiver, "video")}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                title="Video call"
              >
                <Video size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-0">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-10">
            No messages yet — say hello!
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.userId === currentUser?.id;
            const prevMsg = messages[idx - 1];
            const prevSameSender = prevMsg ? prevMsg.userId === msg.userId : false;
            const showSender = !isOwn && !prevSameSender;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
                  prevSameSender ? "mt-0.5" : "mt-3"
                }`}
              >
                {!isOwn && (
                  <div className="shrink-0 w-7">
                    {showSender && (
                      <Avatar user={msg.user || receiver} size={7} />
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {showSender && !isOwn && (
                    <p className="text-[11px] text-gray-500 mb-1 ml-1">
                      {msg.user?.username || receiver?.username}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isOwn
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p
                    className={`text-[10px] text-gray-400 mt-1 ${
                      isOwn ? "text-right mr-1" : "ml-1"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Typing indicator ──────────────────────────────────────────── */}
      {isTyping && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
            {typingSenderName && (
              <span className="text-[11px] text-gray-400">{typingSenderName}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-xl bg-gray-100 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendingMessage}
            className="flex size-10 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
