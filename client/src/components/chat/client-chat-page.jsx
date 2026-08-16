import { useAuth } from "../../context/AuthContext";
import { useClientChat } from "../../hooks/useClientChat";
import ClientChatSidebar from "./chat-sidebar";
import ClientChatView from "./chat-view";

/**
 * ClientChatPage
 *
 * Drop-in replacement for the old mock-data chat page.
 * Wires real API + socket. Works within the existing
 * SocketContextProvider and AuthContextProvider setup.
 *
 * Usage:
 *   import ClientChatPage from "@/components/chat/client-chat-page";
 *   // Render where the user's chat UI should appear
 */
export default function ClientChatPage() {
  const { currentUser } = useAuth();

  const {
    chats,
    activeChat,
    activeChatId,
    messages,
    loadingChats,
    loadingMessages,
    sendingMessage,
    isTypingInCurrentChat,
    typingSenderName,
    isOnline,
    openChat,
    closeChat,
    sendMessage,
    handleTyping,
  } = useClientChat(currentUser);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <div
        className={`w-full md:w-72 lg:w-80 shrink-0 border-r
          ${activeChatId !== null ? "hidden md:block" : "block"}`}
      >
        <ClientChatSidebar
          currentUser={currentUser}
          chats={chats}
          activeChatId={activeChatId}
          isOnline={isOnline}
          onOpenChat={openChat}
        />
      </div>

      {/* ── Chat view ─────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col
          ${activeChatId === null ? "hidden md:flex" : "flex"}`}
      >
        <ClientChatView
          currentUser={currentUser}
          chat={activeChat}
          messages={messages}
          loadingMessages={loadingMessages}
          sendingMessage={sendingMessage}
          isOnline={isOnline}
          isTyping={isTypingInCurrentChat}
          typingSenderName={typingSenderName}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          onBack={closeChat}
          // Pass onStartCall if you want audio/video on client side too
          // onStartCall={(receiver, type) => ...}
        />
      </div>
    </div>
  );
}
