import prisma from "../lib/prisma.js";

// Advanced property search (Public)
export const getProperties = async (req, res) => {
  const {
    city, state, locality, propertyType, saleType, listingType, furnishingStatus,
    minPrice, maxPrice, bedroom, bathroom, minArea, maxArea,
    status, isFeatured, sort, page = 1, limit = 12,
  } = req.query;

  const enumValues = {
    propertyType: ["APARTMENT", "HOUSE", "VILLA", "PLOT", "COMMERCIAL", "LAND", "FARMHOUSE", "PENTHOUSE", "STUDIO"],
    saleType: ["SALE", "RENT", "LEASE"],
    listingType: ["NEW", "RESALE"],
    furnishingStatus: ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"],
    status: ["AVAILABLE", "TOKEN_BOOKED", "SOLD", "RENTED", "UNAVAILABLE", "UNDER_CONSTRUCTION"],
  };
  for (const [key, allowed] of Object.entries(enumValues)) {
    if (req.query[key] && !allowed.includes(req.query[key])) {
      return res.status(400).json({ message: `Invalid ${key}.` });
    }
  }

  try {
    const whereClause = {
      ...(city && { city: { contains: city } }),
      ...(state && { state: { contains: state } }),
      ...(locality && { locality: { contains: locality } }),
      ...(propertyType && { propertyType }),
      ...(saleType && { saleType }),
      ...(listingType && { listingType }),
      ...(furnishingStatus && { furnishingStatus }),
      ...(bedroom && { bedroom: { gte: parseInt(bedroom) } }),
      ...(bathroom && { bathroom: { gte: parseInt(bathroom) } }),
      ...(status && { status }),
      ...(isFeatured === "true" && { isFeatured: true }),
      ...(minArea && { area: { gte: parseInt(minArea) } }),
      ...(maxArea && { area: { lte: parseInt(maxArea) } }),
    };

    // Fix: if both minPrice and maxPrice, use combined range
    if (minPrice && maxPrice) {
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0 || min > max) {
        return res.status(400).json({ message: "Invalid price range." });
      }
      whereClause.price = { gte: min, lte: max };
    } else if (minPrice) {
      const min = Number(minPrice);
      if (Number.isNaN(min) || min < 0) return res.status(400).json({ message: "Invalid minimum price." });
      whereClause.price = { gte: min };
    } else if (maxPrice) {
      const max = Number(maxPrice);
      if (Number.isNaN(max) || max < 0) return res.status(400).json({ message: "Invalid maximum price." });
      whereClause.price = { lte: max };
    }

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 12));
    const skip = (safePage - 1) * safeLimit;

    // Determine sort order
    let orderBy = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };
    if (sort === "popular") orderBy = { views: "desc" };
    if (sort === "area_asc") orderBy = { area: "asc" };
    if (sort === "area_desc") orderBy = { area: "desc" };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: safeLimit,
        include: {
          agent: {
            select: {
              id: true,
              user: { select: { id: true, username: true, avatar: true, phone: true } },
            },
          },
        },
      }),
      prisma.property.count({ where: whereClause }),
    ]);

    res.status(200).json({
      properties,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get properties!" });
  }
};

// Get unique cities/states for filters (Public)
export const getFilterOptions = async (req, res) => {
  try {
    const cities = await prisma.property.findMany({
      where: { status: "AVAILABLE" },
      select: { city: true, state: true },
      distinct: ["city", "state"],
      orderBy: { city: "asc" },
    });

    const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "PLOT", "COMMERCIAL", "LAND", "FARMHOUSE", "PENTHOUSE", "STUDIO"];

    res.status(200).json({
      cities,
      propertyTypes,
      saleTypes: ["SALE", "RENT", "LEASE"],
      listingTypes: ["NEW", "RESALE"],
      furnishingStatuses: ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get filter options!" });
  }
};

// Get single property (Public)
export const getProperty = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            experience: true,
            specializations: true,
            rating: true,
            totalSales: true,
            user: { select: { id: true, username: true, avatar: true, phone: true, email: true } },
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found!" });
    }

    // Increment view count
    await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.status(200).json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get property!" });
  }
};

// Generate WhatsApp booking link (Authenticated)
export const generateWhatsAppLink = async (req, res) => {
  const tokenUserId = req.userId;
  const { propertyId } = req.body;

  try {
    const numericPropertyId = Number.parseInt(propertyId, 10);
    if (!Number.isInteger(numericPropertyId) || numericPropertyId < 1) {
      return res.status(400).json({ message: "Invalid property ID!" });
    }

    const property = await prisma.property.findUnique({ where: { id: numericPropertyId } });
    if (!property) return res.status(404).json({ message: "Property not found!" });

    const user = await prisma.user.findUnique({ where: { id: tokenUserId } });

    if (property.status === "SOLD") return res.status(400).json({ message: "This property is already sold!" });
    if (property.status === "RENTED") return res.status(400).json({ message: "This property is currently rented!" });

    let booking = await prisma.booking.findFirst({
      where: {
        userId: tokenUserId,
        propertyId: numericPropertyId,
        bookingStatus: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!booking) {
      booking = await prisma.booking.create({
        data: {
          userId: tokenUserId,
          propertyId: numericPropertyId,
          bookingStatus: "CONTACTED",
          remarks: "User contacted via WhatsApp",
        },
      });
    }

    // Create notifications
    const { createNotification } = await import("./notification.controller.js");
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await createNotification(admin.id, "New Property Inquiry", `${user.username} is interested in "${property.title}"`, "INQUIRY", "/admin/bookings");
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("newInquiry", { propertyId: property.id, propertyTitle: property.title, userId: user.id, username: user.username, timestamp: new Date().toISOString() });
    }

    const images = typeof property.images === "string" ? JSON.parse(property.images) : property.images;
    const message = `Hello! I'm interested in booking this property:\n\n*Property Details:*\n📍 *Title:* ${property.title}\n💰 *Price:* ₹${property.price}\n🏠 *Type:* ${property.propertyType} (${property.saleType})\n📐 *Area:* ${property.area} sq ft\n📌 *Location:* ${property.address}, ${property.city}, ${property.state}\n\n*My Details:*\n👤 *Name:* ${user.username}\n📧 *Email:* ${user.email}\n📱 *Phone:* ${user.phone || "Not provided"}`;
    const whatsappNumber = process.env.WHATSAPP_BUSINESS_NUMBER || "919876543210";
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    res.status(200).json({
      success: true,
      whatsappLink,
      message: "WhatsApp link generated successfully!",
      bookingId: booking.id,
      booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate WhatsApp link!" });
  }
};

// Get user's bookings (Authenticated)
export const getMyBookings = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: tokenUserId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get bookings!" });
  }
};
