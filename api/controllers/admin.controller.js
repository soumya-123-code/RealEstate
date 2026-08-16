import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

const PASSWORDLESS_AUTH = "PASSWORDLESS_AUTH";

const PROPERTY_ENUMS = {
  propertyType: ["APARTMENT", "HOUSE", "VILLA", "PLOT", "COMMERCIAL", "LAND", "FARMHOUSE", "PENTHOUSE", "STUDIO"],
  saleType: ["SALE", "RENT", "LEASE"],
  listingType: ["NEW", "RESALE"],
  furnishingStatus: ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"],
  status: ["AVAILABLE", "TOKEN_BOOKED", "SOLD", "RENTED", "UNAVAILABLE", "UNDER_CONSTRUCTION"],
};

const PROPERTY_FIELDS = new Set([
  "title", "slug", "description", "price", "tokenAmount", "images", "address", "locality",
  "city", "state", "pincode", "latitude", "longitude", "propertyType", "saleType",
  "listingType", "furnishingStatus", "status", "bedroom", "bathroom", "area", "facing",
  "floorNumber", "totalFloors", "ageOfProperty", "possessionBy", "reraId", "amenities",
  "features", "isFeatured", "isVerified", "agentId", "metaTitle", "metaDescription",
]);

const normalizePropertyData = (body, partial = false) => {
  const source = body && typeof body === "object" ? body : {};
  const data = {};

  for (const [key, value] of Object.entries(source)) {
    if (PROPERTY_FIELDS.has(key)) data[key] = value;
  }

  const required = ["title", "description", "price", "tokenAmount", "images", "address", "city", "state", "area", "propertyType", "saleType"];
  if (!partial) {
    for (const key of required) {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        throw new Error(`${key} is required.`);
      }
    }
  }

  for (const key of Object.keys(PROPERTY_ENUMS)) {
    if (data[key] !== undefined && !PROPERTY_ENUMS[key].includes(data[key])) {
      throw new Error(`Invalid ${key}.`);
    }
  }

  for (const key of ["price", "tokenAmount"]) {
    if (data[key] !== undefined && (Number.isNaN(Number(data[key])) || Number(data[key]) < 0)) {
      throw new Error(`Invalid ${key}.`);
    }
    if (data[key] !== undefined) data[key] = Number(data[key]);
  }

  for (const key of ["bedroom", "bathroom", "area", "floorNumber", "totalFloors", "agentId"]) {
    if (data[key] !== undefined && data[key] !== null) {
      const value = Number.parseInt(data[key], 10);
      if (!Number.isInteger(value) || value < 0) throw new Error(`Invalid ${key}.`);
      data[key] = value;
    }
  }

  for (const key of ["isFeatured", "isVerified"]) {
    if (data[key] !== undefined) data[key] = Boolean(data[key]);
  }

  for (const key of ["images", "amenities", "features"]) {
    if (typeof data[key] === "string") {
      try {
        data[key] = JSON.parse(data[key]);
      } catch {
        throw new Error(`Invalid ${key} JSON.`);
      }
    }
  }

  if (data.images !== undefined && !Array.isArray(data.images)) {
    throw new Error("Images must be an array.");
  }

  if (!partial && data.images.length === 0) {
    throw new Error("At least one property image is required.");
  }

  return data;
};


const sanitizeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// Check if user is admin
const checkAdmin = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user && user.role === "ADMIN";
};

const checkAdminPanelAccess = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "STAFF") return false;

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return user.canAccessAdminPanel || permissions.includes("ADMIN_PANEL");
};

// Get all properties (Admin)
export const getAllProperties = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    const properties = await prisma.property.findMany({
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(properties);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get properties!" });
  }
};

// Add new property (Admin)
export const addProperty = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    const data = normalizePropertyData(req.body);
    const newProperty = await prisma.property.create({ data });

    res.status(201).json(newProperty);
  } catch (err) {
    console.error(err);
    const status = err.message?.startsWith("Invalid ") || err.message?.includes(" is required") || err.message?.includes("must be") ? 400 : 500;
    res.status(status).json({ message: status === 400 ? err.message : "Failed to create property!" });
  }
};

