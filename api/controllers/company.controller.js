import prisma from "../lib/prisma.js";
import fs from "fs";
import path from "path";

// Check if user is admin
const checkAdmin = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissions: true, canAccessAdminPanel: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "STAFF") return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return (
    !!user.canAccessAdminPanel ||
    permissions.includes("ADMIN_PANEL") ||
    permissions.includes("MANAGE_CMS") ||
    permissions.includes("*")
  );
};

// Get company settings (Public)
export const getCompanySettings = async (req, res) => {
  try {
    const settings = await prisma.companySettings.findFirst();

    if (!settings) {
      return res.status(404).json({
        message: "Company settings not found.",
      });
    }

    res.status(200).json(settings);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get company settings!" });
  }
};

// Update company settings (Admin)
const EDITABLE_SETTINGS_FIELDS = [
  "companyName", "companyLogo", "email", "phone", "address", "city", "state",
  "pincode", "country", "website", "description", "whatsappNumber", "mission",
  "vision", "tagline", "foundedYear", "gstNumber", "panNumber", "cinNumber",
  "facebook", "twitter", "instagram", "linkedin", "youtube", "termsContent",
  "privacyContent", "aboutImage", "statsProperties", "statsCustomers",
  "statsCities", "statsYears", "statsProjects", "googleMapsEmbed", "metaTitle",
  "metaDescription", "metaKeywords",
];

export const updateCompanySettings = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdmin(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    const existingSettings = await prisma.companySettings.findFirst();

    // Only accept known CompanySettings columns
    const updateData = {};
    for (const field of EDITABLE_SETTINGS_FIELDS) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    let companySettings;

    if (existingSettings) {
      companySettings = await prisma.companySettings.update({
        where: { id: existingSettings.id },
        data: updateData,
      });
    } else {
      companySettings = await prisma.companySettings.create({
        data: {
          companyName: updateData.companyName || "My Real Estate Company",
          ...updateData,
        },
      });
    }

    res.status(200).json(companySettings);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update company settings!" });
  }
};

// Upload company logo (Admin)
export const uploadCompanyLogo = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdmin(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    const existingSettings = await prisma.companySettings.findFirst();

    // Delete old logo if exists
    if (existingSettings?.companyLogo) {
      const oldLogoPath = path.join(process.cwd(), existingSettings.companyLogo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    let companySettings;

    if (existingSettings) {
      companySettings = await prisma.companySettings.update({
        where: { id: existingSettings.id },
        data: { companyLogo: logoUrl },
      });
    } else {
      companySettings = await prisma.companySettings.create({
        data: {
          companyName: "My Real Estate Company",
          companyLogo: logoUrl,
        },
      });
    }

    res.status(200).json({
      message: "Logo uploaded successfully!",
      logoUrl: logoUrl,
      companySettings,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to upload logo!" });
  }
};

// Upload property images (Admin)
export const uploadPropertyImages = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    if (!(await checkAdmin(tokenUserId))) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded!" });
    }

    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);

    res.status(200).json({
      message: "Images uploaded successfully!",
      images: imageUrls,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to upload images!" });
  }
};
