import {
  type Property,
  type User,
  type Booking,
  type Lead,
  type DashboardStats,
  type ChatConversation,
  type ChatMessage,
  properties,
  users,
  bookings,
  leads,
  dashboardStats,
  conversations,
  messages,
  monthlyRevenue,
  propertyTypeDistribution,
} from "./mock-data";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    if (res.ok) {
      const data = await res.json();
      return data as T;
    }
    throw new Error(`API error: ${res.status}`);
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error("API unavailable and no fallback provided");
  }
}

// ─── Auth ──────────────────────────────────────────────────────
export const auth = {
  login: (identifier: string, otp?: string) =>
    request<{ user: User; token: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ identifier, otp }) },
      { user: users[0], token: "mock-jwt-token-xyz" }
    ),
  register: (data: { username: string; email: string; phone: string; otp?: string }) =>
    request<{ user: User; token: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(data) },
      { user: users[4], token: "mock-jwt-token-new" }
    ),
  verifyOtp: (email: string, otp: string) =>
    request<{ success: boolean; token?: string }>(
      "/auth/verify-otp",
      { method: "POST", body: JSON.stringify({ email, otp }) },
      { success: true, token: "mock-verified-token" }
    ),
  preview: (identifier: string) =>
    request<{ exists: boolean; userType: string; maskedValue: string }>(
      "/auth/preview",
      { method: "POST", body: JSON.stringify({ identifier }) },
      { exists: true, userType: "customer", maskedValue: identifier.includes("@") ? identifier.replace(/(.{2})(.*)(@.*)/, "$1***$3") : identifier.replace(/(.{4})(.*)(.{3})/, "$1****$3") }
    ),
  logout: () =>
    request<{ success: boolean }>("/auth/logout", { method: "POST" }, { success: true }),
};

