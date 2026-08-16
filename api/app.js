import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { setupSwagger } from "./swagger.js";

// Routes
import authRoute from "./routes/auth.route.js";
import adminRoute from "./routes/admin.route.js";
import propertyRoute from "./routes/property.route.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
import notificationRoute from "./routes/notification.route.js";
import callRoute from "./routes/call.route.js";
import cmsRoute from "./routes/cms.route.js";

// Middleware
import { apiLimiter } from "./middleware/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

// ========================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ========================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(compression());

// ========================================
// SOCKET.IO SETUP
// ========================================

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  process.env.CLIENT_URL,
  process.env.CHAT_APP_URL,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true,
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = String(payload.id);
    socket.userRole = payload.role;
    next();
  } catch {
    next(new Error("Invalid socket authentication"));
  }
});

// userId (string) → socketId (string)
const onlineUsers = new Map();

const addUser = (userId, socketId) => {
  onlineUsers.set(String(userId), socketId);
};

const removeUser = (socketId) => {
  for (const [userId, sockId] of onlineUsers.entries()) {
    if (sockId === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

const getSocketId = (userId) => onlineUsers.get(String(userId));

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

io.on("connection", (socket) => {
  console.log("[Socket] Connected:", socket.id);

  // ── 1. Register user ────────────────────────────────────────────
  socket.on("newUser", () => {
    const uid = String(socket.userId);
    if (!uid) return;
    addUser(uid, socket.id);
    console.log(`[Socket] User online: ${uid} → ${socket.id} (total: ${onlineUsers.size})`);
    io.emit("getOnlineUsers", getOnlineUserIds());
  });

  // ── 2. Chat messages ────────────────────────────────────────────
  socket.on("sendMessage", (payload) => {
    let receiverId, messageData;
    if (payload.data) {
      receiverId = payload.receiverId;
      messageData = payload.data;
    } else {
      receiverId = payload.receiverId;
      messageData = payload;
    }
    const receiverSocketId = getSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("getMessage", messageData);
      console.log(`[Socket] Message → receiver ${receiverId}`);
    } else {
      console.log(`[Socket] Receiver ${receiverId} offline, saved to DB only`);
    }
  });

  // ── 3. Typing indicator ─────────────────────────────────────────
  socket.on("typing", ({ receiverId, chatId, isTyping, senderName }) => {
    const receiverSocketId = getSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        chatId: Number(chatId),
        senderId: socket.userId,
        senderName: senderName || "User",
        isTyping: Boolean(isTyping),
      });
    }
  });

  // ── 4. Property inquiry ─────────────────────────────────────────
  socket.on("propertyInquiry", (data) => {
    for (const [, socketId] of onlineUsers.entries()) {
      io.to(socketId).emit("newInquiry", data);
    }
  });

  // ── 5. Status change ────────────────────────────────────────────
  socket.on("statusChange", (data) => {
    socket.broadcast.emit("userStatusChange", data);
  });

  // ── WebRTC: Call Offer ──────────────────────────────────────────
  // Frontend sends: { targetUserId, offer, callType, chatId, callerName, callerAvatar }
  socket.on("call-offer", (data) => {
    const { targetUserId, offer, callType, chatId, callerName, callerAvatar } = data;
    const receiverSocketId = getSocketId(targetUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", {
        callerId: socket.userId,
        callerSocketId: socket.id,
        callerName: callerName || "Unknown",
        callerAvatar: callerAvatar || null,
        offer,
        callType: callType || "audio",
        chatId,
      });
      console.log(`[Socket] Call offer: ${socket.userId} → ${targetUserId} (${callType})`);
    } else {
      console.log(`[Socket] Call target ${targetUserId} is offline`);
      socket.emit("call-user-offline", { targetUserId });
    }
  });

  // ── WebRTC: Call Answer ─────────────────────────────────────────
  // Frontend sends: { targetUserId, answer }
  socket.on("call-answer", (data) => {
    const { targetUserId, answer } = data;
    const targetSocketId = getSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-answer", {
        answererId: socket.userId,
        answer,
      });
      console.log(`[Socket] Call answer: ${socket.userId} → ${targetUserId}`);
    }
  });

  // ── WebRTC: ICE Candidate ───────────────────────────────────────
  // Frontend sends: { targetUserId, candidate }
  socket.on("call-ice-candidate", (data) => {
    const { targetUserId, candidate } = data;
    const targetSocketId = getSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ice-candidate", {
        fromUserId: socket.userId,
        candidate,
      });
    }
  });

  // ── WebRTC: Call Reject ─────────────────────────────────────────
  // Frontend sends: { targetUserId }
  socket.on("call-reject", (data) => {
    const { targetUserId } = data;
    const targetSocketId = getSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-rejected", { rejectedBy: socket.userId });
      console.log(`[Socket] Call rejected by ${socket.userId}`);
    }
  });

  // ── WebRTC: Call End ────────────────────────────────────────────
  // Frontend sends: { targetUserId, chatId, callerId, receiverId, callType, duration }
  socket.on("call-end", (data) => {
    const { targetUserId, chatId, callerId, receiverId, callType, duration } = data;
    const targetSocketId = getSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended", {
        endedBy: socket.userId,
        duration: duration || 0,
      });
    }
    console.log(`[Socket] Call ended by ${socket.userId}, duration: ${duration || 0}s`);

    // Log call to DB
    if (chatId && callerId && receiverId) {
      import("./lib/prisma.js").then(async ({ default: prisma }) => {
        try {
          const actorId = Number(socket.userId);
          const caller = Number(callerId);
          const receiver = Number(receiverId);
          if (![actorId, caller, receiver].every(Number.isInteger) || (actorId !== caller && actorId !== receiver)) {
            return;
          }

          const chat = await prisma.chat.findFirst({
            where: {
              id: Number(chatId),
              participants: {
                some: { userId: actorId },
              },
            },
            select: { id: true },
          });
          if (!chat) return;

          await prisma.callLog.create({
            data: {
              chatId: Number(chatId),
              callerId: caller,
              receiverId: receiver,
              callType: callType || "audio",
              status: duration && duration > 0 ? "completed" : "missed",
              duration: Math.max(0, Number(duration) || 0),
              endedAt: duration && duration > 0 ? new Date() : null,
            },
          });
          console.log("[Socket] Call log saved");
        } catch (dbErr) {
          console.error("[Socket] Failed to log call:", dbErr.message);
        }
      }).catch(() => {});
    }
  });

  // ── Disconnect ──────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", socket.id, reason);
    if (socket.userId) {
      socket.broadcast.emit("call-user-disconnected", { userId: socket.userId });
    }
    removeUser(socket.id);
    io.emit("getOnlineUsers", getOnlineUserIds());
  });

  socket.on("error", (error) => {
    console.error("[Socket] Error:", error);
  });
});

