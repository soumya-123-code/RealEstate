import prisma from "../lib/prisma.js";

const PAGE_SIZE = 30;
const MAX_TEXT = 5000;
const STAFF_ROLES = ["ADMIN", "STAFF"];

const isAdmin = (req) => req.userRole === "ADMIN";
const isStaff = (req) => STAFF_ROLES.includes(req.userRole);

const canManageSupport = (req) => {
  if (isAdmin(req)) return true;
  if (req.userRole !== "STAFF") return false;
  const permissions = Array.isArray(req.permissions) ? req.permissions : [];
  return Boolean(req.canAccessAdminPanel || permissions.includes("*") || permissions.includes("SUPPORT_CHAT"));
};

const conversationWhereForUser = (req, id) => ({
  id,
  customerId: Number(req.userId),
  type: "CUSTOMER_SUPPORT",
});

const staffConversationWhere = (req, id) => ({
  id,
  type: "CUSTOMER_SUPPORT",
  ...(isAdmin(req) ? {} : { OR: [{ assignedToId: Number(req.userId) }, { assignedToId: null }] }),
});

const conversationInclude = {
  customer: { select: { id: true, username: true, email: true, phone: true, avatar: true, isActive: true } },
  assignedTo: { select: { id: true, username: true, email: true, avatar: true, role: true, isActive: true } },
  property: { select: { id: true, title: true, slug: true, city: true, state: true, address: true, images: true } },
  booking: { select: { id: true, bookingStatus: true, propertyId: true, createdAt: true } },
};

const serializeMessage = (message) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  sender: message.sender,
  text: message.text,
  type: message.type,
  attachments: message.attachments,
  isInternal: message.isInternal,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  readReceipts: message.readReceipts || [],
});

const emit = (req, userIds, event, payload) => {
  const io = req.app.get("io");
  if (!io) return;
  for (const userId of [...new Set(userIds.filter(Boolean).map(Number))]) {
    io.to?.(String(userId)).emit(event, payload);
    // The application's socket server currently tracks users in memory rather
    // than joining user rooms. Emit through the helper exposed by app.js when available.
    if (typeof io.emitToUser === "function") io.emitToUser(userId, event, payload);
  }
};

const getSupportRecipients = async (conversation) => {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: STAFF_ROLES },
      isActive: true,
      OR: [
        { role: "ADMIN" },
        { canAccessAdminPanel: true },
        { permissions: { not: null } },
      ],
    },
    select: { id: true },
  });
  return [conversation.customerId, ...staff.map((s) => s.id), conversation.assignedToId].filter(Boolean);
};

