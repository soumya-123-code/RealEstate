"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/lib/store";
import { SocketProvider } from "@/context/socket-context";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-registration";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatView } from "@/components/chat/chat-view";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { CallModal } from "@/components/call/call-modal";
import { LoginPage } from "@/components/auth/login-page";
import { disconnectSocket } from "@/lib/socket";
import { getToken, getUser, authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

function ChatApp() {
  const { isAuthenticated, setAuth, mobileShowMessages } = useChatStore();
  // Track whether we've finished checking localStorage
  const [hydrated, setHydrated] = useState(false);

  // FIX: Restore auth from localStorage on page load
  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (token && user) {
      // Verify token is still valid, then rehydrate
      authApi
        .me()
        .then((res) => {
          const u = res.user;
          setAuth(
            {
              id: u.id,
              username: u.username,
              email: u.email,
              phone: u.phone,
              avatar: u.avatar,
              role: u.role as "ADMIN" | "STAFF" | "AGENT" | "USER",
              isActive: u.isActive,
            },
            token
          );
        })
        .catch(() => {
          // Token expired / invalid — clear it
          localStorage.removeItem("chat_token");
          localStorage.removeItem("chat_user");
        })
        .finally(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Show nothing while we check stored credentials (avoids login flash)
  if (!hydrated) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <SocketProvider>
      <ServiceWorkerRegistration />
      <div className="h-dvh w-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className={cn(
              "w-full md:w-80 lg:w-96 shrink-0 h-full",
              mobileShowMessages ? "hidden md:flex md:flex-col" : "flex flex-col"
            )}
          >
            <ChatSidebar />
          </div>

          {/* Chat View */}
          <div
            className={cn(
              "flex-1 h-full",
              mobileShowMessages ? "flex flex-col" : "hidden md:flex md:flex-col"
            )}
          >
            <ChatView />
          </div>
        </div>

        {/* Overlays */}
        <NewChatDialog />
        <CallModal />
      </div>
    </SocketProvider>
  );
}

export default function Home() {
  return <ChatApp />;
}