// Update property (Admin)
export const updateProperty = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    const data = normalizePropertyData(req.body, true);
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: "No valid property fields supplied." });
    }
    const updatedProperty = await prisma.property.update({
      where: { id },
      data,
    });

    res.status(200).json(updatedProperty);
  } catch (err) {
    console.error(err);
    const status = err.message?.startsWith("Invalid ") || err.message?.includes(" is required") || err.message?.includes("must be") ? 400 : 500;
    res.status(status).json({ message: status === 400 ? err.message : "Failed to update property!" });
  }
};

// Update property status (Admin)
export const updatePropertyStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const tokenUserId = req.userId;
  const validStatuses = ["AVAILABLE", "TOKEN_BOOKED", "SOLD", "RENTED", "UNAVAILABLE", "UNDER_CONSTRUCTION"];

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid property status." });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { status },
    });

    res.status(200).json(updatedProperty);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update property status!" });
  }
};

// Delete property (Admin)
export const deleteProperty = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    await prisma.property.delete({
      where: { id },
    });

    res.status(200).json({ message: "Property deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete property!" });
  }
};

// Get all bookings (Admin)
export const getAllBookings = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            price: true,
            tokenAmount: true,
            images: true,
            propertyType: true,
            saleType: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(bookings);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get bookings!" });
  }
};

// Update booking status (Admin)
export const updateBookingStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { bookingStatus, tokenAmount, adminNotes } = req.body;
  const tokenUserId = req.userId;
  const validBookingStatuses = ["CONTACTED", "TOKEN_PAID", "BOOKING_CONFIRMED", "CANCELLED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"];

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }
    if (!validBookingStatuses.includes(bookingStatus)) {
      return res.status(400).json({ message: "Invalid booking status." });
    }
    if (tokenAmount !== undefined && (Number.isNaN(Number(tokenAmount)) || Number(tokenAmount) < 0)) {
      return res.status(400).json({ message: "Invalid token amount." });
    }

    const updateData = {
      bookingStatus,
      ...(adminNotes && { adminNotes }),
    };

    // If marking as TOKEN_PAID, set token amount and date
    if (bookingStatus === "TOKEN_PAID" && tokenAmount) {
      updateData.tokenAmount = tokenAmount;
      updateData.tokenPaidDate = new Date();
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        user: {
          select: {
            username: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // If token is paid, update property status to TOKEN_BOOKED
    if (bookingStatus === "TOKEN_PAID") {
      await prisma.property.update({
        where: { id: updatedBooking.propertyId },
        data: { status: "TOKEN_BOOKED" },
      });
    }

    // Create notification for the user about booking status change
    const { createNotification } = await import("./notification.controller.js");
    await createNotification(
      updatedBooking.userId,
      "Booking Update",
      `Your booking status has been updated to ${bookingStatus.replace(/_/g, " ")}`,
      "BOOKING"
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("tokenBookingStatusUpdate", {
        bookingId: updatedBooking.id,
        userId: updatedBooking.userId,
        status: updatedBooking.bookingStatus,
      });
    }

    res.status(200).json(updatedBooking);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update booking status!" });
  }
};

// Get dashboard stats (Admin)
export const getDashboardStats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdminPanelAccess(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    const [
      totalProperties,
      availableProperties,
      tokenBookedProperties,
      soldProperties,
      totalBookings,
      contactedBookings,
      tokenPaidBookings,
      totalUsers,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: "AVAILABLE" } }),
      prisma.property.count({ where: { status: "TOKEN_BOOKED" } }),
      prisma.property.count({ where: { status: "SOLD" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { bookingStatus: "CONTACTED" } }),
      prisma.booking.count({ where: { bookingStatus: "TOKEN_PAID" } }),
      prisma.user.count({ where: { role: "USER" } }),
    ]);

    res.status(200).json({
      totalProperties,
      availableProperties,
      tokenBookedProperties,
      soldProperties,
      totalBookings,
      contactedBookings,
      tokenPaidBookings,
      totalUsers,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get dashboard stats!" });
  }
};

