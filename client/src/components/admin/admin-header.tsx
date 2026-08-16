"use client";

import { useAppStore } from "@/lib/store";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Bell,
  Search,
  LayoutDashboard,
  LogOut,
  User,
  Moon,
  Sun,
  Globe,
} from "lucide-react";
import { useTheme } from "next-themes";

const viewLabels: Record<string, string> = {
  dashboard: "Dashboard",
  properties: "Properties",
  bookings: "Bookings",
  users: "Users & Staff",
  leads: "Leads",
  settings: "Settings",
  banners: "Banners",
  testimonials: "Testimonials",
  faqs: "FAQs",
  blogs: "Blog Posts",
  team: "Team",
  services: "Services",
  agents: "Agents",
  partners: "Partners",
  analytics: "Analytics",
  contacts: "Contact Requests",
  seo: "SEO Settings",
  chat: "Chat",
};

export function AdminHeader() {
  const { currentView, setAppMode, appMode, setCurrentPage, setIsAuthenticated, setCurrentUser, setToken } = useAppStore();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken(null);
    setAppMode("public");
    setCurrentPage("home");
  };

  if (appMode === "chat") return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/85 backdrop-blur-md px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />

      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
        <span>Admin</span>
        <span>/</span>
        <span className="font-medium text-foreground">
          {viewLabels[currentView] || "Dashboard"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-48 lg:w-64 h-9 pl-8 text-sm bg-muted/50"
          />
        </div>

        {/* Chat */}
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          onClick={() => setAppMode("chat")}
        >
          <MessageCircle className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            6
          </span>
        </Button>

        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9">
              <Bell className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <span className="text-xs text-muted-foreground">3 new</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-1 py-1">
              <div className="rounded-md border bg-card p-3">
                <div className="text-sm font-medium">New lead assigned</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  A contact request was received and assigned to an agent.
                </div>
              </div>
              <div className="mt-2 rounded-md border bg-card p-3">
                <div className="text-sm font-medium">Booking confirmed</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Your appointment has been confirmed.
                </div>
              </div>
              <div className="mt-2 rounded-md border bg-card p-3">
                <div className="text-sm font-medium">Message from client</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  You have a new chat message.
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAppMode("chat")}>
              <MessageCircle className="mr-2 size-4" /> Go to chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="size-4 hidden dark:block" />
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                RK
              </div>
              <span className="hidden lg:inline text-sm font-medium">Rajesh</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setAppMode("public");
                setCurrentPage("home");
              }}
            >
              <Globe className="mr-2 size-4" /> View Website
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LayoutDashboard className="mr-2 size-4" /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}