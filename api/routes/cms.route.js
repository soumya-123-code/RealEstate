import express from "express";
import {
  // Hero Banners
  getHeroBanners, getAllHeroBanners, createHeroBanner, updateHeroBanner, deleteHeroBanner,
  // Services
  getServices, getAllServices, createService, updateService, deleteService,
  // Testimonials
  getTestimonials, getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  // FAQs
  getFaqs, getAllFaqs, createFaq, updateFaq, deleteFaq,
  // Team Members
  getTeamMembers, getAllTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember,
  // Partners
  getPartners, getAllPartners, createPartner, updatePartner, deletePartner,
  // Blog Posts
  getBlogPosts, getBlogPost, getAllBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost,
  // Agents
  getAgents, getAllAgents, createAgent, updateAgent, deleteAgent,
  // Leads
  getLeads, createLead, updateLead, deleteLead,
  // Contact Requests
  getContactRequests, createContactRequest, markContactRequestRead, deleteContactRequest,
  // SEO
  getSeoSettings, getSeoSetting, upsertSeoSetting,
  // Analytics
  getAnalytics,
  // Homepage
  getHomepageData,
} from "../controllers/cms.controller.js";
import { verifyToken, verifyAdmin, requireManageCms } from "../middleware/verifyToken.js";
import {
  getPublicPage,
  getAdminPages,
  getAdminPage,
  updateAdminPage,
  createPageSection,
  updatePageSection,
  deletePageSection,
  reorderPageSections,
} from "../controllers/page.controller.js";

const router = express.Router();

// Panel access for all admin CMS routes; writes also require MANAGE_CMS (ADMIN always ok)
const adminRead = [verifyToken, verifyAdmin];
const adminWrite = [verifyToken, verifyAdmin, requireManageCms];

// ============ PUBLIC ROUTES ============
router.get("/homepage", getHomepageData);
router.get("/pages/:key", getPublicPage);
router.get("/banners", getHeroBanners);
router.get("/services", getServices);
router.get("/testimonials", getTestimonials);
router.get("/faqs", getFaqs);
router.get("/team", getTeamMembers);
router.get("/partners", getPartners);
router.get("/blog", getBlogPosts);
router.get("/blog/:slug", getBlogPost);
router.get("/agents", getAgents);
router.get("/seo/:page", getSeoSetting);
router.post("/contact", createContactRequest);
router.post("/leads", createLead);

// ============ ADMIN ROUTES ============

router.get("/admin/analytics", ...adminRead, getAnalytics);

// Hero Banners
router.get("/admin/banners", ...adminRead, getAllHeroBanners);
router.post("/admin/banners", ...adminWrite, createHeroBanner);
router.put("/admin/banners/:id", ...adminWrite, updateHeroBanner);
router.patch("/admin/banners/:id", ...adminWrite, updateHeroBanner);
router.delete("/admin/banners/:id", ...adminWrite, deleteHeroBanner);

// Services
router.get("/admin/services", ...adminRead, getAllServices);
router.post("/admin/services", ...adminWrite, createService);
router.put("/admin/services/:id", ...adminWrite, updateService);
router.delete("/admin/services/:id", ...adminWrite, deleteService);

// Testimonials
router.get("/admin/testimonials", ...adminRead, getAllTestimonials);
router.post("/admin/testimonials", ...adminWrite, createTestimonial);
router.put("/admin/testimonials/:id", ...adminWrite, updateTestimonial);
router.delete("/admin/testimonials/:id", ...adminWrite, deleteTestimonial);

// FAQs
router.get("/admin/faqs", ...adminRead, getAllFaqs);
router.post("/admin/faqs", ...adminWrite, createFaq);
router.put("/admin/faqs/:id", ...adminWrite, updateFaq);
router.delete("/admin/faqs/:id", ...adminWrite, deleteFaq);

// Team Members
router.get("/admin/team", ...adminRead, getAllTeamMembers);
router.post("/admin/team", ...adminWrite, createTeamMember);
router.put("/admin/team/:id", ...adminWrite, updateTeamMember);
router.delete("/admin/team/:id", ...adminWrite, deleteTeamMember);

// Partners
router.get("/admin/partners", ...adminRead, getAllPartners);
router.post("/admin/partners", ...adminWrite, createPartner);
router.put("/admin/partners/:id", ...adminWrite, updatePartner);
router.delete("/admin/partners/:id", ...adminWrite, deletePartner);

// Blog Posts
router.get("/admin/blogs", ...adminRead, getAllBlogPosts);
router.post("/admin/blogs", ...adminWrite, createBlogPost);
router.put("/admin/blogs/:id", ...adminWrite, updateBlogPost);
router.patch("/admin/blogs/:id", ...adminWrite, updateBlogPost);
router.delete("/admin/blogs/:id", ...adminWrite, deleteBlogPost);

// Agents
router.get("/admin/agents", ...adminRead, getAllAgents);
router.post("/admin/agents", ...adminWrite, createAgent);
router.put("/admin/agents/:id", ...adminWrite, updateAgent);
router.delete("/admin/agents/:id", ...adminWrite, deleteAgent);

// Leads
router.get("/admin/leads", ...adminRead, getLeads);
router.put("/admin/leads/:id", ...adminWrite, updateLead);
router.patch("/admin/leads/:id", ...adminWrite, updateLead);
router.delete("/admin/leads/:id", ...adminWrite, deleteLead);

// Contact Requests
router.get("/admin/contacts", ...adminRead, getContactRequests);
router.put("/admin/contacts/:id/read", ...adminWrite, markContactRequestRead);
router.delete("/admin/contacts/:id", ...adminWrite, deleteContactRequest);

// SEO Settings
router.get("/admin/seo", ...adminRead, getSeoSettings);
router.post("/admin/seo", ...adminWrite, upsertSeoSetting);

// Website Pages / Sections
router.get("/admin/pages", ...adminRead, getAdminPages);
router.get("/admin/pages/:key", ...adminRead, getAdminPage);
router.put("/admin/pages/:key", ...adminWrite, updateAdminPage);
router.post("/admin/pages/:key/sections", ...adminWrite, createPageSection);
router.put("/admin/pages/:key/sections/reorder", ...adminWrite, reorderPageSections);
router.put("/admin/sections/:sectionId", ...adminWrite, updatePageSection);
router.patch("/admin/sections/:sectionId", ...adminWrite, updatePageSection);
router.delete("/admin/sections/:sectionId", ...adminWrite, deletePageSection);

export default router;
