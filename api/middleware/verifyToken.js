import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const ADMIN_PANEL_PERMISSION = "ADMIN_PANEL";

const extractToken = (req) =>
  req.cookies?.token || req.headers.authorization?.split(" ")[1] || null;

const attachPayload = (req, payload) => {
  req.userId = payload.id;
  req.userRole = payload.role;
  req.isAdmin = payload.role === "ADMIN" || !!payload.isAdmin;
  req.permissions = payload.permissions || [];
  req.canAccessAdminPanel = !!payload.canAccessAdminPanel;
};

const hasAdminPanelFromClaims = (payload) =>
  payload.role === "ADMIN" ||
  (payload.role === "STAFF" &&
    (!!payload.canAccessAdminPanel ||
      (payload.permissions || []).includes(ADMIN_PANEL_PERMISSION)));

/** Load live user flags from DB (role / active / panel). Used by /auth/me and strict gates. */
export const loadActiveUser = async (userId) => {
  const id = Number.parseInt(userId, 10);
  if (!Number.isInteger(id)) return null;

  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      permissions: true,
      canAccessAdminPanel: true,
      passwordLoginEnabled: true,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: true,
    },
  });
};

export const verifyToken = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Not Authenticated!" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Your session has expired. Please sign in again." });
      }
      return res.status(401).json({ message: "Invalid token! Please sign in again." });
    }

    attachPayload(req, payload);
    next();
  });
};

/**
 * Like verifyToken, but also confirms the user still exists and is active in the DB.
 * Role / panel flags are refreshed from the database (not trusted from the JWT alone).
 */
export const verifyTokenStrict = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Not Authenticated!" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid token! Please sign in again." });
  }

  try {
    const user = await loadActiveUser(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account is inactive or no longer available." });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.isAdmin = user.role === "ADMIN";
    req.permissions = Array.isArray(user.permissions) ? user.permissions : [];
    req.canAccessAdminPanel =
      user.role === "ADMIN" ||
      !!user.canAccessAdminPanel ||
      req.permissions.includes(ADMIN_PANEL_PERMISSION);
    req.authUser = user;
    next();
  } catch (error) {
    console.error("verifyTokenStrict error:", error);
    return res.status(500).json({ message: "Authentication check failed." });
  }
};

/** Require one of the given roles (uses JWT claims after verifyToken). */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Not Authenticated!" });
  }
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({ message: "You don't have permission to access this resource." });
  }
  next();
};

export const requireAgent = requireRole("AGENT");

export const requireAdmin = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Not Authenticated!" });
  }
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required!" });
  }
  next();
};

// Admin panel access: ADMIN or STAFF with panel permission
export const verifyAdmin = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Not Authenticated!" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Your session has expired. Please sign in again." });
      }
      return res.status(401).json({ message: "Invalid token! Please sign in again." });
    }

    if (!hasAdminPanelFromClaims(payload)) {
      return res.status(403).json({ message: "Admin access required!" });
    }

    attachPayload(req, payload);
    req.isAdmin = payload.role === "ADMIN";
    next();
  });
};

/**
 * After verifyToken/verifyAdmin: require a permission string.
 * ADMIN always passes. STAFF needs the permission (or "*") in JWT claims.
 */
export const requirePermission = (...required) => (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Not Authenticated!" });
  }
  if (req.userRole === "ADMIN" || req.isAdmin) {
    return next();
  }
  const permissions = Array.isArray(req.permissions) ? req.permissions : [];
  if (permissions.includes("*") || required.some((p) => permissions.includes(p))) {
    return next();
  }
  return res.status(403).json({
    message: "You don't have permission to manage website content.",
  });
};

/** CMS write/manage gate — ADMIN or STAFF with MANAGE_CMS (or *). */
export const requireManageCms = requirePermission("MANAGE_CMS");

/** Alias matching common naming in docs / newer code. */
export const requireAuth = verifyToken;
export const authenticate = verifyToken;