// ─── Properties ────────────────────────────────────────────────
export interface PropertyFilters {
  search?: string;
  city?: string;
  type?: string;
  status?: string;
  saleType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minArea?: number;
  maxArea?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const propertiesApi = {
  list: (filters?: PropertyFilters) => {
    let filtered = [...properties];
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(s) || p.location.toLowerCase().includes(s) || p.city.toLowerCase().includes(s));
    }
    if (filters?.city) filtered = filtered.filter((p) => p.city === filters.city);
    if (filters?.type) filtered = filtered.filter((p) => p.type === filters.type);
    if (filters?.status) filtered = filtered.filter((p) => p.status === filters.status);
    if (filters?.minBeds) filtered = filtered.filter((p) => p.bedrooms >= (filters.minBeds || 0));
    if (filters?.minBaths) filtered = filtered.filter((p) => p.bathrooms >= (filters.minBaths || 0));
    if (filters?.minArea) filtered = filtered.filter((p) => p.area >= (filters.minArea || 0));
    if (filters?.maxArea) filtered = filtered.filter((p) => p.area <= (filters.maxArea || Infinity));
    if (filters?.minPrice) filtered = filtered.filter((p) => p.price >= (filters.minPrice || 0));
    if (filters?.maxPrice) filtered = filtered.filter((p) => p.price <= (filters.maxPrice || Infinity));
    if (filters?.sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
    else if (filters?.sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
    else if (filters?.sort === "area-desc") filtered.sort((a, b) => b.area - a.area);
    else filtered.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    const page = filters?.page || 1;
    const limit = filters?.limit || 9;
    const total = filtered.length;
    const data = filtered.slice((page - 1) * limit, page * limit);
    return request<PaginatedResponse<Property>>("/properties", { method: "POST", body: JSON.stringify(filters) }, { data, total, page, limit, totalPages: Math.ceil(total / limit) });
  },
  detail: (id: string) =>
    request<Property>(`/properties/${id}`, undefined, properties.find((p) => p.id === id) || properties[0]),
  filters: () =>
    request<{ cities: string[]; types: string[]; statuses: string[] }>("/properties/filters", undefined, {
      cities: [...new Set(properties.map((p) => p.city))],
      types: [...new Set(properties.map((p) => p.type))],
      statuses: [...new Set(properties.map((p) => p.status))],
    }),
  whatsappBooking: (propertyId: string, phone: string, name: string) =>
    request<{ success: boolean; message: string }>(
      "/properties/whatsapp-booking",
      { method: "POST", body: JSON.stringify({ propertyId, phone, name }) },
      { success: true, message: "Booking request sent via WhatsApp" }
    ),
};

// ─── Admin Dashboard ───────────────────────────────────────────
export const admin = {
  dashboard: () =>
    request<{
      stats: DashboardStats;
      monthlyRevenue: { month: string; revenue: number }[];
      propertyTypeDistribution: { type: string; count: number; fill: string }[];
    }>("/admin/dashboard", undefined, { stats: dashboardStats, monthlyRevenue, propertyTypeDistribution }),
  properties: {
    list: (search?: string, status?: string) => {
      let filtered = [...properties];
      if (search) { const s = search.toLowerCase(); filtered = filtered.filter((p) => p.title.toLowerCase().includes(s)); }
      if (status) filtered = filtered.filter((p) => p.status === status);
      return request<Property[]>("/admin/properties", undefined, filtered);
    },
    create: (data: Partial<Property>) => request<Property>("/admin/properties", { method: "POST", body: JSON.stringify(data) }, { ...properties[0], id: "PROP-NEW", ...data } as Property),
    update: (id: string, data: Partial<Property>) => request<Property>(`/admin/properties/${id}`, { method: "PUT", body: JSON.stringify(data) }, { ...properties[0], ...data } as Property),
    delete: (id: string) => request<{ success: boolean }>(`/admin/properties/${id}`, { method: "DELETE" }, { success: true }),
  },
  bookings: {
    list: (search?: string) => {
      let filtered = [...bookings];
      if (search) { const s = search.toLowerCase(); filtered = filtered.filter((b) => b.clientName.toLowerCase().includes(s) || b.propertyTitle.toLowerCase().includes(s)); }
      return request<Booking[]>("/admin/bookings", undefined, filtered);
    },
    updateStatus: (id: string, status: string) => request<Booking>(`/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, { ...bookings[0], status } as Booking),
  },
  users: {
    list: (search?: string) => {
      let filtered = [...users];
      if (search) { const s = search.toLowerCase(); filtered = filtered.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)); }
      return request<User[]>("/admin/users", undefined, filtered);
    },
    create: (data: Partial<User>) => request<User>("/admin/users", { method: "POST", body: JSON.stringify(data) }, { ...users[0], id: "U-NEW", ...data } as User),
    update: (id: string, data: Partial<User>) => request<User>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }, { ...users[0], ...data } as User),
    delete: (id: string) => request<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" }, { success: true }),
  },
  staff: {
    list: () => request<User[]>("/admin/staff", undefined, users.filter((u) => u.role === "staff" || u.role === "agent")),
  },
  leads: {
    list: (search?: string) => {
      let filtered = [...leads];
      if (search) { const s = search.toLowerCase(); filtered = filtered.filter((l) => l.name.toLowerCase().includes(s)); }
      return request<Lead[]>("/admin/leads", undefined, filtered);
    },
    updateStage: (id: string, stage: string) => request<Lead>(`/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) }, { ...leads[0], stage } as Lead),
  },
  analytics: () =>
    request<{ revenueData: { month: string; revenue: number }[]; bookingsData: { month: string; bookings: number }[]; leadsData: { month: string; leads: number }[] }>(
      "/admin/analytics",
      undefined,
      {
        revenueData: monthlyRevenue,
        bookingsData: [
          { month: "Aug", bookings: 3 },
          { month: "Sep", bookings: 5 },
          { month: "Oct", bookings: 2 },
          { month: "Nov", bookings: 4 },
          { month: "Dec", bookings: 6 },
          { month: "Jan", bookings: 5 },
        ],
        leadsData: [
          { month: "Aug", leads: 12 },
          { month: "Sep", leads: 18 },
          { month: "Oct", leads: 9 },
          { month: "Nov", leads: 15 },
          { month: "Dec", leads: 22 },
          { month: "Jan", leads: 20 },
        ],
      }
    ),
};

// ─── CMS ───────────────────────────────────────────────────────
export interface Banner { id: string; title: string; image: string; order: number; active: boolean; link?: string }
export interface Testimonial { id: string; name: string; role: string; rating: number; text: string; avatar: string }
export interface FAQ { id: string; question: string; answer: string; category: string }
export interface BlogPost { id: string; title: string; slug: string; excerpt: string; content: string; coverImage: string; category: string; author: string; publishedAt: string; published: boolean }
export interface TeamMember { id: string; name: string; designation: string; bio: string; photo: string; socialLinks: { linkedin?: string; twitter?: string } }
export interface Partner { id: string; name: string; logo: string; website: string }
export interface Service { id: string; icon: string; title: string; description: string; image: string; order: number }
export interface Agent { id: string; name: string; photo: string; license: string; specializations: string[]; experience: number; rating: number; phone: string; email: string }
export interface ContactRequest { id: string; name: string; email: string; phone: string; subject: string; message: string; read: boolean; createdAt: string }
export interface SeoSettings { id: string; page: string; metaTitle: string; metaDescription: string; keywords: string }

