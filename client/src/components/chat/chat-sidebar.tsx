"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { conversations } from "@/lib/mock-data";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  customer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  agent: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  lead: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  staff: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
};

export function ChatSidebar() {
  const {
    activeConversationId,
    setActiveConversationId,
    chatSearch,
    setChatSearch,
    chatMobileShowMessages,
    setChatMobileShowMessages,
    setAppMode,
  } = useAppStore();

  const filtered = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {chatMobileShowMessages && (
            <button
              onClick={() => {
                setChatMobileShowMessages(false);
                setActiveConversationId(null);
              }}
              className="md:hidden flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
          <h2 className="font-semibold text-sm">Messages</h2>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {conversations.length}
          </Badge>
        </div>
        <button
          onClick={() => setAppMode("admin")}
          className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          ← Dashboard
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8 h-9 text-sm"
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.map((conv) => {
            const isActive = activeConversationId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors",
                  isActive
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="relative shrink-0">
                  <div className="flex size-11 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {conv.participantName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  {conv.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {conv.participantName}
                    </span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.isTyping ? (
                        <span className="text-primary italic">typing...</span>
                      ) : (
                        conv.lastMessage
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        roleColors[conv.participantRole] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {conv.participantRole}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}