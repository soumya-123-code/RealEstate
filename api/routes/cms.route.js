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
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
router.get("/homepage", getHomepageData);
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

// Analytics
router.get("/admin/analytics", verifyToken, verifyAdmin, getAnalytics);

// Hero Banners
router.get("/admin/banners", verifyToken, verifyAdmin, getAllHeroBanners);
router.post("/admin/banners", verifyToken, verifyAdmin, createHeroBanner);
router.put("/admin/banners/:id", verifyToken, verifyAdmin, updateHeroBanner);
router.patch("/admin/banners/:id", verifyToken, verifyAdmin, updateHeroBanner);
router.delete("/admin/banners/:id", verifyToken, verifyAdmin, deleteHeroBanner);

// Services
router.get("/admin/services", verifyToken, verifyAdmin, getAllServices);
router.post("/admin/services", verifyToken, verifyAdmin, createService);
router.put("/admin/services/:id", verifyToken, verifyAdmin, updateService);
router.delete("/admin/services/:id", verifyToken, verifyAdmin, deleteService);

// Testimonials
router.get("/admin/testimonials", verifyToken, verifyAdmin, getAllTestimonials);
router.post("/admin/testimonials", verifyToken, verifyAdmin, createTestimonial);
router.put("/admin/testimonials/:id", verifyToken, verifyAdmin, updateTestimonial);
router.delete("/admin/testimonials/:id", verifyToken, verifyAdmin, deleteTestimonial);

// FAQs
router.get("/admin/faqs", verifyToken, verifyAdmin, getAllFaqs);
router.post("/admin/faqs", verifyToken, verifyAdmin, createFaq);
router.put("/admin/faqs/:id", verifyToken, verifyAdmin, updateFaq);
router.delete("/admin/faqs/:id", verifyToken, verifyAdmin, deleteFaq);

// Team Members
router.get("/admin/team", verifyToken, verifyAdmin, getAllTeamMembers);
router.post("/admin/team", verifyToken, verifyAdmin, createTeamMember);
router.put("/admin/team/:id", verifyToken, verifyAdmin, updateTeamMember);
router.delete("/admin/team/:id", verifyToken, verifyAdmin, deleteTeamMember);

// Partners
router.get("/admin/partners", verifyToken, verifyAdmin, getAllPartners);
router.post("/admin/partners", verifyToken, verifyAdmin, createPartner);
router.put("/admin/partners/:id", verifyToken, verifyAdmin, updatePartner);
router.delete("/admin/partners/:id", verifyToken, verifyAdmin, deletePartner);

// Blog Posts (Note: endpoint is /admin/blog for consistency)
router.get("/admin/blogs", verifyToken, verifyAdmin, getAllBlogPosts);
router.post("/admin/blogs", verifyToken, verifyAdmin, createBlogPost);
router.put("/admin/blogs/:id", verifyToken, verifyAdmin, updateBlogPost);
router.patch("/admin/blogs/:id", verifyToken, verifyAdmin, updateBlogPost);
router.delete("/admin/blogs/:id", verifyToken, verifyAdmin, deleteBlogPost);

// Agents
router.get("/admin/agents", verifyToken, verifyAdmin, getAllAgents);
router.post("/admin/agents", verifyToken, verifyAdmin, createAgent);
router.put("/admin/agents/:id", verifyToken, verifyAdmin, updateAgent);
router.delete("/admin/agents/:id", verifyToken, verifyAdmin, deleteAgent);

// Leads
router.get("/admin/leads", verifyToken, verifyAdmin, getLeads);
router.put("/admin/leads/:id", verifyToken, verifyAdmin, updateLead);
router.patch("/admin/leads/:id", verifyToken, verifyAdmin, updateLead);
router.delete("/admin/leads/:id", verifyToken, verifyAdmin, deleteLead);

// Contact Requests
router.get("/admin/contacts", verifyToken, verifyAdmin, getContactRequests);
router.put("/admin/contacts/:id/read", verifyToken, verifyAdmin, markContactRequestRead);
router.delete("/admin/contacts/:id", verifyToken, verifyAdmin, deleteContactRequest);

// SEO Settings
router.get("/admin/seo", verifyToken, verifyAdmin, getSeoSettings);
router.post("/admin/seo", verifyToken, verifyAdmin, upsertSeoSetting);

export default router;
