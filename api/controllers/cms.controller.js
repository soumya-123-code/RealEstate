import prisma from "../lib/prisma.js";

// ========================================
// HERO BANNERS
// ========================================

export const getHeroBanners = async (req, res) => {
  try {
    const banners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    res.status(200).json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get hero banners!" });
  }
};

export const getAllHeroBanners = async (req, res) => {
  try {
    const banners = await prisma.heroBanner.findMany({
      orderBy: { order: "asc" },
    });
    res.status(200).json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get hero banners!" });
  }
};

export const createHeroBanner = async (req, res) => {
  try {
    const banner = await prisma.heroBanner.create({ data: req.body });
    res.status(201).json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create hero banner!" });
  }
};

export const updateHeroBanner = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const banner = await prisma.heroBanner.update({ where: { id }, data: req.body });
    res.status(200).json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update hero banner!" });
  }
};

export const deleteHeroBanner = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.heroBanner.delete({ where: { id } });
    res.status(200).json({ message: "Hero banner deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete hero banner!" });
  }
};

// ========================================
// SERVICES
// ========================================

export const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    res.status(200).json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get services!" });
  }
};

export const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
    res.status(200).json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get services!" });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await prisma.service.create({ data: req.body });
    res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create service!" });
  }
};

export const updateService = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const service = await prisma.service.update({ where: { id }, data: req.body });
    res.status(200).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update service!" });
  }
};

export const deleteService = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.service.delete({ where: { id } });
    res.status(200).json({ message: "Service deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete service!" });
  }
};

// ========================================
// TESTIMONIALS
// ========================================

export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    res.status(200).json(testimonials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get testimonials!" });
  }
};

export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
    res.status(200).json(testimonials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get testimonials!" });
  }
};

export const createTestimonial = async (req, res) => {
  try {
    const testimonial = await prisma.testimonial.create({ data: req.body });
    res.status(201).json(testimonial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create testimonial!" });
  }
};

export const updateTestimonial = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const testimonial = await prisma.testimonial.update({ where: { id }, data: req.body });
    res.status(200).json(testimonial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update testimonial!" });
  }
};

export const deleteTestimonial = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.testimonial.delete({ where: { id } });
    res.status(200).json({ message: "Testimonial deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete testimonial!" });
  }
};

// ========================================
// FAQS
// ========================================

export const getFaqs = async (req, res) => {
  const { category } = req.query;
  try {
    const faqs = await prisma.faq.findMany({
      where: { isActive: true, ...(category && { category }) },
      orderBy: { order: "asc" },
    });
    res.status(200).json(faqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get FAQs!" });
  }
};

export const getAllFaqs = async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
    res.status(200).json(faqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get FAQs!" });
  }
};

export const createFaq = async (req, res) => {
  try {
    const faq = await prisma.faq.create({ data: req.body });
    res.status(201).json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create FAQ!" });
  }
};

export const updateFaq = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const faq = await prisma.faq.update({ where: { id }, data: req.body });
    res.status(200).json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update FAQ!" });
  }
};

export const deleteFaq = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.faq.delete({ where: { id } });
    res.status(200).json({ message: "FAQ deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete FAQ!" });
  }
};

// ========================================
// TEAM MEMBERS
// ========================================

export const getTeamMembers = async (req, res) => {
  try {
    const team = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    res.status(200).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get team members!" });
  }
};

export const getAllTeamMembers = async (req, res) => {
  try {
    const team = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });
    res.status(200).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get team members!" });
  }
};

export const createTeamMember = async (req, res) => {
  try {
    const member = await prisma.teamMember.create({ data: req.body });
    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create team member!" });
  }
};

export const updateTeamMember = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const member = await prisma.teamMember.update({ where: { id }, data: req.body });
    res.status(200).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update team member!" });
  }
};

export const deleteTeamMember = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.teamMember.delete({ where: { id } });
    res.status(200).json({ message: "Team member deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete team member!" });
  }
};

// ========================================
// PARTNERS
// ========================================

export const getPartners = async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    res.status(200).json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get partners!" });
  }
};

export const getAllPartners = async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { order: "asc" } });
    res.status(200).json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get partners!" });
  }
};

export const createPartner = async (req, res) => {
  try {
    const partner = await prisma.partner.create({ data: req.body });
    res.status(201).json(partner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create partner!" });
  }
};

export const updatePartner = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const partner = await prisma.partner.update({ where: { id }, data: req.body });
    res.status(200).json(partner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update partner!" });
  }
};

export const deletePartner = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.partner.delete({ where: { id } });
    res.status(200).json({ message: "Partner deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete partner!" });
  }
};