// Make io accessible to routes
app.set("io", io);

// ========================================
// CORS CONFIGURATION
// ========================================

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ========================================
// STANDARD MIDDLEWARE
// ========================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

setupSwagger(app);

app.use("/api", apiLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/properties", propertyRoute);
app.use("/api/users", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/calls", callRoute);
app.use("/api/cms", cmsRoute);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "Suretreaven API with Socket.IO",
    version: "2.0.0",
    status: "ok",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    onlineUsersCount: onlineUsers.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// ERROR HANDLING
// ========================================

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
  if (err.code === "LIMIT_UNEXPECTED_FILE")
    return res.status(400).json({ message: "Unexpected file field." });
  if (err.code === "P2002")
    return res.status(400).json({ message: "A record with this data already exists." });
  if (err.code === "P2025")
    return res.status(404).json({ message: "Record not found." });

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Something went wrong!";
  res.status(statusCode).json({ message });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", message: "The requested resource was not found" });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 8800;

httpServer.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("  Suretreaven API Server");
  console.log("=".repeat(60));
  console.log(`  HTTP API:     http://localhost:${PORT}`);
  console.log(`  Socket.IO:    ws://localhost:${PORT}`);
  console.log(`  Environment:  ${process.env.NODE_ENV || "development"}`);
  console.log("=".repeat(60));
});

export default app;
export { io };
