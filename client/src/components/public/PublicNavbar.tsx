"use client";

import { useAppStore, type PublicPage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Landmark, Menu, Bell, User, LogOut, LayoutDashboard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { notifications } from "@/lib/api";
import type { Notification } from "@/lib/api";

const navLinks: { page: PublicPage; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "list", label: "Properties" },
  { page: "about", label: "About" },
  { page: "blog", label: "Blog" },
  { page: "faq", label: "FAQ" },
  { page: "contact", label: "Contact" },
];

export function PublicNavbar() {
  const {
    currentPage, setCurrentPage, setSelectedPropertyId, setSelectedBlogSlug,
    currentUser, isAuthenticated, setIsAuthenticated, setCurrentUser, setToken,
    mobileMenuOpen, setMobileMenuOpen, setAppMode, setCurrentView,
  } = useAppStore();

  const [scrolled, setScrolled] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    notifications.list().then(setNotifs).catch(() => {});
  }, []);

  const navigate = (page: PublicPage) => {
    setCurrentPage(page);
    setSelectedPropertyId(null);
    setSelectedBlogSlug(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken(null);
    navigate("home");
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b"
          : "bg-white border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground tracking-tight leading-tight">
                Suretreaven
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Realty
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => navigate(link.page)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  currentPage === link.page
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Notification */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative size-9">
                      <Bell className="size-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifs.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                    ) : (
                      notifs.slice(0, 5).map((n) => (
                        <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3">
                          <span className="text-sm font-medium">{n.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {currentUser?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
                      </div>
                      <span className="hidden lg:inline text-sm font-medium">
                        {currentUser?.name?.split(" ")[0] || "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("profile")}>
                      <User className="mr-2 size-4" /> Profile
                    </DropdownMenuItem>
                    {currentUser?.role === "admin" && (
                      <DropdownMenuItem onClick={() => { setAppMode("admin"); setCurrentView("dashboard"); }}>
                        <LayoutDashboard className="mr-2 size-4" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 size-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("login")}>
                  Log In
                </Button>
                <Button size="sm" onClick={() => navigate("register")}>
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="size-9">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Landmark className="size-4" />
                    </div>
                    <span className="font-bold text-sm">Suretreaven</span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setMobileMenuOpen(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <nav className="p-2">
                  {navLinks.map((link) => (
                    <button
                      key={link.page}
                      onClick={() => navigate(link.page)}
                      className={cn(
                        "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                        currentPage === link.page
                          ? "text-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
                {!isAuthenticated && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => navigate("login")}>Log In</Button>
                    <Button className="flex-1" onClick={() => navigate("register")}>Sign Up</Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}