export const mockBanners: Banner[] = [
  { id: "BN1", title: "Luxury Living in Bhubaneswar", image: "/properties/prop8.jpg", order: 1, active: true, link: "/property/PROP008" },
  { id: "BN2", title: "Affordable Apartments at Patia", image: "/properties/prop1.jpg", order: 2, active: true, link: "/property/PROP001" },
  { id: "BN3", title: "Premium Villa with Garden", image: "/properties/prop2.jpg", order: 3, active: false, link: "/property/PROP002" },
];

export const mockTestimonials: Testimonial[] = [
  { id: "T1", name: "Debashish Mishra", role: "Homeowner", rating: 5, text: "Suretreaven made our dream of owning a home a reality. Their team was professional, transparent, and always available to address our concerns.", avatar: "" },
  { id: "T2", name: "Anita Patra", role: "Investor", rating: 4, text: "I've invested in multiple properties through Suretreaven. Their market knowledge and honest guidance helped me make profitable decisions.", avatar: "" },
  { id: "T3", name: "Sanjay Behera", role: "First-time Buyer", rating: 5, text: "As a first-time buyer, I was nervous about the process. The team at Suretreaven walked me through every step with patience and expertise.", avatar: "" },
  { id: "T4", name: "Meera Panda", role: "Commercial Buyer", rating: 4, text: "Found the perfect commercial space for my business. The agents understood my requirements and showed me exactly what I needed.", avatar: "" },
];

export const mockFaqs: FAQ[] = [
  { id: "F1", question: "What documents are required to buy a property?", answer: "You will need your ID proof (Aadhaar/PAN), address proof, income proof (salary slips/ITR), bank statements for the last 6 months, and passport-size photographs. For home loans, additional documents may be required by the lending institution.", category: "Buying" },
  { id: "F2", question: "How do I schedule a property site visit?", answer: "You can schedule a site visit by calling our office, filling out the contact form on our website, or simply clicking the 'Book Visit' button on any property listing. Our team will confirm the visit within 2 hours.", category: "General" },
  { id: "F3", question: "Do you assist with home loan processing?", answer: "Yes, we have tie-ups with multiple banks and NBFCs. Our financial advisor will help you compare loan offers, assist with documentation, and guide you through the entire loan approval process at no extra cost.", category: "Finance" },
  { id: "F4", question: "What is the token booking amount?", answer: "The token booking amount varies by property but typically ranges from ₹10,000 to ₹1,00,000. This amount is adjustable against the final purchase price and secures your interest in the property.", category: "Buying" },
  { id: "F5", question: "How long does the registration process take?", answer: "Property registration in Odisha typically takes 7-15 working days from the date of document submission. Our legal team handles all paperwork and keeps you updated throughout the process.", category: "Legal" },
  { id: "F6", question: "Do you offer property management services?", answer: "Yes, we offer comprehensive property management services including tenant sourcing, rent collection, maintenance coordination, and periodic property inspections for a nominal monthly fee.", category: "Services" },
  { id: "F7", question: "What areas in Odisha do you cover?", answer: "We primarily serve Bhubaneswar, Cuttack, Puri, Rourkela, and Sambalpur. We also have listings in emerging areas like Jatni, Khurda, and the greater Bhubaneswar region.", category: "General" },
  { id: "F8", question: "Can I sell my property through Suretreaven?", answer: "Absolutely! We provide end-to-end selling assistance including property valuation, professional photography, listing on multiple platforms, buyer screening, negotiation support, and legal documentation.", category: "Selling" },
];

