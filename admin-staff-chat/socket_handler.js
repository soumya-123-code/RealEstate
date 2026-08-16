/**
 * socket_handler.js  — Updated to match app.js WebRTC event names.
 * Drop this in the backend root as an alternative to the inline socket setup in app.js.
 *
 * Event names used:
 *  call-offer        → server emits incoming-call to receiver
 *  call-answer       → server emits call-answer to caller
 *  call-ice-candidate→ server emits call-ice-candidate to target
 *  call-reject       → server emits call-rejected to caller
 *  call-end          → server emits call-ended to other party
 *  call-user-offline → emitted when target is not online
 *  call-user-disconnected → emitted on socket disconnect
 */

// userId (string) → socketId (string)
const onlineUsers = new Map();

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on("newUser", (userId) => {
      if (!userId) return;
      const uid = String(userId);
      onlineUsers.set(uid, socket.id);
      socket.userId = uid;
      console.log(`[Socket] User online: ${uid} → ${socket.id}`);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("sendMessage", (payload) => {
      const receiverId = String(payload.receiverId);
      const messageData = payload.data || payload;
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("getMessage", messageData);
      }
    });

    socket.on("typing", ({ receiverId, chatId, isTyping, senderName }) => {
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", {
          chatId: Number(chatId),
          senderId: socket.userId,
          senderName: senderName || "User",
          isTyping: Boolean(isTyping),
        });
      }
    });

    // { targetUserId, offer, callType, callerName, callerAvatar }
    socket.on("call-offer", (data) => {
      const receiverSocketId = onlineUsers.get(String(data.targetUserId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("incoming-call", {
          callerId: socket.userId,
          callerSocketId: socket.id,
          callerName: data.callerName || "Unknown",
          callerAvatar: data.callerAvatar || null,
          offer: data.offer,
          callType: data.callType || "audio",
          chatId: data.chatId,
        });
      } else {
        socket.emit("call-user-offline", { targetUserId: data.targetUserId });
      }
    });

    // { targetUserId, answer }
    socket.on("call-answer", (data) => {
      const targetSocketId = onlineUsers.get(String(data.targetUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-answer", {
          answererId: socket.userId,
          answer: data.answer,
        });
      }
    });

    // { targetUserId, candidate }
    socket.on("call-ice-candidate", (data) => {
      const targetSocketId = onlineUsers.get(String(data.targetUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-ice-candidate", {
          fromUserId: socket.userId,
          candidate: data.candidate,
        });
      }
    });

    // { targetUserId }
    socket.on("call-reject", (data) => {
      const targetSocketId = onlineUsers.get(String(data.targetUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-rejected", { rejectedBy: socket.userId });
      }
    });

    // { targetUserId, callerId, receiverId, callType, duration }
    socket.on("call-end", (data) => {
      const targetSocketId = onlineUsers.get(String(data.targetUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-ended", {
          endedBy: socket.userId,
          duration: data.duration || 0,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit("call-user-disconnected", { userId: socket.userId });
        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
        console.log(`[Socket] User offline: ${socket.userId} (${reason})`);
      }
    });
  });
}
