"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStore } from "@/lib/store";
import { chatApi } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { X, Search, UserPlus } from "lucide-react";
import { cn, getInitials, getRoleColor, getRoleLabel } from "@/lib/utils";
import type { Chat } from "@/lib/types";

export function NewChatDialog() {
  const { showNewChat, setShowNewChat, currentUser, setActiveChatId, setChats } = useChatStore();
  const [users, setUsers] = useState<{ id: number; username: string; email: string; avatar?: string; role: string }[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load users when dialog opens
  useEffect(() => {
    if (!showNewChat) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        // Load customers and staff (exclude self)
        const allUsers: typeof users = [];

        // Load customers
        const customerRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800/api"}/users?role=USER`,
          { headers: { Authorization: `Bearer ${useChatStore.getState().token}` } }
        );
        if (customerRes.ok) {
          const data = await customerRes.json();
          allUsers.push(...(data.users || data || []));
        }

        // Load staff and admins
        const staffRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800/api"}/users?role=STAFF`,
          { headers: { Authorization: `Bearer ${useChatStore.getState().token}` } }
        );
        if (staffRes.ok) {
          const data = await staffRes.json();
          allUsers.push(...(data.users || data || []));
        }

        const adminRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800/api"}/users?role=ADMIN`,
          { headers: { Authorization: `Bearer ${useChatStore.getState().token}` } }
        );
        if (adminRes.ok) {
          const data = await adminRes.json();
          allUsers.push(...(data.users || data || []));
        }

        // Filter out self and duplicates
        const filtered = allUsers
          .filter((u) => u.id !== currentUser?.id)
          .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i);

        setUsers(filtered);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [showNewChat, currentUser]);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const startChat = async (userId: number) => {
    setCreating(true);
    try {
      const chat = await chatApi.create(userId);
      // Refresh chat list
      const chats = await chatApi.list();
      setChats(chats);
      setActiveChatId(chat.id);
      setShowNewChat(false);
    } catch (err) {
      console.error("Failed to create chat:", err);
    } finally {
      setCreating(false);
    }
  };

  if (!showNewChat) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">New Conversation</h3>
          <button
            onClick={() => setShowNewChat(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role filter */}
        <div className="flex gap-1 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
          {[
            { key: "all", label: "All" },
            { key: "USER", label: "Customers" },
            { key: "STAFF", label: "Staff" },
            { key: "ADMIN", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                roleFilter === tab.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startChat(user.id)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="relative shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                        {getInitials(user.username)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <span className={cn(
                      "inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1",
                      getRoleColor(user.role)
                    )}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <UserPlus className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}