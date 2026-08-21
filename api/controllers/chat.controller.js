import prisma from "../lib/prisma.js";

const supportChatIds = async () => {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT chatId FROM support_conversations`);
    return rows.map((row) => Number(row.chatId)).filter((id) => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
};

/**
 * Direct-message chats the current user participates in.
 * Ticket-style support conversations live in support_conversations and are
 * excluded so they are not duplicated in the generic inbox.
 */
const chatScope = async (tokenUserId) => {
  const excluded = await supportChatIds();
  return {
    AND: [
      { participants: { some: { userId: tokenUserId } } },
      ...(excluded.length ? [{ id: { notIn: excluded } }] : []),
    ],
  };
};

export const getChats = async (req, res) => {
  const tokenUserId = Number(req.userId);
  try {
    const chats = await prisma.chat.findMany({
      where: await chatScope(tokenUserId),
      include: {
        participants: { include: { user: { select: { id: true, username: true, email: true, avatar: true, phone: true, role: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
    const formatted = chats.map((chat) => {
      const others = chat.participants.filter((p) => p.userId !== tokenUserId);
      const current = chat.participants.find((p) => p.userId === tokenUserId);
      return {
        id: chat.id,
        receiver: others[0]?.user || null,
        participants: chat.participants.map((p) => ({ userId: p.userId, hasSeen: p.hasSeen, user: p.user })),
        lastMessage: chat.lastMessage || chat.messages[0]?.text || null,
        hasSeen: current?.hasSeen ?? true,
        seenBy: chat.participants.filter((p) => p.hasSeen).map((p) => p.userId),
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });
    return res.status(200).json(formatted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = Number(req.userId);
  const chatId = Number(req.params.id);
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, ...(await chatScope(tokenUserId)) },
      include: {
        messages: { orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, username: true, avatar: true, role: true } } } },
        participants: { include: { user: { select: { id: true, username: true, email: true, avatar: true, phone: true, role: true } } } },
      },
    });
    if (!chat) return res.status(404).json({ message: "Chat not found!" });
    await prisma.chatParticipant.updateMany({ where: { chatId, userId: tokenUserId }, data: { hasSeen: true } });
    return res.status(200).json({ ...chat, receiver: chat.participants.find((p) => p.userId !== tokenUserId)?.user || null, hasSeen: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = Number(req.userId);
  const receiverId = Number(req.body.receiverId);
  try {
    if (!Number.isInteger(receiverId) || receiverId <= 0) return res.status(400).json({ message: "Invalid receiver ID" });
    if (receiverId === tokenUserId) return res.status(400).json({ message: "You cannot start a chat with yourself." });
    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, username: true, email: true, avatar: true, phone: true, role: true, isActive: true } });
    if (!receiver || !receiver.isActive) return res.status(404).json({ message: "Receiver not found" });

    const excluded = await supportChatIds();
    const existing = await prisma.chat.findFirst({
      where: { AND: [
        { participants: { some: { userId: tokenUserId } } },
        { participants: { some: { userId: receiverId } } },
        { participants: { every: { userId: { in: [tokenUserId, receiverId] } } } },
        ...(excluded.length ? [{ id: { notIn: excluded } }] : []),
      ] },
      include: { participants: { include: { user: { select: { id: true, username: true, email: true, avatar: true, phone: true, role: true } } } } },
    });
    if (existing) return res.status(200).json({ ...existing, receiver: existing.participants.find((p) => p.userId !== tokenUserId)?.user });

    const newChat = await prisma.chat.create({ data: { participants: { create: [{ userId: tokenUserId, hasSeen: true }, { userId: receiverId, hasSeen: true }] } }, include: { participants: { include: { user: { select: { id: true, username: true, email: true, avatar: true, phone: true, role: true } } } } } });
    return res.status(201).json({ ...newChat, receiver: receiver });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = Number(req.userId);
  const chatId = Number(req.params.id);
  try {
    const chat = await prisma.chat.findFirst({ where: { id: chatId, ...(await chatScope(tokenUserId)) }, select: { id: true } });
    if (!chat) return res.status(404).json({ message: "Chat not found!" });
    await prisma.chatParticipant.updateMany({ where: { chatId, userId: tokenUserId }, data: { hasSeen: true } });
    return res.status(200).json({ message: "Chat marked as read" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to read chat!" });
  }
};