export const listCustomerConversations = async (req, res) => {
  try {
    const rows = await prisma.supportConversation.findMany({
      where: conversationWhereForUser(req, undefined).id ? conversationWhereForUser(req, undefined) : { customerId: Number(req.userId), type: "CUSTOMER_SUPPORT" },
      include: { ...conversationInclude, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(rows.map((c) => ({ ...c, unreadCount: c.customerUnreadCount, lastMessage: c.messages[0] || null })));
  } catch (error) {
    console.error("listCustomerConversations", error);
    return res.status(500).json({ message: "Failed to load support conversations." });
  }
};

export const createCustomerConversation = async (req, res) => {
  try {
    const customerId = Number(req.userId);
    const { text, propertyId, bookingId, subject } = req.body || {};
    if (!text?.trim() && !subject?.trim()) return res.status(400).json({ message: "A message or subject is required." });

    const property = propertyId ? await prisma.property.findUnique({ where: { id: Number(propertyId) }, select: { id: true } }) : null;
    if (propertyId && !property) return res.status(404).json({ message: "Property not found." });
    const booking = bookingId ? await prisma.booking.findFirst({ where: { id: Number(bookingId), userId: customerId }, select: { id: true, propertyId: true } }) : null;
    if (bookingId && !booking) return res.status(404).json({ message: "Booking not found." });

    const conversation = await prisma.supportConversation.create({
      data: {
        customerId,
        type: "CUSTOMER_SUPPORT",
        status: "OPEN",
        subject: subject?.trim() || "Support request",
        propertyId: property?.id ?? booking?.propertyId ?? null,
        bookingId: booking?.id ?? null,
        customerUnreadCount: 0,
        staffUnreadCount: text?.trim() ? 1 : 0,
        messages: text?.trim() ? { create: { senderId: customerId, text: text.trim(), type: "TEXT", isInternal: false } } : undefined,
      },
      include: conversationInclude,
    });

    const recipients = await getSupportRecipients(conversation);
    emit(req, recipients, "support:newConversation", { conversationId: conversation.id, conversation });
    return res.status(201).json(conversation);
  } catch (error) {
    console.error("createCustomerConversation", error);
    return res.status(500).json({ message: "Failed to create support conversation." });
  }
};

export const listStaffConversations = async (req, res) => {
  if (!canManageSupport(req)) return res.status(403).json({ message: "Support chat access required." });
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || PAGE_SIZE));
    const status = String(req.query.status || "").toUpperCase();
    const assignedToId = req.query.assignedToId ? Number(req.query.assignedToId) : null;
    const search = String(req.query.search || "").trim();
    const where = { type: "CUSTOMER_SUPPORT" };
    if (status && ["OPEN", "PENDING", "RESOLVED", "CLOSED"].includes(status)) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (!isAdmin(req)) where.OR = [{ assignedToId: Number(req.userId) }, { assignedToId: null }];
    if (search) {
      const numericId = Number(search);
      where.AND = [{ OR: [
        { subject: { contains: search } },
        { customer: { username: { contains: search } } },
        { customer: { email: { contains: search } } },
        { customer: { phone: { contains: search } } },
        ...(Number.isInteger(numericId) ? [{ id: numericId }] : []),
      ] }];
    }
    const [total, rows] = await prisma.$transaction([
      prisma.supportConversation.count({ where }),
      prisma.supportConversation.findMany({
        where,
        include: { ...conversationInclude, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({ conversations: rows.map((c) => ({ ...c, lastMessage: c.messages[0] || null })), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("listStaffConversations", error);
    return res.status(500).json({ message: "Failed to load support queue." });
  }
};

export const getConversation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid conversation ID." });
    const where = canManageSupport(req) ? staffConversationWhere(req, id) : conversationWhereForUser(req, id);
    const conversation = await prisma.supportConversation.findFirst({
      where,
      include: {
        ...conversationInclude,
        notes: canManageSupport(req) ? { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, username: true } } } } : false,
        messages: { orderBy: { createdAt: "asc" }, take: PAGE_SIZE, include: { sender: { select: { id: true, username: true, avatar: true, role: true } } } },
      },
    });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    await prisma.supportConversation.update({ where: { id }, data: canManageSupport(req) ? { staffUnreadCount: 0 } : { customerUnreadCount: 0 } });
    return res.json({ ...conversation, messages: conversation.messages.map(serializeMessage), unreadCount: canManageSupport(req) ? conversation.staffUnreadCount : conversation.customerUnreadCount });
  } catch (error) {
    console.error("getConversation", error);
    return res.status(500).json({ message: "Failed to load conversation." });
  }
};

export const listMessages = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const before = req.query.before ? new Date(req.query.before) : null;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const conversation = await prisma.supportConversation.findFirst({ where: canManageSupport(req) ? staffConversationWhere(req, id) : conversationWhereForUser(req, id), select: { id: true } });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    const messages = await prisma.supportMessage.findMany({
      where: { conversationId: id, isInternal: false, ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { sender: { select: { id: true, username: true, avatar: true, role: true } } },
    });
    return res.json({ messages: messages.reverse().map(serializeMessage), hasMore: messages.length === limit });
  } catch (error) {
    console.error("listMessages", error);
    return res.status(500).json({ message: "Failed to load messages." });
  }
};

export const sendCustomerMessage = async (req, res) => sendMessage(req, res, false);
export const sendStaffMessage = async (req, res) => sendMessage(req, res, false);

async function sendMessage(req, res, internal) {
  try {
    const id = Number(req.params.id);
    const senderId = Number(req.userId);
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    if (!text && !attachments.length) return res.status(400).json({ message: "Message text or attachment is required." });
    if (text.length > MAX_TEXT) return res.status(400).json({ message: `Message must be ${MAX_TEXT} characters or fewer.` });

    const conversation = await prisma.supportConversation.findFirst({ where: canManageSupport(req) ? staffConversationWhere(req, id) : conversationWhereForUser(req, id), select: { id: true, customerId: true, assignedToId: true, status: true, type: true } });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    if (conversation.status === "CLOSED" && !canManageSupport(req)) return res.status(409).json({ message: "This conversation is closed. Reopen it before replying." });

    const message = await prisma.supportMessage.create({
      data: {
        conversationId: id,
        senderId,
        text: text || null,
        type: attachments.length ? "ATTACHMENT" : "TEXT",
        attachments,
        isInternal: Boolean(internal),
      },
      include: { sender: { select: { id: true, username: true, avatar: true, role: true } } },
    });

    const unreadField = canManageSupport(req) ? { customerUnreadCount: { increment: 1 } } : { staffUnreadCount: { increment: 1 } };
    await prisma.supportConversation.update({ where: { id }, data: { updatedAt: new Date(), ...(conversation.status === "RESOLVED" || conversation.status === "CLOSED" ? { status: "OPEN" } : {}), ...unreadField } });

    const recipients = await getSupportRecipients(conversation);
    emit(req, recipients, "support:newMessage", { conversationId: id, message: serializeMessage(message), senderInfo: message.sender });
    return res.status(201).json(serializeMessage(message));
  } catch (error) {
    console.error("sendMessage", error);
    return res.status(500).json({ message: "Failed to send message." });
  }
}

export const markRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const conversation = await prisma.supportConversation.findFirst({ where: canManageSupport(req) ? staffConversationWhere(req, id) : conversationWhereForUser(req, id), select: { id: true, customerId: true, assignedToId: true } });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    await prisma.supportConversation.update({ where: { id }, data: canManageSupport(req) ? { staffUnreadCount: 0 } : { customerUnreadCount: 0 } });
    return res.json({ ok: true });
  } catch (error) {
    console.error("markRead", error);
    return res.status(500).json({ message: "Failed to mark conversation as read." });
  }
};

