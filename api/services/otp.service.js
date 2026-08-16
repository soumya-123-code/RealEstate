import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import prisma from "../lib/prisma.js";

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 10;
const OTP_RESEND_COOLDOWN = 60; // seconds
const VALID_OTP_TYPES = new Set([
  "EMAIL_VERIFICATION",
  "EMAIL_LOGIN",
  "PHONE_LOGIN",
  "PHONE_VERIFICATION",
]);

const normalizeOtpType = (type, email, phone) => {
  if (VALID_OTP_TYPES.has(type)) return type;

  if (type === "ADMIN_LOGIN" || type === "USER_LOGIN") {
    return email ? "EMAIL_LOGIN" : "PHONE_LOGIN";
  }

  return type;
};

// ========================================
// EMAIL TRANSPORTER (Real Gmail SMTP)
// ========================================
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Verify transporter connection on startup
let transporterReady = false;
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email SMTP transporter is ready");
    transporterReady = true;
  } catch (error) {
    console.warn("⚠️ Email SMTP transporter not ready:", error.message);
    console.warn("   OTP emails will be logged to console instead");
    transporterReady = false;
  }
};

// Verify on module load
verifyTransporter();

// ========================================
// GENERATE OTP
// ========================================
export const generateOtp = () => {
  return otpGenerator.generate(OTP_LENGTH, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

// ========================================
// STORE OTP IN DATABASE
// ========================================
export const storeOtp = async (email, phone, otp, type) => {
  const otpType = normalizeOtpType(type, email, phone);

  // Delete any existing unused OTPs for this email/phone and type
  if (email) {
    await prisma.otpVerification.deleteMany({
      where: { email, type: otpType, isUsed: false },
    });
  }
  if (phone) {
    await prisma.otpVerification.deleteMany({
      where: { phone, type: otpType, isUsed: false },
    });
  }

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  return prisma.otpVerification.create({
    data: {
      email,
      phone,
      otp,
      type: otpType,
      expiresAt,
    },
  });
};

// ========================================
// VERIFY OTP
// ========================================
export const verifyOtp = async (email, phone, otp, type) => {
  const otpType = normalizeOtpType(type, email, phone);
  const whereClause = {
    otp,
    type: otpType,
    isUsed: false,
    expiresAt: { gt: new Date() },
  };

  if (email) whereClause.email = email;
  if (phone) whereClause.phone = phone;

  const otpRecord = await prisma.otpVerification.findFirst({
    where: whereClause,
  });

  if (!otpRecord) {
    return { valid: false, message: "Invalid or expired OTP" };
  }

  // Mark OTP as used
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  return { valid: true, message: "OTP verified successfully" };
};

// ========================================
// SEND OTP VIA EMAIL (Real Gmail SMTP)
// ========================================
export const sendOtpViaEmail = async (email, otp, type) => {
  const typeLabels = {
    EMAIL_VERIFICATION: "Email Verification",
    EMAIL_LOGIN: "Login Verification",
  };

  const subject = typeLabels[type] || "OTP Verification";
  const companyName = process.env.COMPANY_NAME || "Suretreaven";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #1a5276 0%, #2e86c1 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${companyName}</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Rourkela, Odisha | Trusted Real Estate Platform</p>
      </div>
      <div style="padding: 40px 32px;">
        <h2 style="color: #2c3e50; margin: 0 0 16px; font-size: 22px;">${subject}</h2>
        <p style="color: #7f8c8d; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">Use the following OTP code to complete your verification. This code is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
        <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 2px dashed #2e86c1;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1a5276; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #95a5a6; font-size: 14px; margin: 16px 0 0;">If you didn't request this code, please ignore this email. Do not share this OTP with anyone.</p>
      </div>
      <div style="background: #f8f9fa; padding: 20px 32px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #95a5a6; margin: 0; font-size: 13px;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        <p style="color: #bdc3c7; margin: 4px 0 0; font-size: 12px;">Rourkela, Odisha, India</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${companyName}" <${fromEmail}>`,
    to: email,
    subject: `${subject} - Your OTP Code`,
    html: htmlContent,
  };

  try {
    // Try sending via real SMTP first
    if (transporterReady) {
      const transporter = createTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      // Fallback: try to re-verify and send
      try {
        const transporter = createTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}: ${info.messageId}`);
        transporterReady = true;
        return { success: true, messageId: info.messageId };
      } catch (retryError) {
        console.error("❌ Email send failed:", retryError.message);
        if (process.env.NODE_ENV === "production") {
          throw new Error("Email delivery service is unavailable.");
        }
        console.log(`📧 [DEV FALLBACK] OTP for ${email}: ${otp}`);
        return { 
          success: true, 
          message: "OTP generated (development fallback)",
          devOtp: otp 
        };
      }
    }
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email delivery service is unavailable.");
    }
    console.log(`📧 [DEV FALLBACK] OTP for ${email}: ${otp}`);
    return { 
      success: true, 
      message: "OTP generated (development fallback)",
      devOtp: otp 
    };
  }
};

// ========================================
// SEND OTP VIA PHONE (Dummy - returns OTP in response)
// ========================================
// For now, this is a DUMMY implementation that returns the OTP
// in the API response so you can test phone login flow.
// When you integrate a real SMS provider (Twilio, MSG91, TextLocal),
// replace this function body with actual SMS sending logic.
export const sendOtpViaPhone = async (phone, otp, type) => {
  console.log(`📱 [DUMMY SMS] OTP for ${phone}: ${otp}`);
  console.log(`   (Replace sendOtpViaPhone with real SMS provider integration)`);
  
  // ========================================
  // FUTURE: Real SMS Integration
  // ========================================
  // Example with MSG91:
  // if (process.env.SMS_PROVIDER === 'msg91') {
  //   const response = await axios.post('https://api.msg91.com/api/v5/otp', {
  //     template_id: process.env.MSG91_TEMPLATE_ID,
  //     mobile: phone,
  //     authkey: process.env.MSG91_API_KEY,
  //     OTP: otp,
  //   });
  //   return { success: true, messageId: response.data.message };
  // }
  
  // Example with Twilio:
  // if (process.env.SMS_PROVIDER === 'twilio') {
  //   const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  //   const message = await client.messages.create({
  //     body: `Your ${process.env.COMPANY_NAME} OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
  //     from: process.env.TWILIO_PHONE_NUMBER,
  //     to: phone,
  //   });
  //   return { success: true, messageId: message.sid };
  // }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMS provider is not configured.");
  }

  return { 
    success: true, 
    message: "OTP generated (development fallback)",
    devOtp: otp,
  };
};

// ========================================
// CHECK RATE LIMITING FOR OTP REQUESTS
// ========================================
export const checkOtpRateLimit = async (email, phone) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const whereClause = {
    createdAt: { gte: oneHourAgo },
  };

  if (email) whereClause.email = email;
  if (phone) whereClause.phone = phone;

  const recentOtps = await prisma.otpVerification.count({
    where: whereClause,
  });

  if (recentOtps >= MAX_OTP_ATTEMPTS) {
    return {
      allowed: false,
      message: `Too many OTP requests. Please try again later.`,
    };
  }

  return { allowed: true };
};

// ========================================
// CHECK OTP RESEND COOLDOWN
// ========================================
export const checkResendCooldown = async (email, phone, type) => {
  const otpType = normalizeOtpType(type, email, phone);
  const cooldownPeriod = new Date(Date.now() - OTP_RESEND_COOLDOWN * 1000);

  const whereClause = {
    type: otpType,
    createdAt: { gte: cooldownPeriod },
  };

  if (email) whereClause.email = email;
  if (phone) whereClause.phone = phone;

  const recentOtp = await prisma.otpVerification.findFirst({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const secondsSinceLastOtp = Math.floor(
      (Date.now() - recentOtp.createdAt.getTime()) / 1000
    );
    const remainingCooldown = OTP_RESEND_COOLDOWN - secondsSinceLastOtp;

    if (remainingCooldown > 0) {
      return {
        allowed: false,
        remainingSeconds: remainingCooldown,
        message: `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
      };
    }
  }

  return { allowed: true };
};

export default {
  generateOtp,
  storeOtp,
  verifyOtp,
  sendOtpViaEmail,
  sendOtpViaPhone,
  checkOtpRateLimit,
  checkResendCooldown,
};
