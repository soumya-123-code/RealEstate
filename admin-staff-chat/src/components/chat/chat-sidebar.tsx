"use client";

import { useEffect, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import { chatApi, usersApi, getToken, getUser, clearAuth, setToken, setUser } from "@/lib/api";
import { cn, formatTime, formatDate, getInitials, getRoleLabel, getRoleColor } from "@/lib/utils";
import { Search, MessageSquarePlus, LogOut, Filter, X, ChevronDown } from "lucide-react";
import type { Chat } from "@/lib/types";

const tabs = [
  { key: "all" as const, label: "All" },
  { key: "unread" as const, label: "Unread" },
  { key: "customers" as const, label: "Customers" },
  { key: "staff" as const, label: "Staff" },
];

export function ChatSidebar() {
  const {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    searchQuery,
    setSearchQuery,
    mobileShowMessages,
    setMobileShowMessages,
    currentUser,
    logout,
    isUserOnline,
    activeTab,
    setActiveTab,
    showNewChat,
    setShowNewChat,
  } = useChatStore();


  // ── Load chats on mount ──
  const loadChats = useCallback(async () => {
    try {
      const data = await chatApi.list();
      setChats(data);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  }, [setChats]);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [loadChats]);

  // ── Filter chats ──
  const filteredChats = chats.filter((chat) => {
    // Search filter
    if (searchQuery) {
      const name = chat.receiver?.username?.toLowerCase() || "";
      const msg = chat.lastMessage?.toLowerCase() || "";
      if (!name.includes(searchQuery.toLowerCase()) && !msg.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Tab filter
    switch (activeTab) {
      case "unread":
        return !chat.hasSeen;
      case "customers":
        return chat.receiver?.role === "USER";
      case "staff":
        return chat.receiver?.role === "ADMIN" || chat.receiver?.role === "STAFF";
      default:
        return true;
    }
  });

  // ── Unread count ──
  const totalUnread = chats.filter((c) => !c.hasSeen).length;

  const handleLogout = () => {
    clearAuth();
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {currentUser ? getInitials(currentUser.username) : "?"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {currentUser?.username || "Chat"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {getRoleLabel(currentUser?.role || "")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-500 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab.label}
            {tab.key === "unread" && totalUnread > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] inline-flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-8 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquarePlus className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 font-medium">No conversations</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? "Try a different search" : "Start a new chat to begin"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {filteredChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              const isOnline = chat.receiver ? isUserOnline(chat.receiver.id) : false;
              const unread = !chat.hasSeen;

              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-200 dark:ring-blue-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {chat.receiver?.avatar ? (
                      <img
                        src={chat.receiver.avatar}
                        alt={chat.receiver.username}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                        {chat.receiver ? getInitials(chat.receiver.username) : "?"}
                      </div>
                    )}
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "font-medium text-sm truncate",
                        unread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                      )}>
                        {chat.receiver?.username || "Unknown"}
                      </span>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {chat.updatedAt ? formatTime(chat.updatedAt) : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        "text-xs truncate",
                        unread ? "text-slate-600 dark:text-slate-400 font-medium" : "text-slate-400"
                      )}>
                        {chat.lastMessage || "No messages yet"}
                      </p>
                      {unread && (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          1
                        </span>
                      )}
                    </div>

                    {/* Role badge */}
                    {chat.receiver?.role && (
                      <span className={cn(
                        "inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1",
                        getRoleColor(chat.receiver.role)
                      )}>
                        {getRoleLabel(chat.receiver.role)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}