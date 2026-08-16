import express from "express";
import {
  register,
  verifyEmailOtp,
  loginWithEmail,
  loginWithPhone,
  verifyLoginOtp,
  unifiedLogin,
  verifyUnifiedOtp,
  verifyPhoneOtp,
  resendOtp,
  loginWithPassword,
  logout,
  getMe,
  adminLogin,
  verifyAdminOtp,
  userLogin,
  verifyUserOtp,
  agentLogin,
  verifyAgentOtp,
} from "../controllers/auth.controller.js";
import { otpLimiter, authLimiter } from "../middleware/rateLimiter.js";
import { validateRegister, validateEmailLogin, validatePhoneLogin, validateOtp } from "../middleware/validators.js";
import { verifyToken, verifyTokenStrict } from "../middleware/verifyToken.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user and send OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *             example:
 *               username: testuser
 *               email: user@example.com
 *               phone: 9876543210
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Validation error
 */
router.post("/register", otpLimiter, validateRegister, register);

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email OTP during registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-email", otpLimiter, validateOtp, verifyEmailOtp);

// User login (Email/Phone OTP only)
router.post("/user/login", otpLimiter, userLogin);
router.post("/user/verify-otp", otpLimiter, validateOtp, verifyUserOtp);

// Admin login (Email/Password or Phone OTP)
router.post("/admin/login", authLimiter, adminLogin);
router.post("/admin/verify-otp", otpLimiter, validateOtp, verifyAdminOtp);

// Agent login (Email/Password or Phone OTP)
router.post("/agent/login", authLimiter, agentLogin);
router.post("/agent/verify-otp", otpLimiter, validateOtp, verifyAgentOtp);

// Legacy login flows (for backwards compatibility)
router.post("/login/email", otpLimiter, validateEmailLogin, loginWithEmail);
router.post("/login/phone", otpLimiter, validatePhoneLogin, loginWithPhone);
router.post("/login/verify-otp", otpLimiter, validateOtp, verifyLoginOtp);
router.post("/login/password", authLimiter, loginWithPassword);

// Unified login endpoint for users, admins, and staff
router.post("/login", authLimiter, unifiedLogin);
router.post("/verify-otp", otpLimiter, validateOtp, verifyUnifiedOtp);

// Preview user type by email/phone (for login UI) — limited fields only
router.get("/preview", authLimiter, async (req, res) => {
  const { email, phone } = req.query;
  try {
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
        select: {
          role: true,
          canAccessAdminPanel: true,
          passwordLoginEnabled: true,
          password: true,
          isActive: true,
        },
      });
    } else if (phone) {
      const cleanPhone = phone.toString().replace(/\D/g, "");
      const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length > 10
        ? `+${cleanPhone}`
        : `+91${cleanPhone}`;
      user = await prisma.user.findFirst({
        where: { phone: formattedPhone },
        select: {
          role: true,
          canAccessAdminPanel: true,
          passwordLoginEnabled: true,
          password: true,
          isActive: true,
        },
      });
    }

    if (!user || !user.isActive) {
      return res.status(200).json({ exists: false, userType: null });
    }

    return res.status(200).json({
      exists: true,
      userType: user.role,
      canAccessAdminPanel: !!user.canAccessAdminPanel || user.role === "ADMIN",
      passwordLoginEnabled:
        !!user.passwordLoginEnabled &&
        !!user.password &&
        user.password !== "PASSWORDLESS_AUTH",
    });
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ message: "Failed to check user" });
  }
});

// OTP management
router.post("/resend-otp", otpLimiter, resendOtp);

// Phone verification (authenticated)
router.post("/verify-phone", verifyToken, validateOtp, verifyPhoneOtp);

// Session revalidation
router.get("/me", verifyTokenStrict, getMe);

// Logout
router.post("/logout", logout);

export default router;
