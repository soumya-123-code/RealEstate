"use client";

import { useAppStore, type AdminView } from "@/lib/store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Users,
  Target,
  Settings,
  MessageCircle,
  Landmark,
  Image,
  Star,
  HelpCircle,
  FileText,
  UserCircle,
  Briefcase,
  UsersRound,
  Handshake,
  BarChart3,
  Inbox,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav: { view: AdminView; label: string; icon: React.ElementType }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "properties", label: "Properties", icon: Building2 },
  { view: "bookings", label: "Bookings", icon: CalendarCheck },
  { view: "users", label: "Users & Staff", icon: Users },
  { view: "leads", label: "Leads", icon: Target },
];

const cmsNav: { view: AdminView; label: string; icon: React.ElementType }[] = [
  { view: "banners", label: "Banners", icon: Image },
  { view: "testimonials", label: "Testimonials", icon: Star },
  { view: "faqs", label: "FAQs", icon: HelpCircle },
  { view: "blogs", label: "Blog Posts", icon: FileText },
  { view: "team", label: "Team", icon: UserCircle },
  { view: "services", label: "Services", icon: Briefcase },
  { view: "agents", label: "Agents", icon: UsersRound },
  { view: "partners", label: "Partners", icon: Handshake },
];

const otherNav: { view: AdminView; label: string; icon: React.ElementType }[] = [
  { view: "analytics", label: "Analytics", icon: BarChart3 },
  { view: "contacts", label: "Contact Requests", icon: Inbox },
  { view: "seo", label: "SEO Settings", icon: Search },
  { view: "settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const { currentView, setCurrentView, setAppMode } = useAppStore();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
              Suretreaven
            </span>
            <span className="text-[11px] text-sidebar-foreground/60">
              Real Estate Admin
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    isActive={currentView === item.view}
                    onClick={() => setCurrentView(item.view)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>CMS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cmsNav.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    isActive={currentView === item.view}
                    onClick={() => setCurrentView(item.view)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherNav.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    isActive={currentView === item.view}
                    onClick={() => setCurrentView(item.view)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setAppMode("chat")}
              tooltip="Open Chat"
              className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
            >
              <MessageCircle className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Messages</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="group-data-[collapsible=icon]:hidden flex items-center gap-3 rounded-lg p-2 mt-1">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
            RK
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-sidebar-foreground truncate">
              Rajesh K. Mohapatra
            </span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate">
              Admin
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}