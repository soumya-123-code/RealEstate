import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import {
  generateOtp,
  storeOtp,
  verifyOtp,
  sendOtpViaEmail,
  sendOtpViaPhone,
  checkOtpRateLimit,
  checkResendCooldown,
} from "../services/otp.service.js";

const PASSWORDLESS_AUTH = "PASSWORDLESS_AUTH";
const ADMIN_PANEL_PERMISSION = "ADMIN_PANEL";

const normalizeIdentifier = ({ email, phone }) => {
  const cleanPhone = phone?.replace(/\s+/g, "");

  return {
    email: email?.trim().toLowerCase() || null,
    phone: cleanPhone
      ? cleanPhone.startsWith("+91")
        ? cleanPhone
        : `+91${cleanPhone.replace(/\D/g, "")}`
      : null,
  };
};

const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s+/g, "");
  return /^[6-9]\d{9}$/.test(cleanPhone) || /^\+91[6-9]\d{9}$/.test(cleanPhone);
};

const getUserPermissions = (user) => {
  if (user.role === "ADMIN") {
    return {
      canAccessAdminPanel: true,
      permissions: ["*"],
      passwordLoginEnabled: true,
    };
  }

  return {
    canAccessAdminPanel: !!user.canAccessAdminPanel,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    passwordLoginEnabled: !!user.passwordLoginEnabled,
  };
};

const getRoleRedirect = (user) => {
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "STAFF") {
    return hasAdminPanelAccess(user) ? "/admin" : "/";
  }
  if (user.role === "AGENT") return "/agent";
  // USER (customer) home
  return "/";
};

const maybeDevOtp = (otp) =>
  process.env.NODE_ENV !== "production" ? otp : undefined;

const sanitizeUser = (user) => {
  const { password, ...userInfo } = user;
  return {
    ...userInfo,
    ...getUserPermissions(user),
    redirectTo: getRoleRedirect(user),
  };
};

const hasAdminPanelAccess = (user) => {
  if (!user || !user.isActive) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "STAFF") return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return !!user.canAccessAdminPanel || permissions.includes(ADMIN_PANEL_PERMISSION);
};

const findUserByIdentifier = async ({ email, phone }) => {
  if (email) return prisma.user.findUnique({ where: { email } });
  if (phone) return prisma.user.findFirst({ where: { phone } });
  return null;
};

const completeLogin = (res, user, message = "Login successful!") => {
  const { token, age } = generateToken(user);
  setAuthCookie(res, token, age);

  return res.status(200).json({
    message,
    user: sanitizeUser(user),
    token,
    redirectTo: getRoleRedirect(user),
  });
};

// JWT token generation
const generateToken = (user) => {
  const age = 1000 * 60 * 60 * 24 * 7; // cookie lifetime: 7 days
  const permissions = getUserPermissions(user);
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "ADMIN",
      permissions: permissions.permissions,
      canAccessAdminPanel: permissions.canAccessAdminPanel,
      redirectTo: getRoleRedirect(user),
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );
  return { token, age };
};

// Set cookie and return response
const setAuthCookie = (res, token, age) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: age,
  });
};

// ========== REGISTRATION WITH EMAIL VERIFICATION ==========
export const register = async (req, res) => {
  const { username, email } = req.body;
  const { phone } = normalizeIdentifier(req.body);

  try {
    // Validation
    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required!" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format!" });
    }

    // Username validation
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: "Username must be 3-30 characters!" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists!" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered!" });
      }
    }

    // Check rate limiting
    const rateCheck = await checkOtpRateLimit(email, null);
    if (!rateCheck.allowed) {
      return res.status(429).json({ message: rateCheck.message });
    }

    // Generate and store OTP
    const otp = generateOtp();
    await storeOtp(email, null, otp, "EMAIL_VERIFICATION");

    // Send OTP via email
    const emailResult = await sendOtpViaEmail(email, otp, "EMAIL_VERIFICATION");

    // Create user (unverified) - no password needed
    let newUser;
    const existingUnverified = await prisma.user.findFirst({
      where: { email, isEmailVerified: false },
    });

    if (existingUnverified) {
      newUser = await prisma.user.update({
        where: { id: existingUnverified.id },
        data: { username, phone: phone || null },
      });
    } else {
      newUser = await prisma.user.create({
        data: {
          username,
          email,
          phone: phone || null,
          password: PASSWORDLESS_AUTH, // Placeholder - not used for login
        },
      });
    }

    console.log("Registration initiated:", newUser.username);

    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      userId: newUser.id,
      email,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined, // Always return for development; remove in production
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Failed to initiate registration!" });
  }
};

