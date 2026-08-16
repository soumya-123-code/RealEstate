"use client";

import { useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { conversations, messages } from "@/lib/mock-data";
import { ArrowLeft, Phone, Video, MoreHorizontal, X, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleColors: Record<string, string> = {
  customer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  agent: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  lead: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

export function ChatView() {
  const { activeConversationId, setActiveConversationId, chatMobileShowMessages, setChatMobileShowMessages } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const conv = conversations.find((c) => c.id === activeConversationId);
  const msgs = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversationId, msgs.length]);

  if (!conv) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-3">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted">
            <User className="size-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Select a conversation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a chat from the sidebar to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setChatMobileShowMessages(false);
              setActiveConversationId(null);
            }}
            className="md:hidden flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="relative">
            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {conv.participantName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            {conv.online && (
              <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-background" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{conv.participantName}</h3>
            <p className="text-[11px] text-muted-foreground">
              {conv.isTyping ? (
                <span className="text-primary">typing...</span>
              ) : conv.online ? (
                "Online"
              ) : (
                "Last seen recently"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={() => {
            setChatMobileShowMessages(false);
            setActiveConversationId(null);
          }}>
            <X className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <Phone className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <Video className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {msgs.map((msg, idx) => {
          const showAvatar =
            !msg.isOwn &&
            (idx === 0 || msgs[idx - 1].senderId !== msg.senderId);
          const isConsecutive =
            idx > 0 && msgs[idx - 1].senderId === msg.senderId;

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.isOwn ? "justify-end" : "justify-start"} ${
                isConsecutive ? "mt-0.5" : "mt-3"
              }`}
            >
              {!msg.isOwn && (
                <div className="shrink-0 w-7">
                  {showAvatar ? (
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                      {msg.senderName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  ) : null}
                </div>
              )}
              <div className={`max-w-[75%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                {showAvatar && !msg.isOwn && (
                  <p className="text-[11px] text-muted-foreground mb-1 ml-1">
                    {msg.senderName}
                  </p>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                <p
                  className={`text-[10px] text-muted-foreground mt-1 ${
                    msg.isOwn ? "text-right mr-1" : "ml-1"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing Indicator */}
      {conv.isTyping && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
              {conv.participantName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Inline */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-xl bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow placeholder:text-muted-foreground"
          />
          <button className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 active:scale-95">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}