// ========================================
// BLOG POSTS
// ========================================

export const getBlogPosts = async (req, res) => {
  const { category, featured, limit } = req.query;
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        ...(category && { category }),
        ...(featured === "true" && { featured: true }),
      },
      orderBy: { createdAt: "desc" },
      ...(limit && { take: parseInt(limit) }),
    });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get blog posts!" });
  }
};

export const getBlogPost = async (req, res) => {
  const { slug } = req.params;
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
    });
    if (!post) return res.status(404).json({ message: "Blog post not found!" });
    res.status(200).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get blog post!" });
  }
};

export const getAllBlogPosts = async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get blog posts!" });
  }
};

export const createBlogPost = async (req, res) => {
  try {
    const post = await prisma.blogPost.create({ data: req.body });
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create blog post!" });
  }
};

export const updateBlogPost = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const post = await prisma.blogPost.update({ where: { id }, data: req.body });
    res.status(200).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update blog post!" });
  }
};

export const deleteBlogPost = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.blogPost.delete({ where: { id } });
    res.status(200).json({ message: "Blog post deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete blog post!" });
  }
};

// ========================================
// AGENTS
// ========================================

export const getAgents = async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true, username: true, email: true, avatar: true, phone: true } } },
      orderBy: { rating: "desc" },
    });
    res.status(200).json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get agents!" });
  }
};

export const getAllAgents = async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: { user: { select: { id: true, username: true, email: true, avatar: true, phone: true } } },
    });
    res.status(200).json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get agents!" });
  }
};

export const createAgent = async (req, res) => {
  try {
    const agent = await prisma.agent.create({ data: req.body });
    res.status(201).json(agent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create agent!" });
  }
};

export const updateAgent = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const agent = await prisma.agent.update({ where: { id }, data: req.body });
    res.status(200).json(agent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update agent!" });
  }
};

export const deleteAgent = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.agent.delete({ where: { id } });
    res.status(200).json({ message: "Agent deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete agent!" });
  }
};

// ========================================
// LEADS
// ========================================

export const getLeads = async (req, res) => {
  const { status, source } = req.query;
  try {
    const leads = await prisma.lead.findMany({
      where: { ...(status && { status }), ...(source && { source }) },
      include: { assignedTo: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get leads!" });
  }
};

export const createLead = async (req, res) => {
  try {
    const lead = await prisma.lead.create({ data: req.body });
    
    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    const { createNotification } = await import("./notification.controller.js");
    for (const admin of admins) {
      await createNotification(admin.id, "New Lead", `${lead.name} - ${lead.phone}`, "LEAD");
    }
    
    res.status(201).json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create lead!" });
  }
};

export const updateLead = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const lead = await prisma.lead.update({ where: { id }, data: req.body });
    res.status(200).json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update lead!" });
  }
};

export const deleteLead = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.lead.delete({ where: { id } });
    res.status(200).json({ message: "Lead deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete lead!" });
  }
};

// ========================================
// CONTACT REQUESTS
// ========================================

export const getContactRequests = async (req, res) => {
  try {
    const requests = await prisma.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get contact requests!" });
  }
};

export const createContactRequest = async (req, res) => {
  try {
    const contactRequest = await prisma.contactRequest.create({ data: req.body });
    
    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    const { createNotification } = await import("./notification.controller.js");
    for (const admin of admins) {
      await createNotification(admin.id, "New Contact Request", `${req.body.name}: ${req.body.subject || "General Inquiry"}`, "INQUIRY");
    }
    
    res.status(201).json(contactRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit contact request!" });
  }
};

export const markContactRequestRead = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.contactRequest.update({ where: { id }, data: { isRead: true } });
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update!" });
  }
};

export const deleteContactRequest = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.contactRequest.delete({ where: { id } });
    res.status(200).json({ message: "Contact request deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete!" });
  }
};

// ========================================
// SEO SETTINGS
// ========================================

export const getSeoSettings = async (req, res) => {
  try {
    const settings = await prisma.seoSetting.findMany();
    res.status(200).json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get SEO settings!" });
  }
};

export const getSeoSetting = async (req, res) => {
  const { page } = req.params;
  try {
    const setting = await prisma.seoSetting.findUnique({ where: { page } });
    if (!setting) return res.status(404).json({ message: "SEO setting not found!" });
    res.status(200).json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get SEO setting!" });
  }
};

export const upsertSeoSetting = async (req, res) => {
  const { page } = req.body;
  try {
    const setting = await prisma.seoSetting.upsert({
      where: { page },
      update: req.body,
      create: req.body,
    });
    res.status(200).json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update SEO setting!" });
  }
};

