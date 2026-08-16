import { useState } from "react";
import { Search, MessageCircle } from "lucide-react";

export default function ClientChatSidebar({
  currentUser,
  chats,
  activeChatId,
  isOnline,
  onOpenChat,
  onClose,
}) {
  const [search, setSearch] = useState("");

  const filtered = chats.filter((c) => {
    const name = c.receiver?.username || "";
    const last = c.lastMessage || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || last.toLowerCase().includes(q);
  });

  const totalUnread = chats.filter((c) => !c.hasSeen).length;

  return (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-primary" />
          <span className="font-semibold text-sm">Messages</span>
          {totalUnread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-8 rounded-lg bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-10">No conversations</p>
        ) : (
          filtered.map((chat) => {
            const receiver = chat.receiver;
            if (!receiver) return null;
            const isActive = activeChatId === chat.id;
            const online = isOnline(receiver.id);

            return (
              <button
                key={chat.id}
                onClick={() => onOpenChat(chat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 ${
                  isActive ? "bg-primary/5" : "hover:bg-gray-50"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {receiver.avatar ? (
                    <img
                      src={receiver.avatar}
                      alt={receiver.username}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {receiver.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {online && (
                    <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${!chat.hasSeen ? "font-semibold" : "font-medium"}`}>
                      {receiver.username}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap ml-1">
                      {chat.updatedAt
                        ? new Date(chat.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastMessage || "Start a conversation"}
                    </p>
                    {!chat.hasSeen && (
                      <span className="size-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