export const mockBlogPosts: BlogPost[] = [
  { id: "BL1", title: "Top 5 Investment Hotspots in Bhubaneswar for 2026", slug: "investment-hotspots-bhubaneswar-2026", excerpt: "Discover the most promising areas in Bhubaneswar for real estate investment this year, backed by market data and growth projections.", content: "Bhubaneswar has emerged as one of the fastest-growing Tier-2 cities in India. With the IT sector booming and infrastructure development at its peak, several areas are offering excellent returns on investment. Patia, Infocity, and Khandagiri continue to be top picks, while emerging areas like Jatni and Khurda are gaining traction. In this guide, we analyze the top 5 investment hotspots based on price appreciation, rental yield, and infrastructure development.", coverImage: "/properties/prop1.jpg", category: "Investment", author: "Rajesh Kumar Mohapatra", publishedAt: "2026-01-20", published: true },
  { id: "BL2", title: "Complete Guide to Home Loan Process in India", slug: "home-loan-guide-india", excerpt: "Everything you need to know about applying for a home loan, from eligibility criteria to documentation and approval timeline.", content: "Getting a home loan can seem daunting, but with the right information, it's a straightforward process. This comprehensive guide covers eligibility criteria, required documents, interest rate types, EMI calculation, and the step-by-step application process.", coverImage: "/properties/prop2.jpg", category: "Finance", author: "Priya Dash", publishedAt: "2026-01-15", published: true },
  { id: "BL3", title: "Why Odisha is the Next Big Real Estate Destination", slug: "odisha-real-estate-destination", excerpt: "Learn about the factors driving Odisha's real estate growth and why investors are flocking to the state.", content: "Odisha's real estate sector is witnessing unprecedented growth driven by industrialization, improved connectivity, and government initiatives. The state's capital Bhubaneswar has been consistently ranked among the top emerging cities for real estate investment.", coverImage: "/properties/prop6.jpg", category: "Market Trends", author: "Amit Sahoo", publishedAt: "2026-01-10", published: true },
  { id: "BL4", title: "Vastu Tips for Your New Home", slug: "vastu-tips-new-home", excerpt: "Important Vastu Shastra principles to consider when designing or buying your new home in Odisha.", content: "Vastu Shastra plays an important role in Odia culture. Here are essential Vastu tips for different rooms and directions in your home, helping you create a harmonious living space.", coverImage: "/properties/prop7.jpg", category: "Home Tips", author: "Sunita Rout", publishedAt: "2026-01-05", published: true },
  { id: "BL5", title: "Understanding RERA: What Buyers Need to Know", slug: "rera-guide-buyers", excerpt: "A comprehensive guide to RERA Odisha and how it protects home buyers from fraudulent practices.", content: "The Real Estate (Regulation and Development) Act, 2016 (RERA) has transformed the real estate landscape in India. This guide explains how RERA Odisha works and what protections it offers to home buyers.", coverImage: "/properties/prop5.jpg", category: "Legal", author: "Rajesh Kumar Mohapatra", publishedAt: "2025-12-28", published: true },
  { id: "BL6", title: "Draft: Upcoming Projects in 2026", slug: "upcoming-projects-2026", excerpt: "Sneak peek into the exciting new projects launching in Bhubaneswar and Cuttack in 2026.", content: "2026 is set to be an exciting year for real estate in Odisha with several premium projects in the pipeline.", coverImage: "/properties/prop8.jpg", category: "Market Trends", author: "Amit Sahoo", publishedAt: "2026-01-25", published: false },
];

export const mockTeam: TeamMember[] = [
  { id: "TM1", name: "Rajesh Kumar Mohapatra", designation: "Founder & CEO", bio: "With over 15 years of experience in real estate, Rajesh leads Suretreaven with a vision to make property transactions transparent and hassle-free.", photo: "", socialLinks: { linkedin: "#" } },
  { id: "TM2", name: "Priya Dash", designation: "Operations Manager", bio: "Priya oversees day-to-day operations, ensuring every client interaction exceeds expectations. She brings 8 years of real estate operations expertise.", photo: "", socialLinks: { linkedin: "#" } },
  { id: "TM3", name: "Amit Sahoo", designation: "Senior Property Consultant", bio: "Amit specializes in residential and commercial properties in Bhubaneswar. His deep market knowledge has helped 100+ families find their dream homes.", photo: "", socialLinks: { linkedin: "#" } },
  { id: "TM4", name: "Sunita Rout", designation: "Property Consultant", bio: "Sunita focuses on luxury properties and investment advisory. Her client-first approach has earned her a 4.9 rating from satisfied customers.", photo: "", socialLinks: { linkedin: "#" } },
];

