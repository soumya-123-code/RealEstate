"use client";

import { useAppStore, type PublicPage, type AdminView } from "@/lib/store";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HomePageView } from "@/components/public/HomePageView";
import { PropertiesListView } from "@/components/public/PropertiesListView";
import { PropertyDetailView } from "@/components/public/PropertyDetailView";
import { AboutPageView } from "@/components/public/AboutPageView";
import { ContactPageView } from "@/components/public/ContactPageView";
import { FaqPageView } from "@/components/public/FaqPageView";
import { BlogPageView } from "@/components/public/BlogPageView";
import { LoginPageView } from "@/components/public/LoginPageView";
import { RegisterPageView } from "@/components/public/RegisterPageView";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { DashboardView } from "@/components/admin/dashboard-view";
import { PropertiesView } from "@/components/admin/properties-view";
import { BookingsView } from "@/components/admin/bookings-view";
import { UsersView } from "@/components/admin/users-view";
import { LeadsView } from "@/components/admin/leads-view";
import { SettingsView } from "@/components/admin/settings-view";
import { AdminBannersView } from "@/components/admin/admin-banners-view";
import { AdminTestimonialsView } from "@/components/admin/admin-testimonials-view";
import { AdminFaqsView } from "@/components/admin/admin-faqs-view";
import { AdminBlogsView } from "@/components/admin/admin-blogs-view";
import { AdminTeamView } from "@/components/admin/admin-team-view";
import { AdminServicesView } from "@/components/admin/admin-services-view";
import { AdminAgentsView } from "@/components/admin/admin-agents-view";
import { AdminPartnersView } from "@/components/admin/admin-partners-view";
import { AdminAnalyticsView } from "@/components/admin/admin-analytics-view";
import { AdminContactsView } from "@/components/admin/admin-contacts-view";
import { AdminSeoView } from "@/components/admin/admin-seo-view";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatView } from "@/components/chat/chat-view";

// ─── Public page router ────────────────────────────────────────
function PublicPageContent() {
  const { currentPage } = useAppStore();

  const pages: Record<PublicPage, React.ReactNode> = {
    home: <HomePageView />,
    list: <PropertiesListView />,
    single: <PropertyDetailView />,
    about: <AboutPageView />,
    contact: <ContactPageView />,
    faq: <FaqPageView />,
    blog: <BlogPageView />,
    "blog-post": <BlogPageView />,
    login: <LoginPageView />,
    register: <RegisterPageView />,
    profile: <HomePageView />, // Placeholder
  };

  const hideFooter = currentPage === "login" || currentPage === "register";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">{pages[currentPage] || <HomePageView />}</main>
      {!hideFooter && <PublicFooter />}
    </div>
  );
}

// ─── Admin view router ─────────────────────────────────────────
function AdminViewContent() {
  const { currentView } = useAppStore();

  const views: Record<AdminView, React.ReactNode> = {
    dashboard: <DashboardView />,
    properties: <PropertiesView />,
    bookings: <BookingsView />,
    users: <UsersView />,
    leads: <LeadsView />,
    settings: <SettingsView />,
    banners: <AdminBannersView />,
    testimonials: <AdminTestimonialsView />,
    faqs: <AdminFaqsView />,
    blogs: <AdminBlogsView />,
    team: <AdminTeamView />,
    services: <AdminServicesView />,
    agents: <AdminAgentsView />,
    partners: <AdminPartnersView />,
    analytics: <AdminAnalyticsView />,
    contacts: <AdminContactsView />,
    seo: <AdminSeoView />,
    chat: <ChatView />,
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {views[currentView] || <DashboardView />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Chat mode (standalone) ────────────────────────────────────
function ChatModeContent() {
  const { chatMobileShowMessages } = useAppStore();

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <div className={`${chatMobileShowMessages ? "hidden md:block" : "block"} md:w-80 lg:w-96 shrink-0 h-full md:h-auto`}>
        <ChatSidebar />
      </div>
      <div className={`${chatMobileShowMessages ? "block" : "hidden md:block"} flex-1 h-full md:h-auto`}>
        <ChatView />
      </div>
    </div>
  );
}

// ─── Main app router ───────────────────────────────────────────
export default function Page() {
  const { appMode } = useAppStore();

  if (appMode === "admin") return <AdminViewContent />;
  if (appMode === "chat") return <ChatModeContent />;
  return <PublicPageContent />;
}