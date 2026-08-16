import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = parseInt(req.userId);

  try {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId: tokenUserId },
        },
      },
      include: {
        // Include ALL participants (not filtered) so we can check hasSeen for current user
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formattedChats = chats.map((chat) => {
      // The OTHER participant(s)
      const otherParticipants = chat.participants.filter(
        (p) => p.userId !== tokenUserId
      );
      const currentParticipant = chat.participants.find(
        (p) => p.userId === tokenUserId
      );

      return {
        id: chat.id,
        receiver: otherParticipants[0]?.user || null,
        // Include ALL participants so frontend can find receiverId for socket
        participants: chat.participants.map((p) => ({
          userId: p.userId,
          hasSeen: p.hasSeen,
          user: p.user,
        })),
        lastMessage: chat.lastMessage || chat.messages[0]?.text || null,
        // hasSeen from the CURRENT user's own ChatParticipant record
        hasSeen: currentParticipant?.hasSeen ?? true,
        seenBy: chat.participants
          .filter((p) => p.hasSeen)
          .map((p) => p.userId),
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json(formattedChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const chatId = parseInt(req.params.id);

  try {
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: { userId: tokenUserId },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found!" });
    }

    // Mark current user's record as seen
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: tokenUserId },
      data: { hasSeen: true },
    });

    // Derive receiver for convenience (same shape as getChats)
    const receiver =
      chat.participants.find((p) => p.userId !== tokenUserId)?.user || null;

    res.status(200).json({
      ...chat,
      receiver,
      hasSeen: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const receiverId = parseInt(req.body.receiverId);

  try {
    if (!receiverId || isNaN(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }
    if (receiverId === tokenUserId) {
      return res.status(400).json({ message: "You cannot start a chat with yourself." });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Find existing chat between exactly these two users
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: tokenUserId } } },
          { participants: { some: { userId: receiverId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, username: true, email: true, avatar: true, phone: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) {
      const ids = existingChat.participants.map((p) => p.userId);
      if (ids.includes(tokenUserId) && ids.includes(receiverId)) {
        return res.status(200).json({
          ...existingChat,
          receiver: existingChat.participants.find((p) => p.userId !== tokenUserId)?.user,
        });
      }
    }

    const newChat = await prisma.chat.create({
      data: {
        participants: {
          create: [{ userId: tokenUserId }, { userId: receiverId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, username: true, email: true, avatar: true, phone: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      ...newChat,
      receiver: newChat.participants.find((p) => p.userId !== tokenUserId)?.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const chatId = parseInt(req.params.id);

  try {
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: tokenUserId },
      data: { hasSeen: true },
    });

    res.status(200).json({ message: "Chat marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};