export const mockPartners: Partner[] = [
  { id: "P1", name: "SBI Home Loans", logo: "", website: "https://sbi.co.in" },
  { id: "P2", name: "HDFC Realty", logo: "", website: "https://hdfc.com" },
  { id: "P3", name: "LIC Housing Finance", logo: "", website: "https://lichousing.com" },
  { id: "P4", name: "Odisha State Housing Board", logo: "", website: "#" },
  { id: "P5", name: "JMC Architects", logo: "", website: "#" },
];

export const mockServices: Service[] = [
  { id: "S1", icon: "Building2", title: "Property Buying", description: "Find your dream property from our curated listings of apartments, villas, plots, and commercial spaces across Odisha.", image: "/properties/prop1.jpg", order: 1 },
  { id: "S2", icon: "TrendingUp", title: "Property Selling", description: "Get the best value for your property with our expert pricing, marketing, and negotiation support.", image: "/properties/prop2.jpg", order: 2 },
  { id: "S3", icon: "KeyRound", title: "Rental Services", description: "Comprehensive property management including tenant sourcing, rent collection, and maintenance.", image: "/properties/prop6.jpg", order: 3 },
  { id: "S4", icon: "Scale", title: "Legal Assistance", description: "End-to-end legal support for property verification, registration, documentation, and dispute resolution.", image: "/properties/prop7.jpg", order: 4 },
];

export const mockAgents: Agent[] = [
  { id: "A1", name: "Amit Sahoo", photo: "", license: "RERA-OD-2023-001", specializations: ["Residential", "Commercial"], experience: 7, rating: 4.8, phone: "+91 76543 21098", email: "amit@greenvalley.in" },
  { id: "A2", name: "Sunita Rout", photo: "", license: "RERA-OD-2024-002", specializations: ["Luxury", "Investment"], experience: 5, rating: 4.9, phone: "+91 65432 10987", email: "sunita@greenvalley.in" },
];

export const mockContacts: ContactRequest[] = [
  { id: "CR1", name: "Sanjay Behera", email: "sanjay.b@email.com", phone: "+91 99887 76655", subject: "Property Inquiry", message: "I am interested in 3BHK apartments in Patia area. Please share available options.", read: true, createdAt: "2026-01-25" },
  { id: "CR2", name: "Meera Panda", email: "meera.p@email.com", phone: "+91 88776 65544", subject: "Site Visit Request", message: "Would like to visit the Royal Orchid Villa this weekend. Please arrange.", read: true, createdAt: "2026-01-24" },
  { id: "CR3", name: "Lipi Mohanty", email: "lipi.m@email.com", phone: "+91 66554 43322", subject: "Loan Assistance", message: "Need help with home loan for a 2BHK apartment. Budget is 30-35 Lakh.", read: false, createdAt: "2026-01-23" },
  { id: "CR4", name: "Bikram Keshari", email: "bikram.k@email.com", phone: "+91 55443 32211", subject: "Partnership Inquiry", message: "I represent a construction company. We would like to discuss a potential partnership.", read: false, createdAt: "2026-01-22" },
];

export const mockSeoSettings: SeoSettings[] = [
  { id: "SEO1", page: "Home", metaTitle: "Suretreaven | Premium Real Estate in Bhubaneswar, Odisha", metaDescription: "Find your dream property with Suretreaven. Premium apartments, villas, plots, and commercial spaces in Bhubaneswar and across Odisha.", keywords: "real estate bhubaneswar, property odisha, apartments bhubaneswar, villas, plots" },
  { id: "SEO2", page: "Properties", metaTitle: "Properties | Suretreaven - Browse All Listings", metaDescription: "Browse our curated collection of residential and commercial properties across Odisha.", keywords: "property listings, buy property, rent property, bhubaneswar properties" },
  { id: "SEO3", page: "About", metaTitle: "About Us | Suretreaven - Our Story", metaDescription: "Learn about Suretreaven, our mission, team, and commitment to making real estate simple.", keywords: "about green valley, real estate agents, property consultants odisha" },
  { id: "SEO4", page: "Contact", metaTitle: "Contact Us | Suretreaven", metaDescription: "Get in touch with Suretreaven for property inquiries, site visits, and consultations.", keywords: "contact real estate, property inquiry, bhubaneswar realtor" },
  { id: "SEO5", page: "Blog", metaTitle: "Blog | Suretreaven - Real Estate News & Tips", metaDescription: "Stay updated with the latest real estate news, market trends, and property buying tips.", keywords: "real estate blog, property tips, market trends odisha" },
];

