import { create } from "zustand";
import type { Property, User, Booking, Lead, ChatConversation, ChatMessage } from "./mock-data";
import type { Banner, Testimonial, FAQ, BlogPost, TeamMember, Partner, Service, Agent, ContactRequest, SeoSettings, Notification } from "./api";

// ─── Types ────────────────────────────────────────────────────
export type AppMode = "public" | "admin" | "chat";
export type PublicPage = "home" | "list" | "single" | "about" | "contact" | "faq" | "blog" | "blog-post" | "login" | "register" | "profile";
export type AdminView = "dashboard" | "properties" | "bookings" | "users" | "leads" | "settings" | "banners" | "testimonials" | "faqs" | "blogs" | "team" | "services" | "agents" | "partners" | "analytics" | "contacts" | "seo" | "chat";

interface AppState {
  // ── App Mode ──
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // ── Public Navigation ──
  currentPage: PublicPage;
  setCurrentPage: (page: PublicPage) => void;
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  selectedBlogSlug: string | null;
  setSelectedBlogSlug: (slug: string | null) => void;

  // ── Admin Navigation ──
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;

  // ── Sidebar ──
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // ── Auth ──
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  loginTab: "email" | "phone";
  setLoginTab: (tab: "email" | "phone") => void;
  loginStep: "input" | "preview" | "otp";
  setLoginStep: (step: "input" | "preview" | "otp") => void;
  loginIdentifier: string;
  setLoginIdentifier: (v: string) => void;
  loginOtp: string;
  setLoginOtp: (v: string) => void;
  registerStep: 1 | 2;
  setRegisterStep: (s: 1 | 2) => void;
  registerForm: { username: string; email: string; phone: string };
  setRegisterForm: (f: { username: string; email: string; phone: string }) => void;
  registerOtp: string;
  setRegisterOtp: (v: string) => void;

  // ── Data: Properties ──
  properties: Property[];
  setProperties: (p: Property[]) => void;
  featuredProperties: Property[];
  setFeaturedProperties: (p: Property[]) => void;
  selectedProperty: Property | null;
  setSelectedProperty: (p: Property | null) => void;
  propertyFilters: {
    search: string;
    city: string;
    type: string;
    status: string;
    minPrice: string;
    maxPrice: string;
    minBeds: string;
    minBaths: string;
    minArea: string;
    maxArea: string;
    sort: string;
    page: number;
    totalPages: number;
    total: number;
    showFilters: boolean;
  };
  setPropertyFilters: (f: Partial<AppState["propertyFilters"]>) => void;

  // ── Data: Home ──
  homeData: {
    banners: Banner[];
    services: Service[];
    testimonials: Testimonial[];
    stats: { properties: number; customers: number; cities: number; years: number };
  } | null;
  setHomeData: (d: AppState["homeData"]) => void;

  // ── Data: Blog ──
  blogPosts: BlogPost[];
  setBlogPosts: (p: BlogPost[]) => void;
  selectedBlogPost: BlogPost | null;
  setSelectedBlogPost: (p: BlogPost | null) => void;

  // ── Data: FAQ ──
  faqs: FAQ[];
  setFaqs: (f: FAQ[]) => void;
  faqSearch: string;
  setFaqSearch: (s: string) => void;
  faqCategory: string;
  setFaqCategory: (c: string) => void;

  // ── Data: Team ──
  teamMembers: TeamMember[];
  setTeamMembers: (t: TeamMember[]) => void;
  partners: Partner[];
  setPartners: (p: Partner[]) => void;

  // ── Data: Admin ──
  adminBanners: Banner[];
  setAdminBanners: (b: Banner[]) => void;
  adminTestimonials: Testimonial[];
  setAdminTestimonials: (t: Testimonial[]) => void;
  adminFaqs: FAQ[];
  setAdminFaqs: (f: FAQ[]) => void;
  adminBlogs: BlogPost[];
  setAdminBlogs: (b: BlogPost[]) => void;
  adminTeam: TeamMember[];
  setAdminTeam: (t: TeamMember[]) => void;
  adminServices: Service[];
  setAdminServices: (s: Service[]) => void;
  adminAgents: Agent[];
  setAdminAgents: (a: Agent[]) => void;
  adminPartners: Partner[];
  setAdminPartners: (p: Partner[]) => void;
  adminContacts: ContactRequest[];
  setAdminContacts: (c: ContactRequest[]) => void;
  adminSeo: SeoSettings[];
  setAdminSeo: (s: SeoSettings[]) => void;

  // ── Chat ──
  conversations: ChatConversation[];
  setConversations: (c: ChatConversation[]) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  chatMessages: Record<string, ChatMessage[]>;
  setChatMessages: (m: Record<string, ChatMessage[]>) => void;
  chatMobileShowMessages: boolean;
  setChatMobileShowMessages: (show: boolean) => void;

  // ── Notifications ──
  notificationsList: Notification[];
  setNotificationsList: (n: Notification[]) => void;