export const markMessageRead = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const messageId = Number(req.params.messageId);
    const conversation = await prisma.supportConversation.findFirst({ where: canManageSupport(req) ? staffConversationWhere(req, conversationId) : conversationWhereForUser(req, conversationId), select: { id: true } });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    const message = await prisma.supportMessage.findFirst({ where: { id: messageId, conversationId }, select: { id: true, readReceipts: true } });
    if (!message) return res.status(404).json({ message: "Message not found." });
    const current = Array.isArray(message.readReceipts) ? message.readReceipts : [];
    const next = [...current.filter((r) => Number(r.userId) !== Number(req.userId)), { userId: Number(req.userId), readAt: new Date().toISOString() }];
    await prisma.supportMessage.update({ where: { id: messageId }, data: { readReceipts: next } });
    emit(req, [conversation.customerId, conversation.assignedToId], "support:messageRead", { conversationId, messageId, readBy: Number(req.userId) });
    return res.json({ ok: true });
  } catch (error) {
    console.error("markMessageRead", error);
    return res.status(500).json({ message: "Failed to mark message as read." });
  }
};

export const assignConversation = async (req, res) => {
  if (!canManageSupport(req)) return res.status(403).json({ message: "Support assignment access required." });
  try {
    const id = Number(req.params.id);
    const assignedToId = req.body?.assignedToId == null || req.body?.assignedToId === "" ? null : Number(req.body.assignedToId);
    if (assignedToId !== null) {
      const staff = await prisma.user.findFirst({ where: { id: assignedToId, role: { in: STAFF_ROLES }, isActive: true }, select: { id: true, username: true, email: true, avatar: true, role: true, isActive: true } });
      if (!staff) return res.status(400).json({ message: "Invalid or inactive staff member." });
    }
    const conversation = await prisma.supportConversation.update({ where: { id }, data: { assignedToId, assignedAt: assignedToId ? new Date() : null }, include: conversationInclude });
    const recipients = await getSupportRecipients(conversation);
    emit(req, recipients, "support:assigned", { conversationId: id, assignedToId, assignedById: Number(req.userId), assignedTo: conversation.assignedTo });
    return res.json({ conversation });
  } catch (error) {
    console.error("assignConversation", error);
    return res.status(500).json({ message: "Failed to assign conversation." });
  }
};