// ========== VERIFY EMAIL OTP (Registration) ==========
export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required!" });
    }

    // Verify OTP
    const result = await verifyOtp(email, null, otp, "EMAIL_VERIFICATION");

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Mark email as verified
    const user = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });

    // Generate JWT token
    const { token, age } = generateToken(user);
    setAuthCookie(res, token, age);

    console.log("Email verified, user logged in:", user.username);

    res.status(200).json({
      message: "Email verified successfully! You are now logged in.",
      user: sanitizeUser(user),
      token,
      redirectTo: getRoleRedirect(user),
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Failed to verify email!" });
  }
};

// ========== LOGIN WITH EMAIL OTP ==========
export const loginWithEmail = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }

    // Check if user exists and is verified
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "No account found with this email!" });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        message: "Email not verified. Please register first.",
        needsVerification: true,
        email,
      });
    }

    // Check rate limiting
    const rateCheck = await checkOtpRateLimit(email, null);
    if (!rateCheck.allowed) {
      return res.status(429).json({ message: rateCheck.message });
    }

    // Check cooldown
    const cooldownCheck = await checkResendCooldown(email, null, "EMAIL_LOGIN");
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        message: cooldownCheck.message,
        remainingSeconds: cooldownCheck.remainingSeconds,
      });
    }

    // Generate and send OTP
    const otp = generateOtp();
    await storeOtp(email, null, otp, "EMAIL_LOGIN");
    await sendOtpViaEmail(email, otp, "EMAIL_LOGIN");

    res.status(200).json({
      message: "OTP sent to your email!",
      email,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined, // Always return for development; remove in production
    });
  } catch (err) {
    console.error("Email login error:", err);
    res.status(500).json({ message: "Failed to send login OTP!" });
  }
};

// ========== LOGIN WITH MOBILE OTP ==========
export const loginWithPhone = async (req, res) => {
  const { phone } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required!" });
    }

    // Validate phone format (Indian)
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone) && !/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: "Invalid phone number format!" });
    }

    const formattedPhone = cleanPhone.startsWith("+91")
      ? cleanPhone
      : `+91${cleanPhone}`;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { phone: formattedPhone },
    });

    if (!user) {
      return res.status(400).json({
        message: "No account found with this phone number!",
      });
    }

    // Check rate limiting
    const rateCheck = await checkOtpRateLimit(null, formattedPhone);
    if (!rateCheck.allowed) {
      return res.status(429).json({ message: rateCheck.message });
    }

    // Check cooldown
    const cooldownCheck = await checkResendCooldown(null, formattedPhone, "PHONE_LOGIN");
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        message: cooldownCheck.message,
        remainingSeconds: cooldownCheck.remainingSeconds,
      });
    }

    // Generate and send OTP
    const otp = generateOtp();
    await storeOtp(null, formattedPhone, otp, "PHONE_LOGIN");
    const smsResult = await sendOtpViaPhone(formattedPhone, otp, "PHONE_LOGIN");

    // In dummy SMS mode, always return OTP in response for testing
    // When real SMS provider is integrated, remove devOtp from response
    res.status(200).json({
      message: "OTP sent to your phone!",
      phone: formattedPhone,
      devOtp: process.env.NODE_ENV !== "production" ? (smsResult.devOtp || otp) : undefined, // Always return OTP for now (dummy mode)
    });
  } catch (err) {
    console.error("Phone login error:", err);
    res.status(500).json({ message: "Failed to send login OTP!" });
  }
};

// ========== VERIFY LOGIN OTP ==========
export const verifyLoginOtp = async (req, res) => {
  let { email, phone, otp, type } = req.body;

  // Normalize empty strings/whitespace to null so backend doesn't mis-detect missing identifier.
  email = email?.trim().toLowerCase() || null;
  phone = phone ? phone.replace(/\s+/g, "") : null;

  try {
    if (!otp) {
      return res.status(400).json({ message: "OTP is required!" });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required!" });
    }

    const otpType = type || (email ? "EMAIL_LOGIN" : "PHONE_LOGIN");

    // Verify OTP
    const result = await verifyOtp(email, phone, otp, otpType);


    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Find user
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phone) {
      user = await prisma.user.findFirst({ where: { phone } });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Generate JWT token
    const { token, age } = generateToken(user);
    setAuthCookie(res, token, age);

    console.log("User logged in via OTP:", user.username);
    return completeLogin(res, user);
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Failed to verify OTP!" });
  }
};

