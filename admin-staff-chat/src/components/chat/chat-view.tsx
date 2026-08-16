"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import { chatApi, messageApi } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import {
  cn,
  formatTime,
  formatDate,
  getInitials,
  getRoleLabel,
  getRoleColor,
} from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  User,
} from "lucide-react";
import type { Message } from "@/lib/types";

export function ChatView() {
  const {
    activeChatId,
    setActiveChatId,
    activeMessages,
    setActiveMessages,
    addMessage,
    currentUser,
    setMobileShowMessages,
    isUserOnline,
    typingUsers,
    chats,
    setChats,
  } = useChatStore();

  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isTypingRef = useRef(false);

  // Find active chat
  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const receiver = activeChat?.receiver || null;
  const isOnline = receiver ? isUserOnline(receiver.id) : false;
  const typing = activeChatId ? typingUsers[activeChatId] : null;

  // ── Load messages when chat changes ──
  useEffect(() => {
    if (!activeChatId) {
      setActiveMessages([]);
      return;
    }

    setMessagesLoading(true);
    setInputValue(""); // Clear input when switching chats

    chatApi
      .get(activeChatId)
      .then((chat) => {
        setActiveMessages(chat.messages || []);
        // Mark as read + refresh sidebar to clear unread badge
        chatApi.markRead(activeChatId).then(() => {
          chatApi.list().then(setChats).catch(console.error);
        }).catch(console.error);
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setMessagesLoading(false));
  }, [activeChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto scroll to bottom ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages.length, typing]);

  // ── Focus input ──
  useEffect(() => {
    if (activeChatId && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeChatId]);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || !activeChatId || !currentUser || sending) return;

    setInputValue("");
    setSending(true);

    // Stop typing indicator
    stopTyping();

    try {
      const msg = await messageApi.send(activeChatId, text);

      addMessage({
        id: msg.id,
        text: msg.text,
        userId: msg.userId,
        chatId: msg.chatId,
        createdAt: msg.createdAt,
        user: {
          id: msg.user.id,
          username: msg.user.username,
          avatar: msg.user.avatar,
        },
      });

      // Find receiver for socket delivery
      const otherParticipant = activeChat?.participants?.find(
        (p) => p.userId !== currentUser.id
      );

      if (otherParticipant?.userId) {
        const socket = connectSocket(currentUser.id);
        socket.emit("sendMessage", {
          id: msg.id,
          chatId: activeChatId,
          text: msg.text,
          userId: currentUser.id,
          senderName: currentUser.username,
          senderAvatar: currentUser.avatar || null,
          receiverId: otherParticipant.userId,
          createdAt: msg.createdAt,
        });
      }

      // Update sidebar
      chatApi.list().then(setChats).catch(console.error);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputValue(text); // Restore on failure
    } finally {
      setSending(false);
    }
  }, [inputValue, activeChatId, currentUser, sending, addMessage, activeChat, setChats]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Typing indicator helpers ──
  const stopTyping = useCallback(() => {
    if (!isTypingRef.current || !currentUser || !activeChatId) return;
    const otherParticipant = activeChat?.participants?.find(
      (p) => p.userId !== currentUser.id
    );
    if (!otherParticipant?.userId) return;

    isTypingRef.current = false;
    const socket = connectSocket(currentUser.id);
    socket.emit("typing", {
      receiverId: otherParticipant.userId,
      chatId: activeChatId,
      isTyping: false,
      senderName: currentUser.username,
    });
  }, [currentUser, activeChatId, activeChat]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!currentUser || !activeChatId) return;

    const otherParticipant = activeChat?.participants?.find(
      (p) => p.userId !== currentUser.id
    );
    if (!otherParticipant?.userId) return;

    const socket = connectSocket(currentUser.id);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", {
        receiverId: otherParticipant.userId,
        chatId: activeChatId,
        isTyping: true,
        senderName: currentUser.username,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  // ── Start call ──
  const startCall = (type: "audio" | "video") => {
    if (!receiver || !currentUser) return;
    const helpers = (window as Record<string, unknown>).__chatCall as {
      startCall: (
        type: "audio" | "video",
        receiverId: number,
        receiverName: string,
        receiverAvatar?: string | null
      ) => void;
    } | undefined;
    helpers?.startCall(type, receiver.id, receiver.username, receiver.avatar);
  };

  // ── Empty state ──
  if (!activeChat || !receiver) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4 p-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <User className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
              Select a conversation
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Choose a chat from the sidebar to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 safe-top">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile back */}
          <button
            onClick={() => {
              setMobileShowMessages(false);
              setActiveChatId(null);
            }}
            className="md:hidden flex w-8 h-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            {receiver.avatar ? (
              <img
                src={receiver.avatar}
                alt={receiver.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                {getInitials(receiver.username)}
              </div>
            )}
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            )}
          </div>

          {/* Name + status */}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {receiver.username}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-slate-500">
                {typing?.isTyping ? (
                  <span className="text-blue-600 font-medium">typing...</span>
                ) : isOnline ? (
                  <span className="text-emerald-600">Online</span>
                ) : (
                  <span>Offline</span>
                )}
              </p>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  getRoleColor(receiver.role)
                )}
              >
                {getRoleLabel(receiver.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Call actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => startCall("audio")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCall("video")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50/50 dark:bg-slate-950/50"
      >
        {messagesLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Date header */}
            {activeMessages.length > 0 && (
              <div className="flex items-center justify-center my-3">
                <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {formatDate(activeMessages[0].createdAt)}
                </span>
              </div>
            )}

            {activeMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-slate-400">No messages yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Say hello to {receiver.username}!
                </p>
              </div>
            )}

            {activeMessages.map((msg, idx) => {
              const isOwn = msg.userId === currentUser?.id;
              const showAvatar =
                !isOwn &&
                (idx === 0 || activeMessages[idx - 1].userId !== msg.userId);
              const isConsecutive =
                idx > 0 && activeMessages[idx - 1].userId === msg.userId;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    isOwn ? "justify-end" : "justify-start",
                    isConsecutive ? "mt-0.5" : "mt-3"
                  )}
                >
                  {/* Other user avatar */}
                  {!isOwn && (
                    <div className="shrink-0 w-7">
                      {showAvatar &&
                        (msg.user?.avatar ? (
                          <img
                            src={msg.user.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {getInitials(msg.user?.username || "?")}
                          </div>
                        ))}
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[75%]",
                      isOwn ? "items-end" : "items-start"
                    )}
                  >
                    {showAvatar && !isOwn && (
                      <p className="text-[11px] text-slate-500 mb-1 ml-1">
                        {msg.user?.username}
                      </p>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md shadow-sm border border-slate-100 dark:border-slate-700"
                      )}
                    >
                      {msg.text}
                    </div>

                    <p
                      className={cn(
                        "text-[10px] text-slate-400 mt-1",
                        isOwn ? "text-right mr-1" : "ml-1"
                      )}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Typing indicator */}
      {typing?.isTyping && (
        <div className="px-4 pb-2 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
              {getInitials(receiver?.username || "?")}
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 safe-bottom">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
