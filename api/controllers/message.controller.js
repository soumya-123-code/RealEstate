import prisma from "../lib/prisma.js";

export const addMessage = async (req, res) => {
  const tokenUserId = parseInt(req.userId, 10);
  const chatId = parseInt(req.params.chatId, 10);
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

  if (!text) return res.status(400).json({ message: "Message text is required." });
  if (text.length > 5000) return res.status(400).json({ message: "Message is too long." });

  try {
    // Verify user is part of this chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: {
            userId: tokenUserId,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found!" });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        userId: tokenUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Update chat lastMessage and mark as unread for other participants
    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        lastMessage: text,
        updatedAt: new Date(),
      },
    });

    // Mark as unread for other participants
    const others = await prisma.chatParticipant.findMany({
      where: { chatId, userId: { not: tokenUserId } },
      select: { userId: true },
    });

    await prisma.chatParticipant.updateMany({
      where: {
        chatId: chatId,
        userId: { not: tokenUserId },
      },
      data: { hasSeen: false },
    });

    if (others.length) {
      const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
      await prisma.notification.createMany({
        data: others.map(({ userId }) => ({
          userId,
          title: "New message",
          message: preview,
          type: "CHAT",
          link: "/chat",
        })),
      });
      const io = req.app.get("io");
      if (io?.emitToUser) {
        others.forEach(({ userId }) => {
          io.emitToUser(userId, "newNotification", {
            title: "New message",
            message: preview,
            type: "CHAT",
            link: "/chat",
            createdAt: new Date().toISOString(),
            isRead: false,
          });
        });
      }
    }

    res.status(200).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add message!" });
  }
};
