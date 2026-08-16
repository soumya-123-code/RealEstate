import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

// Authenticated endpoint to get admin contact card for chat (no email/phone leakage)
export const getAdminUser = async (req, res) => {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
      select: {
        id: true,
        username: true,
        avatar: true,
        role: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    res.status(200).json(admin);
  } catch (err) {
    console.error("[ERROR] getAdminUser failed:", err);
    res.status(500).json({ message: "Failed to get admin user" });
  }
};

export const getUsers = async (req, res) => {
  try {
    console.log("[DEBUG] getUsers called");
    const { role, exclude } = req.query;
    const where = {};
    if (role && role !== 'all') {
      where.role = role;
    }
    if (exclude) {
      where.id = { not: parseInt(exclude) };
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
        permissions: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        isActive: true,
        createdAt: true,
      },
    });
    console.log("[DEBUG] Found users:", users.length);
    res.status(200).json(users);
  } catch (err) {
    console.error("[ERROR] getUsers failed:", err);
    res.status(500).json({ message: "Failed to get users! " + err.message });
  }
};

export const getUser = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const tokenUserId = Number.parseInt(req.userId, 10);
  const canReadOthers = req.userRole === "ADMIN" || (
    req.userRole === "STAFF" && req.canAccessAdminPanel
  );

  if (!Number.isInteger(id) || (id !== tokenUserId && !canReadOthers)) {
    return res.status(403).json({ message: "Not authorized!" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
        permissions: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};

export const updateUser = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const tokenUserId = Number.parseInt(req.userId, 10);

  if (!Number.isInteger(id) || id !== tokenUserId) {
    return res.status(403).json({ message: "Not authorized!" });
  }

  const { username, email, phone, password, avatar } = req.body || {};
  const data = {};

  if (username !== undefined) {
    const value = String(username).trim();
    if (value.length < 3 || value.length > 30 || !/^[A-Za-z0-9]+$/.test(value)) {
      return res.status(400).json({ message: "Username must be 3-30 characters and contain only letters and numbers." });
    }
    data.username = value;
  }

  if (email !== undefined) {
    const value = String(email).trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    data.email = value;
  }

  if (phone !== undefined) {
    const value = String(phone).replace(/\\s+/g, "");
    if (value && !/^(?:[6-9]\\d{9}|\\+91[6-9]\\d{9})$/.test(value)) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }
    data.phone = value || null;
  }

  if (avatar !== undefined) {
    data.avatar = avatar || null;
  }

  if (password !== undefined && password !== "") {
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    data.password = await bcrypt.hash(String(password), 10);
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "No valid fields supplied." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    const { password: _password, ...rest } = updatedUser;
    res.status(200).json(rest);
  } catch (err) {
    console.error(err);
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Email, phone, or username is already in use." });
    }
    res.status(500).json({ message: "Failed to update user!" });
  }
};

export const uploadAvatar = async (req, res) => {
  const userId = Number.parseInt(req.userId, 10);

  if (!req.file) {
    return res.status(400).json({ message: "No avatar file uploaded." });
  }

  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    const { password: _password, ...rest } = updatedUser;
    res.status(200).json({ avatarUrl, user: rest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload avatar!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};