// ========== UNIFIED LOGIN (Users, Admins, Staff) ==========
export const unifiedLogin = async (req, res) => {
  const { password, loginType, identifier } = req.body;
  // Support admin-staff-chat payload: { identifier, otp? }
  // where identifier can be email or phone.
  let { email, phone } = normalizeIdentifier(req.body);

  if ((!email && !phone) && typeof identifier === "string") {
    const trimmed = identifier.trim();
    if (trimmed.includes("@")) {
      email = trimmed.toLowerCase();
      phone = null;
    } else {
      const cleanPhone = trimmed.replace(/\s+/g, "");
      phone = cleanPhone
        ? cleanPhone.startsWith("+91")
          ? cleanPhone
          : `+91${cleanPhone.replace(/\D/g, "")}`
        : null;
      email = null;
    }
  }


  try {
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required!" });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ message: "Invalid phone number format!" });
    }

    const user = await findUserByIdentifier({ email, phone });
    if (!user || !user.isActive) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    if (password) {
      if (user.role === "USER") {
        return res.status(403).json({ message: "Password login is not allowed for users. Please use OTP login." });
      }

      if (user.role === "STAFF" && !user.passwordLoginEnabled) {
        return res.status(403).json({ message: "Password login is not enabled for this staff account." });
      }

      if (!user.password || user.password === PASSWORDLESS_AUTH) {
        return res.status(400).json({ message: "Password login is not configured for this account." });
      }

      const bcrypt = await import("bcrypt");
      const isPasswordValid = await bcrypt.default.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials!" });
      }

      return completeLogin(res, user);
    }

    if (loginType && loginType !== "otp") {
      return res.status(400).json({ message: "Unsupported login method!" });
    }

    // Return password policy for OTP-first UX.
    // IMPORTANT: frontend must not decide roles/permissions; it can only show password input
    // when backend allows it.
    const userPermissions = getUserPermissions(user);
    const passwordLoginEnabled = !!userPermissions.passwordLoginEnabled;

    const rateCheck = await checkOtpRateLimit(email, phone);

    if (!rateCheck.allowed) {
      return res.status(429).json({ message: rateCheck.message });
    }

    const otpType = email ? "EMAIL_LOGIN" : "PHONE_LOGIN";
    const cooldownCheck = await checkResendCooldown(email, phone, otpType);
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        message: cooldownCheck.message,
        remainingSeconds: cooldownCheck.remainingSeconds,
      });
    }

    const otp = generateOtp();
    await storeOtp(email, phone, otp, otpType);

    if (email) {
      await sendOtpViaEmail(email, otp, otpType);
      return res.status(200).json({
        message: "OTP sent to your email!",
        email,
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
        passwordLoginEnabled,
        userRole: user.role,
        canAccessAdminPanel: user.canAccessAdminPanel,
      });
    }


    const smsResult = await sendOtpViaPhone(phone, otp, otpType);
    return res.status(200).json({
      message: "OTP sent to your phone!",
      phone,
      devOtp: process.env.NODE_ENV !== "production" ? (smsResult.devOtp || otp) : undefined,
      passwordLoginEnabled,
      userRole: user.role,
      canAccessAdminPanel: user.canAccessAdminPanel,
    });

  } catch (err) {
    console.error("Unified login error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const verifyUnifiedOtp = async (req, res) => {
  const { otp } = req.body;
  let { email, phone } = normalizeIdentifier(req.body);

  try {
    if (!otp) {
      return res.status(400).json({ message: "OTP is required!" });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required!" });
    }

    const otpType = email ? "EMAIL_LOGIN" : "PHONE_LOGIN";
    const result = await verifyOtp(email, phone, otp, otpType);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    const user = await findUserByIdentifier({ email, phone });

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found!" });
    }

    return completeLogin(res, user);
  } catch (err) {
    console.error("Unified OTP verify error:", err);
    res.status(500).json({ message: "Failed to verify OTP!" });
  }
};


