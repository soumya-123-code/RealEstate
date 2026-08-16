import prisma from "../lib/prisma.js";

export const getCallLogs = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const chatId = parseInt(req.params.chatId);

  try {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, participants: { some: { userId: tokenUserId } } },
      select: { id: true },
    });
    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    const callLogs = await prisma.callLog.findMany({
      where: { chatId },
      include: {
        caller: {
          select: { id: true, username: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 30,
    });

    res.status(200).json(callLogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get call logs!" });
  }
};

export const createCallLog = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const { chatId, callerId, receiverId, callType, status, duration } = req.body;

  try {
    if (!chatId || !callerId || !receiverId) {
      return res.status(400).json({ message: "chatId, callerId, and receiverId are required" });
    }

    const parsedChatId = Number.parseInt(chatId, 10);
    const parsedCallerId = Number.parseInt(callerId, 10);
    const parsedReceiverId = Number.parseInt(receiverId, 10);

    if (![parsedChatId, parsedCallerId, parsedReceiverId].every(Number.isInteger)) {
      return res.status(400).json({ message: "Invalid call identifiers." });
    }

    if (tokenUserId !== parsedCallerId && tokenUserId !== parsedReceiverId) {
      return res.status(403).json({ message: "Not authorized to create this call log." });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: parsedChatId,
        participants: {
          every: { userId: { in: [parsedCallerId, parsedReceiverId] } },
        },
      },
      include: { participants: { select: { userId: true } } },
    });

    if (!chat || chat.participants.length !== 2) {
      return res.status(403).json({ message: "Both call participants must belong to the chat." });
    }

    const participantIds = new Set(chat.participants.map((p) => p.userId));
    if (!participantIds.has(parsedCallerId) || !participantIds.has(parsedReceiverId)) {
      return res.status(403).json({ message: "Invalid call participants." });
    }

    const callLog = await prisma.callLog.create({
      data: {
        chatId: parsedChatId,
        callerId: parsedCallerId,
        receiverId: parsedReceiverId,
        callType: callType || "audio",
        status: status || "missed",
        duration: duration || 0,
        endedAt: duration > 0 ? new Date() : null,
      },
      include: {
        caller: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.status(200).json(callLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create call log!" });
  }
};