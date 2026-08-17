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
import prisma from "./lib/prisma.js";

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
import supportRoute from "./routes/support.route.js";

// Middleware
import { apiLimiter } from "./middleware/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));
app.use(compression());

const ALLOWED_ORIGINS = [
  "http://localhost:5173", "http://localhost:3000", "http://localhost:3001",
  "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://127.0.0.1:3001",
  process.env.CLIENT_URL, process.env.CHAT_APP_URL,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
  pingTimeout: 60000, pingInterval: 25000, connectTimeout: 10000, maxHttpBufferSize: 1e6, allowEIO3: true,
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = String(payload.id);
    socket.userRole = payload.role;
    next();
  } catch { next(new Error("Invalid socket authentication")); }
});

const onlineUsers = new Map();
const socketUserMap = new Map();
const userRoles = new Map();
const busyUsers = new Set();

const addUser = (userId, socketId, role) => {
  const uid = String(userId);
  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  onlineUsers.get(uid).add(socketId);
  socketUserMap.set(socketId, uid);
  if (role) userRoles.set(uid, role);
};
const removeUser = (socketId) => {
  const uid = socketUserMap.get(socketId);
  socketUserMap.delete(socketId);
  if (!uid) return;
  const sockets = onlineUsers.get(uid);
  if (!sockets) return;
  sockets.delete(socketId);
  if (!sockets.size) { onlineUsers.delete(uid); userRoles.delete(uid); busyUsers.delete(uid); }
};
const getSocketIds = (userId) => Array.from(onlineUsers.get(String(userId)) ?? []);
const emitToUser = (userId, event, payload) => {
  for (const socketId of getSocketIds(userId)) io.to(socketId).emit(event, payload);
};
const getOnlineUserIds = () => Array.from(onlineUsers.keys());

// Routes/controllers use this helper instead of broadcasting sensitive support data.
io.emitToUser = emitToUser;

const canRelayGenericChat = async (senderId, receiverId, chatId) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: Number(chatId),
      AND: [
        { participants: { some: { userId: Number(senderId) } } },
        { participants: { some: { userId: Number(receiverId) } } },
      ],
    },
    select: { id: true },
  });
  return Boolean(chat);
};

const supportRecipients = async (conversationId, actorId) => {
  const conversation = await prisma.$queryRawUnsafe(
    `SELECT customerId, assignedToId FROM support_conversations WHERE id=? AND type='CUSTOMER_SUPPORT' LIMIT 1`,
    Number(conversationId),
  );
  if (!conversation.length) return [];
  const c = conversation[0];
  if (Number(c.customerId) === Number(actorId)) {
    if (c.assignedToId) return [Number(c.assignedToId)];
    const staff = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] }, isActive: true, OR: [{ role: "ADMIN" }, { canAccessAdminPanel: true }] }, select: { id: true } });
    return staff.map((s) => s.id);
  }
  if (Number(c.assignedToId) === Number(actorId)) return [Number(c.customerId)];
  const actor = await prisma.user.findUnique({ where: { id: Number(actorId) }, select: { role: true, canAccessAdminPanel: true, permissions: true } });
  if (actor?.role === "ADMIN" || (actor?.role === "STAFF" && (actor.canAccessAdminPanel || actor.permissions?.includes?.("SUPPORT_CHAT")))) return [Number(c.customerId)];
  return [];
};