// ========== RESEND OTP ==========
export const resendOtp = async (req, res) => {
  let { email, phone } = normalizeIdentifier(req.body);
  const { type } = req.body;

  try {
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required!" });
    }

    // Check rate limiting
    const rateCheck = await checkOtpRateLimit(email, phone);
    if (!rateCheck.allowed) {
      return res.status(429).json({ message: rateCheck.message });
    }

    // Check cooldown
    const cooldownCheck = await checkResendCooldown(email, phone, type);
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        message: cooldownCheck.message,
        remainingSeconds: cooldownCheck.remainingSeconds,
      });
    }

    // Generate and send new OTP
    const otp = generateOtp();
    await storeOtp(email, phone, otp, type);

    if (email) {
      await sendOtpViaEmail(email, otp, type);
    }
    if (phone) {
      await sendOtpViaPhone(phone, otp, type);
    }

    res.status(200).json({
      message: "New OTP sent successfully!",
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined, // Always return for development; remove in production
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Failed to resend OTP!" });
  }
};

// ========== ADMIN LOGIN (Email/Password or Phone OTP) ==========
export const adminLogin = async (req, res) => {
  let { email, phone, password, otp, loginType } = req.body;
  ({ email, phone } = normalizeIdentifier({ email, phone }));

  try {
    // Password login
    if (password) {
      if (!email && !phone) {
        return res.status(400).json({ message: "Email or phone is required!" });
      }

      // Find user by email or phone
      let user;
      if (email) {
        user = await prisma.user.findUnique({ where: { email } });
      } else {
        user = await prisma.user.findFirst({ where: { phone } });
      }

      if (!user || !user.isActive || user.password === "PASSWORDLESS_AUTH") {
        return res.status(400).json({ message: "Invalid credentials!" });
      }

      // Allow password login only for admin and staff with admin panel access
      if (!hasAdminPanelAccess(user)) {
        return res.status(403).json({ message: "Admin access required!" });
      }

      const bcrypt = await import("bcrypt");
      const isPasswordValid = await bcrypt.default.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials!" });
      }

      return completeLogin(res, user);
    }

    // OTP login - initiate
    if (loginType === "otp" && (email || phone)) {
      if (email) {
        // Check if user exists and is admin
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive || !hasAdminPanelAccess(user)) {
          return res.status(400).json({ message: "Invalid admin credentials!" });
        }

        // Check rate limiting
        const rateCheck = await checkOtpRateLimit(email, null);
        if (!rateCheck.allowed) {
          return res.status(429).json({ message: rateCheck.message });
        }

        // Generate and send OTP
        const otp = generateOtp();
        await storeOtp(email, null, otp, "ADMIN_LOGIN");
        await sendOtpViaEmail(email, otp, "ADMIN_LOGIN");

        return res.status(200).json({ message: "OTP sent to your email!", devOtp: maybeDevOtp(otp) });
      } else if (phone) {
        // Check phone format
        const cleanPhone = phone.replace(/\s+/g, "");
        if (!/^[6-9]\d{9}$/.test(cleanPhone) && !/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
          return res.status(400).json({ message: "Invalid phone number format!" });
        }

        const formattedPhone = cleanPhone.startsWith("+91") ? cleanPhone : `+91${cleanPhone}`;

        // Check if user exists and is admin
        const user = await prisma.user.findFirst({ where: { phone: formattedPhone } });
        if (!user || !user.isActive || !hasAdminPanelAccess(user)) {
          return res.status(400).json({ message: "Invalid admin credentials!" });
        }

        // Check rate limiting
        const rateCheck = await checkOtpRateLimit(null, formattedPhone);
        if (!rateCheck.allowed) {
          return res.status(429).json({ message: rateCheck.message });
        }

        // Generate and send OTP
        const otp = generateOtp();
        await storeOtp(null, formattedPhone, otp, "ADMIN_LOGIN");
        await sendOtpViaPhone(formattedPhone, otp, "ADMIN_LOGIN");

        return res.status(200).json({ message: "OTP sent to your phone!", devOtp: maybeDevOtp(otp) });
      }
    }

    return res.status(400).json({ message: "Invalid login request!" });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