export const cms = {
  homepage: () =>
    request<{
      banners: Banner[];
      services: Service[];
      testimonials: Testimonial[];
      featuredProperties: Property[];
      stats: { properties: number; customers: number; cities: number; years: number };
    }>("/cms/homepage", undefined, {
      banners: mockBanners,
      services: mockServices,
      testimonials: mockTestimonials,
      featuredProperties: properties.filter((p) => p.status === "available").slice(0, 4),
      stats: { properties: 10, customers: 500, cities: 5, years: 12 },
    }),
  banners: () => request<Banner[]>("/cms/banners", undefined, mockBanners),
  services: () => request<Service[]>("/cms/services", undefined, mockServices),
  testimonials: () => request<Testimonial[]>("/cms/testimonials", undefined, mockTestimonials),
  faqs: () => request<FAQ[]>("/cms/faqs", undefined, mockFaqs),
  team: () => request<TeamMember[]>("/cms/team", undefined, mockTeam),
  partners: () => request<Partner[]>("/cms/partners", undefined, mockPartners),
  blog: {
    list: (search?: string, category?: string) => {
      let filtered = [...mockBlogPosts];
      if (search) { const s = search.toLowerCase(); filtered = filtered.filter((b) => b.title.toLowerCase().includes(s) || b.excerpt.toLowerCase().includes(s)); }
      if (category) filtered = filtered.filter((b) => b.category === category);
      return request<BlogPost[]>("/cms/blog", undefined, filtered);
    },
    detail: (slug: string) => request<BlogPost>(`/cms/blog/${slug}`, undefined, mockBlogPosts.find((b) => b.slug === slug) || mockBlogPosts[0]),
  },
  agents: () => request<Agent[]>("/cms/agents", undefined, mockAgents),
  leads: () => request<Lead[]>("/cms/leads", undefined, leads),
  contacts: () => request<ContactRequest[]>("/cms/contacts", undefined, mockContacts),
  seo: () => request<SeoSettings[]>("/cms/seo", undefined, mockSeoSettings),
  contact: (data: { name: string; email: string; phone: string; subject: string; message: string }) =>
    request<{ success: boolean; id: string }>("/cms/contact", { method: "POST", body: JSON.stringify(data) }, { success: true, id: "CR-NEW" }),
};

// ─── Chats ─────────────────────────────────────────────────────
export const chatApi = {
  list: () =>
    request<ChatConversation[]>("/chats", undefined, conversations),
  detail: (id: string) =>
    request<{ conversation: ChatConversation; messages: ChatMessage[] }>(
      `/chats/${id}`,
      undefined,
      { conversation: conversations.find((c) => c.id === id) || conversations[0], messages: messages[id] || [] }
    ),
  create: (userId: string) =>
    request<ChatConversation>("/chats", { method: "POST", body: JSON.stringify({ userId }) }, conversations[0]),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/chats/${id}/read`, { method: "POST" }, { success: true }),
  messages: (id: string) =>
    request<ChatMessage[]>(`/chats/${id}/messages`, undefined, messages[id] || []),
};

// ─── Company ───────────────────────────────────────────────────
export const company = {
  settings: () =>
    request<{ name: string; email: string; phone: string; address: string; website: string; gstin: string; logo: string }>(
      "/company/settings",
      undefined,
      {
        name: "Suretreaven",
        email: "info@greenvalley.in",
        phone: "+91 98765 43210",
        address: "Plot No. 45, Saheed Nagar, Bhubaneswar, Odisha - 751007",
        website: "www.greenvalley.in",
        gstin: "21AABCG1234F1ZP",
        logo: "",
      }
    ),
};

// ─── Notifications ─────────────────────────────────────────────
export interface Notification { id: string; title: string; message: string; read: boolean; createdAt: string; type: string }

export const mockNotifications: Notification[] = [
  { id: "N1", title: "New Booking", message: "Debashish Mishra booked Tech Park Commercial Office", read: false, createdAt: "2026-01-25", type: "booking" },
  { id: "N2", title: "New Lead", message: "Priti Jena submitted a new inquiry", read: false, createdAt: "2026-01-24", type: "lead" },
  { id: "N3", title: "Payment Received", message: "₹18 Lakh received for Rourkela Plot", read: true, createdAt: "2026-01-23", type: "payment" },
];

export const notifications = {
  list: () => request<Notification[]>("/notifications", undefined, mockNotifications),
  markRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: "POST" }, { success: true }),
};