  // ── UI ──
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // ── Search states (legacy compat) ──
  propertySearch: string;
  setPropertySearch: (s: string) => void;
  propertyStatusFilter: string;
  setPropertyStatusFilter: (s: string) => void;
  bookingSearch: string;
  setBookingSearch: (s: string) => void;
  leadSearch: string;
  setLeadSearch: (s: string) => void;
  chatSearch: string;
  setChatSearch: (s: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // ── App Mode ──
  appMode: "public",
  setAppMode: (mode) => set({ appMode: mode }),

  // ── Public Navigation ──
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),
  selectedPropertyId: null,
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  selectedBlogSlug: null,
  setSelectedBlogSlug: (slug) => set({ selectedBlogSlug: slug }),

  // ── Admin Navigation ──
  currentView: "dashboard",
  setCurrentView: (view) => set({ currentView: view }),

  // ── Sidebar ──
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ── Auth ──
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  token: null,
  setToken: (token) => set({ token }),
  isAuthenticated: false,
  setIsAuthenticated: (v) => set({ isAuthenticated: v }),
  loginTab: "email",
  setLoginTab: (tab) => set({ loginTab: tab }),
  loginStep: "input",
  setLoginStep: (step) => set({ loginStep: step }),
  loginIdentifier: "",
  setLoginIdentifier: (v) => set({ loginIdentifier: v }),
  loginOtp: "",
  setLoginOtp: (v) => set({ loginOtp: v }),
  registerStep: 1,
  setRegisterStep: (s) => set({ registerStep: s }),
  registerForm: { username: "", email: "", phone: "" },
  setRegisterForm: (f) => set({ registerForm: f }),
  registerOtp: "",
  setRegisterOtp: (v) => set({ registerOtp: v }),

  // ── Data: Properties ──
  properties: [],
  setProperties: (p) => set({ properties: p }),
  featuredProperties: [],
  setFeaturedProperties: (p) => set({ featuredProperties: p }),
  selectedProperty: null,
  setSelectedProperty: (p) => set({ selectedProperty: p }),
  propertyFilters: {
    search: "", city: "", type: "", status: "",
    minPrice: "", maxPrice: "", minBeds: "", minBaths: "",
    minArea: "", maxArea: "", sort: "newest",
    page: 1, totalPages: 1, total: 0, showFilters: false,
  },
  setPropertyFilters: (f) => set((s) => ({ propertyFilters: { ...s.propertyFilters, ...f } })),

  // ── Data: Home ──
  homeData: null,
  setHomeData: (d) => set({ homeData: d }),

  // ── Data: Blog ──
  blogPosts: [],
  setBlogPosts: (p) => set({ blogPosts: p }),
  selectedBlogPost: null,
  setSelectedBlogPost: (p) => set({ selectedBlogPost: p }),

  // ── Data: FAQ ──
  faqs: [],
  setFaqs: (f) => set({ faqs: f }),
  faqSearch: "",
  setFaqSearch: (s) => set({ faqSearch: s }),
  faqCategory: "All",
  setFaqCategory: (c) => set({ faqCategory: c }),

  // ── Data: Team ──
  teamMembers: [],
  setTeamMembers: (t) => set({ teamMembers: t }),
  partners: [],
  setPartners: (p) => set({ partners: p }),

  // ── Data: Admin ──
  adminBanners: [], setAdminBanners: (b) => set({ adminBanners: b }),
  adminTestimonials: [], setAdminTestimonials: (t) => set({ adminTestimonials: t }),
  adminFaqs: [], setAdminFaqs: (f) => set({ adminFaqs: f }),
  adminBlogs: [], setAdminBlogs: (b) => set({ adminBlogs: b }),
  adminTeam: [], setAdminTeam: (t) => set({ adminTeam: t }),
  adminServices: [], setAdminServices: (s) => set({ adminServices: s }),
  adminAgents: [], setAdminAgents: (a) => set({ adminAgents: a }),
  adminPartners: [], setAdminPartners: (p) => set({ adminPartners: p }),
  adminContacts: [], setAdminContacts: (c) => set({ adminContacts: c }),
  adminSeo: [], setAdminSeo: (s) => set({ adminSeo: s }),

  // ── Chat ──
  conversations: [],
  setConversations: (c) => set({ conversations: c }),
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id, chatMobileShowMessages: id !== null }),
  chatMessages: {},
  setChatMessages: (m) => set({ chatMessages: m }),
  chatMobileShowMessages: false,
  setChatMobileShowMessages: (show) => set({ chatMobileShowMessages: show }),

  // ── Notifications ──
  notificationsList: [],
  setNotificationsList: (n) => set({ notificationsList: n }),

  // ── UI ──
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  // ── Search states (legacy compat) ──
  propertySearch: "", setPropertySearch: (s) => set({ propertySearch: s }),
  propertyStatusFilter: "all", setPropertyStatusFilter: (s) => set({ propertyStatusFilter: s }),
  bookingSearch: "", setBookingSearch: (s) => set({ bookingSearch: s }),
  leadSearch: "", setLeadSearch: (s) => set({ leadSearch: s }),
  chatSearch: "", setChatSearch: (s) => set({ chatSearch: s }),
}));