// ========== ADMIN OTP VERIFY ==========
export const verifyAdminOtp = async (req, res) => {
  let { email, phone, otp } = req.body;
  ({ email, phone } = normalizeIdentifier({ email, phone }));

  try {
    if (!otp) {
      return res.status(400).json({ message: "OTP is required!" });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required!" });
    }

    // Verify OTP
    const result = await verifyOtp(email, phone, otp, "ADMIN_LOGIN");

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Find user
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phone) {
      user = await prisma.user.findFirst({ where: { phone } });
    }

    if (!user || !user.isActive || !hasAdminPanelAccess(user)) {
      return res.status(400).json({ message: "Invalid admin credentials!" });
    }

    // Generate JWT token
    const { token, age } = generateToken(user);
    setAuthCookie(res, token, age);

    return completeLogin(res, user);
  } catch (err) {
    console.error("Admin OTP verify error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

// ========== USER LOGIN (Email or Phone OTP only) ==========
export const userLogin = async (req, res) => {
  const { email, phone, loginType } = req.body;

  try {
    // Email OTP login
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.isActive) {
        return res.status(400).json({ message: "No account found with this email!" });
      }

      // Rate limiting
      const rateCheck = await checkOtpRateLimit(email, null);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }

      const otp = generateOtp();
      await storeOtp(email, null, otp, "USER_LOGIN");
      await sendOtpViaEmail(email, otp, "USER_LOGIN");

      return res.status(200).json({ message: "OTP sent to your email!", devOtp: maybeDevOtp(otp) });
    }

    // Phone OTP login
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone) && !/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ message: "Invalid phone number format!" });
      }

      const formattedPhone = cleanPhone.startsWith("+91") ? cleanPhone : `+91${cleanPhone}`;

      const user = await prisma.user.findFirst({ where: { phone: formattedPhone } });

      if (!user || !user.isActive) {
        return res.status(400).json({ message: "No account found with this phone!" });
      }

      // Rate limiting
      const rateCheck = await checkOtpRateLimit(null, formattedPhone);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }

      const otp = generateOtp();
      await storeOtp(null, formattedPhone, otp, "USER_LOGIN");
      await sendOtpViaPhone(formattedPhone, otp, "USER_LOGIN");

      return res.status(200).json({ message: "OTP sent to your phone!", devOtp: maybeDevOtp(otp) });
    }

    return res.status(400).json({ message: "Email or phone is required!" });
  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

// ========== USER OTP VERIFY ==========
export const verifyUserOtp = async (req, res) => {
  let { email, phone, otp } = req.body;
  ({ email, phone } = normalizeIdentifier({ email, phone }));

  try {
    if (!otp) {
      return res.status(400).json({ message: "OTP is required!" });
    }


    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required!" });
    }

    const otpType = "USER_LOGIN";


    // Verify OTP
    const result = await verifyOtp(email, phone, otp, otpType);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Find user
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phone) {
      user = await prisma.user.findFirst({ where: { phone } });
    }

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Generate JWT token
    const { token, age } = generateToken(user);
    setAuthCookie(res, token, age);

    return completeLogin(res, user);
  } catch (err) {
    console.error("User OTP verify error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

// ========== LEGACY PASSWORD LOGIN PASSWORD LOGIN (for admin migration) ==========
export const loginWithPassword = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required!" });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.isActive || user.password === "PASSWORDLESS_AUTH") {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    // Only allow password login for admin users
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      return res.status(400).json({ message: "Please use OTP login!" });
    }

    if (user.role === "STAFF" && !hasAdminPanelAccess(user) && !user.passwordLoginEnabled) {
      return res.status(403).json({ message: "Password login is not enabled for this account." });
    }

    const bcrypt = await import("bcrypt");
    const isPasswordValid = await bcrypt.default.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    return completeLogin(res, user);
  } catch (err) {
    console.error("Password login error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

// ========== LOGOUT ==========
export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};

// ========== CURRENT USER (session revalidation) ==========
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(req.userId, 10) },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account is inactive or no longer available." });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
      redirectTo: getRoleRedirect(user),
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Failed to load session." });
  }
};

// ========== VERIFY PHONE OTP (for phone verification) ==========
export const verifyPhoneOtp = async (req, res) => {
  let { phone, otp } = req.body;
  ({ phone } = normalizeIdentifier({ phone }));
  const userId = req.userId;

  try {
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required!" });
    }

    const result = await verifyOtp(null, phone, otp, "PHONE_VERIFICATION");

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Update user phone verification
    await prisma.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true, phone },
    });

    res.status(200).json({ message: "Phone number verified successfully!" });
  } catch (err) {
    console.error("Phone verification error:", err);
    res.status(500).json({ message: "Failed to verify phone!" });
  }
};