export const getStaff = async (req, res) => {
  try {
    if (!(await checkAdmin(req.userId))) {
      return res.status(403).json({ message: "Admin access required!" });
    }

    const staff = await prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(staff.map(sanitizeUser));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get staff accounts!" });
  }
};

export const createStaff = async (req, res) => {
  const {
    username,
    email,
    phone,
    password,
    canAccessAdminPanel = false,
    passwordLoginEnabled = false,
    permissions = [],
    isActive = true,
  } = req.body;

  try {
    if (!(await checkAdmin(req.userId))) {
      return res.status(403).json({ message: "Admin access required!" });
    }

    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required!" });
    }

    if (passwordLoginEnabled && !password) {
      return res.status(400).json({ message: "Password is required when password login is enabled." });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "A user with this username, email, or phone already exists." });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : PASSWORDLESS_AUTH;
    const staff = await prisma.user.create({
      data: {
        username,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: "STAFF",
        isEmailVerified: true,
        isPhoneVerified: !!phone,
        isActive,
        canAccessAdminPanel: !!canAccessAdminPanel,
        passwordLoginEnabled: !!passwordLoginEnabled,
        permissions,
      },
    });

    res.status(201).json(sanitizeUser(staff));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create staff account!" });
  }
};

export const updateStaff = async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    username,
    email,
    phone,
    password,
    canAccessAdminPanel,
    passwordLoginEnabled,
    permissions,
    isActive,
  } = req.body;

  try {
    if (!(await checkAdmin(req.userId))) {
      return res.status(403).json({ message: "Admin access required!" });
    }

    const existingStaff = await prisma.user.findFirst({ where: { id, role: "STAFF" } });
    if (!existingStaff) {
      return res.status(404).json({ message: "Staff account not found!" });
    }

    const updatedPassword = password ? await bcrypt.hash(password, 10) : null;
    const staff = await prisma.user.update({
      where: { id },
      data: {
        ...(username !== undefined && { username }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(updatedPassword && { password: updatedPassword }),
        ...(canAccessAdminPanel !== undefined && { canAccessAdminPanel: !!canAccessAdminPanel }),
        ...(passwordLoginEnabled !== undefined && { passwordLoginEnabled: !!passwordLoginEnabled }),
        ...(permissions !== undefined && { permissions }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });

    res.status(200).json(sanitizeUser(staff));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update staff account!" });
  }
};

export const deactivateStaff = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    if (!(await checkAdmin(req.userId))) {
      return res.status(403).json({ message: "Admin access required!" });
    }

    const existing = await prisma.user.findFirst({ where: { id, role: "STAFF" } });
    if (!existing) {
      return res.status(404).json({ message: "Staff account not found!" });
    }

    const staff = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json(sanitizeUser(staff));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to deactivate staff account!" });
  }
};

export const activateStaff = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    if (!(await checkAdmin(req.userId))) {
      return res.status(403).json({ message: "Admin access required!" });
    }

    const existing = await prisma.user.findFirst({ where: { id, role: "STAFF" } });
    if (!existing) {
      return res.status(404).json({ message: "Staff account not found!" });
    }

    const staff = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    res.status(200).json(sanitizeUser(staff));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to activate staff account!" });
  }
};

export const deleteStaff = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    if (!(await checkAdmin(req.userId))) {
      return res.status(403).json({ message: "Admin access required!" });
    }

    const existing = await prisma.user.findFirst({ where: { id, role: "STAFF" } });
    if (!existing) {
      return res.status(404).json({ message: "Staff account not found!" });
    }

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "Staff account deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete staff account!" });
  }
};