io.on("connection", (socket) => {
  console.log("[Socket] Connected:", socket.id);

  socket.on("newUser", () => {
    addUser(socket.userId, socket.id, socket.userRole);
    io.emit("getOnlineUsers", getOnlineUserIds());
  });

  // Generic chat relay is now authorization-checked against the Chat participants.
  socket.on("sendMessage", async (payload) => {
    try {
      const receiverId = payload?.data ? payload.receiverId : payload?.receiverId;
      const messageData = payload?.data || payload;
      if (!receiverId || !messageData || typeof messageData !== "object") return;
      if (!(await canRelayGenericChat(socket.userId, receiverId, messageData.chatId))) return;
      const relay = { ...messageData, userId: socket.userId };
      emitToUser(receiverId, "getMessage", relay);
      for (const socketId of getSocketIds(socket.userId)) if (socketId !== socket.id) io.to(socketId).emit("getMessage", relay);
    } catch (error) { console.error("[Socket] generic message relay rejected:", error.message); }
  });

  // Support typing is never broadcast globally; the backend validates the conversation.
  socket.on("support:typing", async ({ conversationId, isTyping } = {}) => {
    const recipients = await supportRecipients(conversationId, socket.userId);
    recipients.forEach((id) => emitToUser(id, "support:typing", { conversationId: Number(conversationId), userId: Number(socket.userId), senderName: socket.userRole, isTyping: Boolean(isTyping) }));
  });
  socket.on("support:staffTyping", async ({ conversationId, customerId, isTyping } = {}) => {
    const recipients = await supportRecipients(conversationId, socket.userId);
    if (Number(customerId) && recipients.includes(Number(customerId))) emitToUser(customerId, "support:typing", { conversationId: Number(conversationId), userId: Number(socket.userId), senderName: socket.userRole, isTyping: Boolean(isTyping) });
  });

  socket.on("typing", async ({ receiverId, chatId, isTyping, senderName } = {}) => {
    if (!receiverId || !(await canRelayGenericChat(socket.userId, receiverId, chatId))) return;
    emitToUser(receiverId, "userTyping", { chatId: Number(chatId), senderId: socket.userId, senderName: senderName || "User", isTyping: Boolean(isTyping) });
  });

  socket.on("propertyInquiry", (data) => {
    for (const [uid, role] of userRoles.entries()) if (["ADMIN", "STAFF", "AGENT"].includes(role)) emitToUser(uid, "newInquiry", data);
  });
  socket.on("statusChange", (data) => socket.broadcast.emit("userStatusChange", data));

  socket.on("call-offer", (data) => {
    const { targetUserId, offer, callType, chatId, callerName, callerAvatar } = data || {};
    if (!targetUserId || String(targetUserId) === String(socket.userId)) return;
    if (busyUsers.has(String(targetUserId))) return socket.emit("callBusy", { targetUserId });
    const receiverSocketIds = getSocketIds(targetUserId);
    if (!receiverSocketIds.length) return socket.emit("call-user-offline", { targetUserId });
    busyUsers.add(String(socket.userId)); busyUsers.add(String(targetUserId));
    receiverSocketIds.forEach((socketId) => io.to(socketId).emit("incoming-call", { callerId: socket.userId, callerSocketId: socket.id, callerName: callerName || "Unknown", callerAvatar: callerAvatar || null, offer, callType: callType || "audio", chatId }));
  });
  socket.on("call-answer", ({ targetUserId, answer } = {}) => { if (targetUserId) emitToUser(targetUserId, "call-answer", { answererId: socket.userId, answer }); });
  socket.on("call-ice-candidate", ({ targetUserId, candidate } = {}) => { if (targetUserId) emitToUser(targetUserId, "call-ice-candidate", { fromUserId: socket.userId, candidate }); });
  socket.on("call-reject", ({ targetUserId } = {}) => { if (!targetUserId) return; busyUsers.delete(String(socket.userId)); busyUsers.delete(String(targetUserId)); emitToUser(targetUserId, "call-rejected", { rejectedBy: socket.userId }); });
  socket.on("call-end", async ({ targetUserId, chatId, callerId, receiverId, callType, duration } = {}) => {
    busyUsers.delete(String(socket.userId));
    if (targetUserId) { busyUsers.delete(String(targetUserId)); emitToUser(targetUserId, "call-ended", { endedBy: socket.userId, duration: duration || 0 }); }
    if (!chatId || !callerId || !receiverId) return;
    try {
      const actorId = Number(socket.userId), caller = Number(callerId), receiver = Number(receiverId);
      if (![actorId, caller, receiver].every(Number.isInteger) || (actorId !== caller && actorId !== receiver)) return;
      const chat = await prisma.chat.findFirst({ where: { id: Number(chatId), participants: { some: { userId: actorId } } }, select: { id: true } });
      if (!chat) return;
      await prisma.callLog.create({ data: { chatId: Number(chatId), callerId: caller, receiverId: receiver, callType: callType || "audio", status: duration > 0 ? "completed" : "missed", duration: Math.max(0, Number(duration) || 0), endedAt: duration > 0 ? new Date() : null } });
    } catch (error) { console.error("[Socket] call log failed:", error.message); }
  });

  socket.on("disconnect", (reason) => {
    const uid = socketUserMap.get(socket.id);
    if (uid) { busyUsers.delete(uid); socket.broadcast.emit("call-user-disconnected", { userId: uid }); }
    removeUser(socket.id);
    io.emit("getOnlineUsers", getOnlineUserIds());
    console.log("[Socket] Disconnected:", socket.id, reason);
  });
  socket.on("error", (error) => console.error("[Socket] Error:", error));
});

app.set("io", io);

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
setupSwagger(app);
app.use("/api", apiLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/properties", propertyRoute);
app.use("/api/users", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/support", supportRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/calls", callRoute);
app.use("/api/cms", cmsRoute);

app.get("/", (req, res) => res.json({ message: "Suretreaven API with Socket.IO", version: "2.1.0", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok", onlineUsersCount: onlineUsers.size, uptime: process.uptime(), timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
  if (err.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ message: "Unexpected file field." });
  if (err.message === "Only image files are allowed!") return res.status(400).json({ message: err.message });
  if (err.code === "P2002") return res.status(400).json({ message: "A record with this data already exists." });
  if (err.code === "P2025") return res.status(404).json({ message: "Record not found." });
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message || "Something went wrong!";
  res.status(statusCode).json({ message });
});
app.use((req, res) => res.status(404).json({ error: "Not Found", message: "The requested resource was not found" }));

const PORT = process.env.PORT || 8800;
httpServer.listen(PORT, () => console.log(`Suretreaven API running on http://localhost:${PORT}`));

export default app;
export { io };