export const updateStatus = async (req, res) => {
  if (!canManageSupport(req)) return res.status(403).json({ message: "Support status access required." });
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || "").toUpperCase();
    if (!["OPEN", "PENDING", "RESOLVED", "CLOSED"].includes(status)) return res.status(400).json({ message: "Invalid status." });
    const conversation = await prisma.supportConversation.update({ where: { id }, data: { status }, include: conversationInclude });
    const recipients = await getSupportRecipients(conversation);
    emit(req, recipients, "support:statusChanged", { conversationId: id, status, changedBy: Number(req.userId) });
    return res.json(conversation);
  } catch (error) {
    console.error("updateStatus", error);
    return res.status(500).json({ message: "Failed to update conversation status." });
  }
};

export const addNote = async (req, res) => {
  if (!canManageSupport(req)) return res.status(403).json({ message: "Internal note access required." });
  try {
    const id = Number(req.params.id);
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body) return res.status(400).json({ message: "Note text is required." });
    const conversation = await prisma.supportConversation.findFirst({ where: staffConversationWhere(req, id), select: { id: true } });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    const note = await prisma.supportNote.create({ data: { conversationId: id, authorId: Number(req.userId), body, pinned: Boolean(req.body?.pinned) }, include: { author: { select: { id: true, username: true } } } });
    emit(req, [Number(req.userId)], "support:noteAdded", { conversationId: id, note });
    return res.status(201).json(note);
  } catch (error) {
    console.error("addNote", error);
    return res.status(500).json({ message: "Failed to add internal note." });
  }
};

export const listStaff = async (req, res) => {
  if (!canManageSupport(req)) return res.status(403).json({ message: "Support staff access required." });
  const staff = await prisma.user.findMany({ where: { role: { in: STAFF_ROLES }, isActive: true }, select: { id: true, username: true, email: true, phone: true, avatar: true, role: true }, orderBy: { username: "asc" } });
  return res.json(staff);
};

export const stats = async (req, res) => {
  if (!canManageSupport(req)) return res.status(403).json({ message: "Support stats access required." });
  const where = { type: "CUSTOMER_SUPPORT" };
  const [open, pending, resolved, closed, unassigned] = await Promise.all([
    prisma.supportConversation.count({ where: { ...where, status: "OPEN" } }),
    prisma.supportConversation.count({ where: { ...where, status: "PENDING" } }),
    prisma.supportConversation.count({ where: { ...where, status: "RESOLVED" } }),
    prisma.supportConversation.count({ where: { ...where, status: "CLOSED" } }),
    prisma.supportConversation.count({ where: { ...where, assignedToId: null } }),
  ]);
  return res.json({ open, pending, resolved, closed, unassigned });
};

export const uploadAttachment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const conversation = await prisma.supportConversation.findFirst({ where: canManageSupport(req) ? staffConversationWhere(req, id) : conversationWhereForUser(req, id), select: { id: true, customerId: true } });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    if (!req.file) return res.status(400).json({ message: "File is required." });
    const attachment = { name: req.file.originalname, url: `/uploads/${req.file.filename}`, mimeType: req.file.mimetype, size: req.file.size };
    const message = await prisma.supportMessage.create({ data: { conversationId: id, senderId: Number(req.userId), text: null, type: "ATTACHMENT", attachments: [attachment], isInternal: false }, include: { sender: { select: { id: true, username: true, avatar: true, role: true } } } });
    await prisma.supportConversation.update({ where: { id }, data: canManageSupport(req) ? { customerUnreadCount: { increment: 1 }, updatedAt: new Date() } : { staffUnreadCount: { increment: 1 }, updatedAt: new Date() } });
    const recipients = await getSupportRecipients(conversation);
    emit(req, recipients, "support:newMessage", { conversationId: id, message: serializeMessage(message), senderInfo: message.sender });
    return res.status(201).json(serializeMessage(message));
  } catch (error) {
    console.error("uploadAttachment", error);
    return res.status(500).json({ message: "Failed to upload attachment." });
  }
};