// ========================================
// ANALYTICS / DASHBOARD STATS
// ========================================

export const getAnalytics = async (req, res) => {
  try {
    const [
      totalProperties,
      availableProperties,
      tokenBooked,
      soldProperties,
      totalBookings,
      tokenPaidBookings,
      totalUsers,
      totalAgents,
      totalLeads,
      newLeads,
      totalContacts,
      unreadContacts,
      totalBanners,
      totalTestimonials,
      totalFaqs,
      totalBlogPosts,
      totalTeamMembers,
      totalPartners,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: "AVAILABLE" } }),
      prisma.property.count({ where: { status: "TOKEN_BOOKED" } }),
      prisma.property.count({ where: { status: "SOLD" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { bookingStatus: "TOKEN_PAID" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.agent.count({ where: { isActive: true } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.contactRequest.count(),
      prisma.contactRequest.count({ where: { isRead: false } }),
      prisma.heroBanner.count(),
      prisma.testimonial.count(),
      prisma.faq.count(),
      prisma.blogPost.count(),
      prisma.teamMember.count(),
      prisma.partner.count(),
    ]);

    // Properties by type
    const propertiesByType = await prisma.property.groupBy({
      by: ["propertyType"],
      _count: { propertyType: true },
    });

    // Properties by state
    const propertiesByState = await prisma.property.groupBy({
      by: ["state"],
      _count: { state: true },
      orderBy: { _count: { state: "desc" } },
      take: 10,
    });

    // Properties by city
    const propertiesByCity = await prisma.property.groupBy({
      by: ["city", "state"],
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 10,
    });

    // Bookings by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ["bookingStatus"],
      _count: { bookingStatus: true },
    });

    // Leads by source
    const leadsBySource = await prisma.lead.groupBy({
      by: ["source"],
      _count: { source: true },
    });

    // Monthly bookings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentBookings = await prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, bookingStatus: true },
    });

    // Recent activity
    const recentLeads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const recentContacts = await prisma.contactRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      overview: {
        totalProperties,
        availableProperties,
        tokenBooked,
        soldProperties,
        totalBookings,
        tokenPaidBookings,
        totalUsers,
        totalAgents,
        totalLeads,
        newLeads,
        totalContacts,
        unreadContacts,
      },
      cms: {
        totalBanners,
        totalTestimonials,
        totalFaqs,
        totalBlogPosts,
        totalTeamMembers,
        totalPartners,
      },
      charts: {
        propertiesByType: propertiesByType.map(p => ({ type: p.propertyType, count: p._count.propertyType })),
        propertiesByState: propertiesByState.map(p => ({ state: p.state, count: p._count.state })),
        propertiesByCity: propertiesByCity.map(c => ({ city: c.city, state: c.state, count: c._count.city })),
        bookingsByStatus: bookingsByStatus.map(b => ({ status: b.bookingStatus, count: b._count.bookingStatus })),
        leadsBySource: leadsBySource.map(l => ({ source: l.source, count: l._count.source })),
        recentBookings,
      },
      recent: {
        leads: recentLeads,
        contacts: recentContacts,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get analytics!" });
  }
};

// ========================================
// HOMEPAGE DATA (aggregated public endpoint)
// ========================================

export const getHomepageData = async (req, res) => {
  try {
    const [banners, services, testimonials, featuredProperties, companyInfo, blogPosts, partners, team] = await Promise.all([
      prisma.heroBanner.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      prisma.property.findMany({ where: { isFeatured: true, status: "AVAILABLE" }, take: 6, orderBy: { createdAt: "desc" } }),
      prisma.companySettings.findFirst(),
      prisma.blogPost.findMany({ where: { isPublished: true, featured: true }, take: 3, orderBy: { createdAt: "desc" } }),
      prisma.partner.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      prisma.teamMember.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 4 }),
    ]);

    // Get unique cities with property counts
    const cityStats = await prisma.property.groupBy({
      by: ["city", "state"],
      where: { status: "AVAILABLE" },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    });

    const stats = {
      totalProperties: await prisma.property.count({ where: { status: "AVAILABLE" } }),
      totalCities: (await prisma.property.groupBy({ by: ["city"] })).length,
      totalBookings: await prisma.booking.count(),
      totalAgents: await prisma.agent.count({ where: { isActive: true } }),
    };

    res.status(200).json({
      banners,
      services,
      testimonials,
      featuredProperties,
      companyInfo,
      blogPosts,
      partners,
      team,
      cityStats: cityStats.map(c => ({ city: c.city, state: c.state, count: c._count.city })),
      stats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get homepage data!" });
  }
};
