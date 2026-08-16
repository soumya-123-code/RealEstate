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

import authRoute from "./routes/auth.route.js";
import adminRoute from "./routes/admin.route.js";
import agentRoute from "./routes/agent.route.js";
import propertyRoute from "./routes/property.route.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
import notificationRoute from "./routes/notification.route.js";
import callRoute from "./routes/call.route.js";
import cmsRoute from "./routes/cms.route.js";
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
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  maxHttpBufferSize: 1e6,
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = String(payload.id);
    socket.userRole = payload.role;
    return next();
  } catch {
    return next(new Error("Invalid socket authentication"));
  }
});

const onlineUsers = new Map();
const addUser = (userId, socketId) => {
  const uid = String(userId);
  const sockets = onlineUsers.get(uid) || new Set();
  sockets.add(socketId);
  onlineUsers.set(uid, sockets);
};
const removeUser = (socketId) => {
  for (const [uid, sockets] of onlineUsers) {
    if (!sockets.delete(socketId)) continue;
    if (sockets.size === 0) onlineUsers.delete(uid);
    break;
  }
};
const getSocketIds = (userId) => [...(onlineUsers.get(String(userId)) || [])];
const emitToUser = (userId, event, payload) => getSocketIds(userId).forEach((id) => io.to(id).emit(event, payload));
const getOnlineUserIds = () => [...onlineUsers.keys()];

const isValidChatParticipant = async (chatId, senderId, receiverId) => {
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, AND: [{ participants: { some: { userId: senderId } } }, { participants: { some: { userId: receiverId } } }] },
    select: { id: true },
  });
  return Boolean(chat);
};

io.on("connection", (socket) => {
  socket.on("newUser", () => { addUser(socket.userId, socket.id); io.emit("getOnlineUsers", getOnlineUserIds()); });

  socket.on("sendMessage", async (payload = {}) => {
    const receiverId = Number(payload.receiverId);
    const chatId = Number(payload.chatId);
    const senderId = Number(socket.userId);
    if (![receiverId, chatId, senderId].every(Number.isInteger)) return socket.emit("chat:error", { message: "Invalid chat message payload." });
    try {
      if (!(await isValidChatParticipant(chatId, senderId, receiverId))) return socket.emit("chat:error", { message: "Conversation access denied." });
      const data = payload.data || payload;
      emitToUser(receiverId, "getMessage", { ...data, chatId, userId: senderId, senderName: data.senderName || "User" });
    } catch (error) {
      console.error("[Socket] Message validation failed:", error.message);
      socket.emit("chat:error", { message: "Unable to deliver the message in real time." });
    }
  });

  socket.on("typing", async ({ receiverId, chatId, isTyping, senderName } = {}) => {
    const receiver = Number(receiverId), chat = Number(chatId), sender = Number(socket.userId);
    if (![receiver, chat, sender].every(Number.isInteger)) return;
    try {
      if (!(await isValidChatParticipant(chat, sender, receiver))) return;
      emitToUser(receiver, "userTyping", { chatId: chat, senderId: String(sender), senderName: senderName || "User", isTyping: Boolean(isTyping) });
    } catch (error) { console.error("[Socket] Typing validation failed:", error.message); }
  });

  socket.on("propertyInquiry", (data) => io.emit("newInquiry", data));
  socket.on("statusChange", (data) => socket.broadcast.emit("userStatusChange", data));

  socket.on("call-offer", async (data = {}) => {
    const targetUserId = String(data.targetUserId || "");
    const chatId = Number(data.chatId);
    if (!targetUserId) return;
    if (Number.isInteger(chatId) && !(await isValidChatParticipant(chatId, Number(socket.userId), Number(targetUserId)))) return socket.emit("call-user-denied", { targetUserId });
    if (!getSocketIds(targetUserId).length) return socket.emit("call-user-offline", { targetUserId });
    emitToUser(targetUserId, "incoming-call", { callerId: socket.userId, callerSocketId: socket.id, callerName: data.callerName || "Unknown", callerAvatar: data.callerAvatar || null, offer: data.offer, callType: data.callType || "audio", chatId: data.chatId });
  });
  socket.on("call-answer", ({ targetUserId, answer } = {}) => { if (targetUserId) emitToUser(targetUserId, "call-answer", { answererId: socket.userId, answer }); });
  socket.on("call-ice-candidate", ({ targetUserId, candidate } = {}) => { if (targetUserId) emitToUser(targetUserId, "call-ice-candidate", { fromUserId: socket.userId, candidate }); });
  socket.on("call-reject", ({ targetUserId } = {}) => { if (targetUserId) emitToUser(targetUserId, "call-rejected", { rejectedBy: socket.userId }); });

  socket.on("call-end", async (data = {}) => {
    const targetUserId = String(data.targetUserId || "");
    if (targetUserId) emitToUser(targetUserId, "call-ended", { endedBy: socket.userId, duration: Number(data.duration) || 0 });
    const chatId = Number(data.chatId), callerId = Number(data.callerId), receiverId = Number(data.receiverId), duration = Math.max(0, Number(data.duration) || 0), actorId = Number(socket.userId);
    if (![chatId, callerId, receiverId, actorId].every(Number.isInteger) || (actorId !== callerId && actorId !== receiverId)) return;
    try {
      if (!(await isValidChatParticipant(chatId, actorId, actorId === callerId ? receiverId : callerId))) return;
      await prisma.callLog.create({ data: { chatId, callerId, receiverId, callType: data.callType || "audio", status: duration > 0 ? "completed" : "missed", duration, endedAt: duration > 0 ? new Date() : null } });
    } catch (error) { console.error("[Socket] Failed to log call:", error.message); }
  });

  socket.on("disconnect", (reason) => {
    removeUser(socket.id);
    socket.broadcast.emit("call-user-disconnected", { userId: socket.userId });
    io.emit("getOnlineUsers", getOnlineUserIds());
    console.log("[Socket] Disconnected:", socket.id, reason);
  });
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
app.use("/api/agent", agentRoute);
app.use("/api/properties", propertyRoute);
app.use("/api/users", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/calls", callRoute);
app.use("/api/cms", cmsRoute);

app.get("/", (req, res) => res.json({ message: "Suretreaven API with Socket.IO", version: "2.0.0", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok", onlineUsersCount: onlineUsers.size, uptime: process.uptime(), timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
  if (err.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ message: "Unexpected file field." });
  if (err.code === "P2002") return res.status(400).json({ message: "A record with this data already exists." });
  if (err.code === "P2025") return res.status(404).json({ message: "Record not found." });
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message || "Something went wrong!";
  return res.status(statusCode).json({ message });
});
app.use((req, res) => res.status(404).json({ error: "Not Found", message: "The requested resource was not found" }));

const PORT = process.env.PORT || 8800;
httpServer.listen(PORT, () => console.log(`Suretreaven API listening on ${PORT} (${process.env.NODE_ENV || "development"})`));

export default app;
export { io };