// ========== AGENT LOGIN (Email/Password or Phone OTP) ==========
export const agentLogin = async (req, res) => {
  let { email, phone, password, otp, loginType } = req.body;
  ({ email, phone } = normalizeIdentifier({ email, phone }));

  try {
    // Password login
    if (password) {
      if (!email && !phone) {
        return res.status(400).json({ message: "Email or phone is required!" });
      }

      // Find user by email or phone
      let user;
      if (email) {
        user = await prisma.user.findUnique({ where: { email } });
      } else {
        user = await prisma.user.findFirst({ where: { phone } });
      }

      if (!user || !user.isActive || user.password === "PASSWORDLESS_AUTH") {
        return res.status(400).json({ message: "Invalid credentials!" });
      }

      // Only allow password login for agent users
      if (user.role !== "AGENT") {
        return res.status(403).json({ message: "Agent access required!" });
      }

      const bcrypt = await import("bcrypt");
      const isPasswordValid = await bcrypt.default.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials!" });
      }

      return completeLogin(res, user);
    }

    // OTP login - initiate
    if (loginType === "otp" && (email || phone)) {
      if (email) {
        // Check if user exists and is agent
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive || user.role !== "AGENT") {
          return res.status(400).json({ message: "Invalid agent credentials!" });
        }

        // Check rate limiting
        const rateCheck = await checkOtpRateLimit(email, null);
        if (!rateCheck.allowed) {
          return res.status(429).json({ message: rateCheck.message });
        }

        // Generate and send OTP
        const otp = generateOtp();
        await storeOtp(email, null, otp, "ADMIN_LOGIN");
        await sendOtpViaEmail(email, otp, "ADMIN_LOGIN");

        return res.status(200).json({ message: "OTP sent to your email!", devOtp: maybeDevOtp(otp) });
      } else if (phone) {
        // Check phone format
        const cleanPhone = phone.replace(/\s+/g, "");
        if (!/^[6-9]\d{9}$/.test(cleanPhone) && !/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
          return res.status(400).json({ message: "Invalid phone number format!" });
        }

        const formattedPhone = cleanPhone.startsWith("+91") ? cleanPhone : `+91${cleanPhone}`;

        // Check if user exists and is agent
        const user = await prisma.user.findFirst({ where: { phone: formattedPhone } });
        if (!user || !user.isActive || user.role !== "AGENT") {
          return res.status(400).json({ message: "Invalid agent credentials!" });
        }

        // Check rate limiting
        const rateCheck = await checkOtpRateLimit(null, formattedPhone);
        if (!rateCheck.allowed) {
          return res.status(429).json({ message: rateCheck.message });
        }

        // Generate and send OTP
        const otp = generateOtp();
        await storeOtp(null, formattedPhone, otp, "ADMIN_LOGIN");
        await sendOtpViaPhone(formattedPhone, otp, "ADMIN_LOGIN");

        return res.status(200).json({ message: "OTP sent to your phone!", devOtp: maybeDevOtp(otp) });
      }
    }

    return res.status(400).json({ message: "Invalid request!" });
  } catch (err) {
    console.error("Agent login error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

// ========== AGENT OTP VERIFY (reuses admin verify but with AGENT role) ==========
export const verifyAgentOtp = async (req, res) => {
  let { email, phone, otp } = req.body;

  email = email?.trim().toLowerCase() || null;
  phone = phone ? phone.replace(/\s+/g, "") : null;


  try {
    if (!otp) {
      return res.status(400).json({ message: "OTP is required!" });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required!" });
    }

    // Verify OTP
    const result = await verifyOtp(email, phone, otp, "ADMIN_LOGIN");

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Find user
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phone) {
      user = await prisma.user.findFirst({ where: { phone } });
    }

    if (!user || !user.isActive || user.role !== "AGENT") {
      return res.status(400).json({ message: "Invalid agent credentials!" });
    }

    // Generate JWT token
    const { token, age } = generateToken(user);
    setAuthCookie(res, token, age);

    return completeLogin(res, user);
  } catch (err) {
    console.error("Agent OTP verify error:", err);
    res.status(500).json({ message: "Failed to login!" });
  }
};
