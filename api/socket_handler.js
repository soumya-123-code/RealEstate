/**
 * socket_handler.js  — Drop this file in your backend root.
 *
 * In your main server file (e.g. index.js / server.js / app.js), add:
 *
 *   import { createServer } from "http";
 *   import { Server } from "socket.io";
 *   import { initSocket } from "./socket_handler.js";
 *
 *   const httpServer = createServer(app);
 *   const io = new Server(httpServer, {
 *     cors: {
 *       origin: process.env.CLIENT_URL || "http://localhost:5173",
 *       methods: ["GET", "POST"],
 *       credentials: true,
 *     },
 *   });
 *   initSocket(io);
 *
 *   // Change app.listen(...) → httpServer.listen(...)
 *   httpServer.listen(8800, () => console.log("Server running on port 8800"));
 */

// userId (string) → socketId (string)
const onlineUsers = new Map();

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── 1. Register user as online ─────────────────────────────────────
    socket.on("newUser", (userId) => {
      if (!userId) return;
      const uid = String(userId);
      onlineUsers.set(uid, socket.id);
      socket.userId = uid;
      console.log(`[Socket] User online: ${uid} → ${socket.id}`);
      // Broadcast updated online list to ALL connected clients
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    // ── 2. Forward a chat message to the receiver ──────────────────────
    socket.on("sendMessage", (data) => {
      /*
       * Payload sent by frontend (AdminChat.jsx):
       * {
       *   receiverId   : number,
       *   chatId       : number,
       *   id           : number,    ← DB message id
       *   text         : string,
       *   userId       : number,    ← sender
       *   senderName   : string,
       *   senderAvatar : string | null,
       *   createdAt    : string,    ← ISO timestamp
       * }
       */
      const receiverSocketId = onlineUsers.get(String(data.receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("getMessage", {
          id          : data.id,
          chatId      : Number(data.chatId),
          text        : data.text,
          userId      : Number(data.userId),
          senderName  : data.senderName  || "Unknown",
          senderAvatar: data.senderAvatar || null,
          createdAt   : data.createdAt   || new Date().toISOString(),
        });
        console.log(`[Socket] Message chatId=${data.chatId} → receiver=${data.receiverId}`);
      } else {
        console.log(`[Socket] Receiver ${data.receiverId} is offline, message saved to DB only`);
      }
    });

    // ── 3. Forward typing indicator ────────────────────────────────────
    socket.on("typing", ({ receiverId, chatId, isTyping, senderName }) => {
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", {
          chatId    : Number(chatId),
          senderId  : socket.userId,
          senderName: senderName || "User",
          isTyping  : Boolean(isTyping),
        });
      }
    });

    // ── 4. Disconnect ──────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`[Socket] User offline: ${socket.userId} (${reason})`);
        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      }
    });
  });
}
