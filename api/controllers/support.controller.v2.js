import prisma from "../lib/prisma.js";

const MAX_TEXT = 5000;
const DEFAULT_LIMIT = 30;
const STAFF_ROLES = ["ADMIN", "STAFF"];

const canManage = (req) => {
  if (req.userRole === "ADMIN") return true;
  if (req.userRole !== "STAFF") return false;
  const permissions = Array.isArray(req.permissions) ? req.permissions : [];
  return Boolean(req.canAccessAdminPanel || permissions.includes("*") || permissions.includes("SUPPORT_CHAT"));
};

const emitToUsers = (req, ids, event, payload) => {
  const io = req.app.get("io");
  if (!io?.emitToUser) return;
  [...new Set(ids.filter(Boolean).map(Number))].forEach((id) => io.emitToUser(id, event, payload));
};

const parseJson = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const hydrateMessage = (m) => ({
  id: Number(m.id), chatId: Number(m.chatId), conversationId: Number(m.conversationId),
  senderId: Number(m.userId), userId: Number(m.userId),
  sender: { id: Number(m.userId), username: m.username, avatar: m.avatar, role: m.role },
  text: m.text || "", type: m.type || "TEXT", attachments: parseJson(m.attachments),
  readReceipts: parseJson(m.readReceipts), isInternal: Boolean(m.isInternal),
  edited: Boolean(m.editedAt), deleted: Boolean(m.deletedAt), createdAt: m.createdAt, updatedAt: m.updatedAt,
});

const conversationFromRow = (r, staffView = false) => ({
  id: Number(r.id), chatId: Number(r.chatId), customerId: Number(r.customerId),
  customerName: r.customerName, customerEmail: r.customerEmail, customerPhone: r.customerPhone, customerAvatar: r.customerAvatar,
  customer: { id: Number(r.customerId), username: r.customerName, email: r.customerEmail, phone: r.customerPhone, avatar: r.customerAvatar, isActive: Boolean(r.customerActive) },
  assignedToId: r.assignedToId == null ? null : Number(r.assignedToId),
  assignedTo: r.assignedToId == null ? null : { id: Number(r.assignedToId), username: r.assignedToName, email: r.assignedToEmail, avatar: r.assignedToAvatar, role: r.assignedToRole, isActive: Boolean(r.assignedToActive) },
  propertyId: r.propertyId == null ? null : Number(r.propertyId),
  property: r.propertyId == null ? null : { id: Number(r.propertyId), title: r.propertyName, slug: r.propertySlug, city: r.propertyCity, state: r.propertyState },
  bookingId: r.bookingId == null ? null : Number(r.bookingId), booking: r.bookingId == null ? null : { id: Number(r.bookingId), bookingStatus: r.bookingStatus },
  type: r.type, status: r.status, subject: r.subject,
  customerUnreadCount: Number(r.customerUnreadCount || 0), staffUnreadCount: Number(r.staffUnreadCount || 0),
  unreadCount: staffView ? Number(r.staffUnreadCount || 0) : Number(r.customerUnreadCount || 0),
  assignedAt: r.assignedAt, createdAt: r.createdAt, updatedAt: r.updatedAt,
  lastMessage: r.lastMessageId ? { id: Number(r.lastMessageId), senderId: Number(r.lastMessageSenderId), text: r.lastMessageText || "", createdAt: r.lastMessageAt } : null,
  lastMessageText: r.lastMessageText || "", lastMessageAt: r.lastMessageAt || null, lastMessageSenderId: r.lastMessageSenderId == null ? null : Number(r.lastMessageSenderId),
});

const rowSelect = `sc.id, sc.chatId, sc.customerId, sc.assignedToId, sc.propertyId, sc.bookingId, sc.type, sc.status, sc.subject, sc.customerUnreadCount, sc.staffUnreadCount, sc.assignedAt, sc.createdAt, sc.updatedAt, cu.username customerName, cu.email customerEmail, cu.phone customerPhone, cu.avatar customerAvatar, cu.isActive customerActive, au.username assignedToName, au.email assignedToEmail, au.avatar assignedToAvatar, au.role assignedToRole, au.isActive assignedToActive, p.title propertyName, p.slug propertySlug, p.city propertyCity, p.state propertyState, b.bookingStatus, lm.id lastMessageId, lm.userId lastMessageSenderId, lm.text lastMessageText, lm.createdAt lastMessageAt`;

const access = (req, alias = "sc") => {
  if (req.userRole === "ADMIN") return { sql: "1=1", params: [] };
  if (req.userRole === "STAFF") return { sql: `(${alias}.assignedToId = ? OR ${alias}.assignedToId IS NULL)`, params: [Number(req.userId)] };
  return { sql: `${alias}.customerId = ?`, params: [Number(req.userId)] };
};

async function getConversation(req, id) {
  const a = access(req);
  const rows = await prisma.$queryRawUnsafe(`SELECT ${rowSelect} FROM support_conversations sc JOIN User cu ON cu.id=sc.customerId LEFT JOIN User au ON au.id=sc.assignedToId LEFT JOIN Property p ON p.id=sc.propertyId LEFT JOIN Booking b ON b.id=sc.bookingId LEFT JOIN Message lm ON lm.id=(SELECT m2.id FROM Message m2 WHERE m2.chatId=sc.chatId ORDER BY m2.createdAt DESC,m2.id DESC LIMIT 1) WHERE sc.id=? AND sc.type='CUSTOMER_SUPPORT' AND ${a.sql} LIMIT 1`, id, ...a.params);
  return rows[0] ? conversationFromRow(rows[0], canManage(req)) : null;
}

async function getMessages(id, before = null, limit = DEFAULT_LIMIT) {
  const take = Math.min(100, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const params = before ? [id, before] : [id];
  const rows = await prisma.$queryRawUnsafe(`SELECT m.id,m.chatId,m.userId,m.text,m.createdAt,m.createdAt updatedAt,u.username,u.avatar,u.role,smm.attachments,smm.readReceipts,smm.isInternal,smm.deletedAt,smm.editedAt,CASE WHEN smm.attachments IS NOT NULL AND JSON_LENGTH(smm.attachments)>0 THEN 'ATTACHMENT' ELSE 'TEXT' END type FROM support_conversations sc JOIN Message m ON m.chatId=sc.chatId JOIN User u ON u.id=m.userId LEFT JOIN support_message_meta smm ON smm.messageId=m.id WHERE sc.id=? AND COALESCE(smm.isInternal,FALSE)=FALSE ${before ? "AND m.createdAt < ?" : ""} ORDER BY m.createdAt DESC,m.id DESC LIMIT ${take}`, ...params);
  return rows.reverse().map(hydrateMessage);
}

const notify = async (ids, title, message, link) => {
  const unique = [...new Set(ids.filter(Boolean).map(Number))];
  if (unique.length) await prisma.notification.createMany({ data: unique.map((userId) => ({ userId, title, message, type: "CHAT", link })) });
};

const activeSupportStaff = async () => (await prisma.user.findMany({ where: { role: { in: STAFF_ROLES }, isActive: true, OR: [{ role: "ADMIN" }, { canAccessAdminPanel: true }, { permissions: { not: null } }] }, select: { id: true } })).map((u) => u.id);

export const listCustomerConversations = async (req, res) => {
  try {
    const result = await list(req, true);
    return res.json(result.rows.map((r) => conversationFromRow(r, false)));
  } catch (e) { console.error(e); return res.status(500).json({ message: "Failed to load support conversations." }); }
};

export const listStaffConversations = async (req, res) => {
  if (!canManage(req)) return res.status(403).json({ message: "Support chat access required." });
  try {
    const result = await list(req, false);
    return res.json({ conversations: result.rows.map((r) => conversationFromRow(r, true)), pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: Math.ceil(result.total / result.limit) } });
  } catch (e) { console.error(e); return res.status(500).json({ message: "Failed to load support queue." }); }
};

async function list(req, customerOnly) {
  const clauses = ["sc.type='CUSTOMER_SUPPORT'"];
  const a = customerOnly ? { sql: "sc.customerId=?", params: [Number(req.userId)] } : access(req);
  clauses.push(a.sql);
  const params = [...a.params];
  if (!customerOnly) {
    const status = String(req.query.status || req.query.filter || "").toUpperCase();
    if (["OPEN","PENDING","RESOLVED","CLOSED"].includes(status)) { clauses.push("sc.status=?"); params.push(status); }
    const filter = String(req.query.filter || "").toLowerCase();
    if (filter === "unread") clauses.push("sc.staffUnreadCount>0");
    if (filter === "assigned") clauses.push("sc.assignedToId IS NOT NULL");
    if (filter === "unassigned") clauses.push("sc.assignedToId IS NULL");
    if (req.query.assignedToId === "unassigned") clauses.push("sc.assignedToId IS NULL");
    else if (req.query.assignedToId) { clauses.push("sc.assignedToId=?"); params.push(Number(req.query.assignedToId)); }
    if (req.query.from) { clauses.push("sc.updatedAt>=?"); params.push(new Date(req.query.from)); }
    if (req.query.to) { clauses.push("sc.updatedAt<?"); params.push(new Date(req.query.to)); }
  }
  const search = String(req.query.search || "").trim();
  if (search) { const q=`%${search}%`; clauses.push("(cu.username LIKE ? OR cu.email LIKE ? OR cu.phone LIKE ? OR p.title LIKE ? OR CAST(sc.id AS CHAR)=?)"); params.push(q,q,q,q,search); }
  const where=clauses.join(" AND ");
  const limit=Math.min(100,Math.max(1,Number(req.query.limit)||DEFAULT_LIMIT));
  const page=Math.max(1,Number(req.query.page)||1);
  const offset=(page-1)*limit;
  const count=await prisma.$queryRawUnsafe(`SELECT COUNT(*) total FROM support_conversations sc JOIN User cu ON cu.id=sc.customerId LEFT JOIN Property p ON p.id=sc.propertyId WHERE ${where}`,...params);
  const rows=await prisma.$queryRawUnsafe(`SELECT ${rowSelect} FROM support_conversations sc JOIN User cu ON cu.id=sc.customerId LEFT JOIN User au ON au.id=sc.assignedToId LEFT JOIN Property p ON p.id=sc.propertyId LEFT JOIN Booking b ON b.id=sc.bookingId LEFT JOIN Message lm ON lm.id=(SELECT m2.id FROM Message m2 WHERE m2.chatId=sc.chatId ORDER BY m2.createdAt DESC,m2.id DESC LIMIT 1) WHERE ${where} ORDER BY sc.updatedAt DESC,sc.id DESC LIMIT ${limit} OFFSET ${offset}`,...params);
  return { rows, total:Number(count[0]?.total||0), page, limit };
}

export const createCustomerConversation = async (req, res) => {
  try {
    const customerId=Number(req.userId); const {text,propertyId,bookingId,subject}=req.body||{}; const clean=typeof text==="string"?text.trim():"";
    if(!clean&&!String(subject||"").trim()) return res.status(400).json({message:"A message or subject is required."});
    if(clean.length>MAX_TEXT) return res.status(400).json({message:`Message must be ${MAX_TEXT} characters or fewer.`});
    let validPropertyId=null,validBookingId=null;
    if(propertyId!=null){const p=await prisma.property.findUnique({where:{id:Number(propertyId)},select:{id:true}});if(!p)return res.status(404).json({message:"Property not found."});validPropertyId=p.id;}
    if(bookingId!=null){const b=await prisma.booking.findFirst({where:{id:Number(bookingId),userId:customerId},select:{id:true,propertyId:true}});if(!b)return res.status(404).json({message:"Booking not found."});validBookingId=b.id;if(!validPropertyId)validPropertyId=b.propertyId;}
    let chat=null;
    try{
      chat=await prisma.chat.create({data:{participants:{create:{userId:customerId,hasSeen:true}}}});
      const insert=await prisma.$queryRawUnsafe(`INSERT INTO support_conversations(chatId,customerId,propertyId,bookingId,type,status,subject,customerUnreadCount,staffUnreadCount,createdAt,updatedAt) VALUES(?,?,?,?,'CUSTOMER_SUPPORT','OPEN',?,0,?,NOW(3),NOW(3))`,chat.id,customerId,validPropertyId,validBookingId,String(subject||"Support request").trim().slice(0,255),clean?1:0);
      const id=Number(insert.insertId);
      if(!Number.isInteger(id)||id<=0)throw new Error("support_conversations insert failed");
      if(clean){const m=await prisma.message.create({data:{chatId:chat.id,userId:customerId,text:clean}});await prisma.$executeRawUnsafe(`INSERT INTO support_message_meta(messageId,attachments,readReceipts,isInternal) VALUES(?,?,?,FALSE)`,m.id,JSON.stringify([]),JSON.stringify([{userId:customerId,readAt:new Date().toISOString()}]));await prisma.chat.update({where:{id:chat.id},data:{lastMessage:clean}});}
      const conversation=await getConversation(req,id); const staff=await activeSupportStaff();
      await notify(staff,"New support conversation",`A new customer support conversation #${id} is waiting.`,`/admin/support?conversation=${id}`);
      emitToUsers(req,staff,"support:newConversation",{conversationId:id,conversation});
      return res.status(201).json(conversation);
    }catch(inner){
      // Roll back the Chat row so a failed conversation insert doesn't leave orphans.
      if(chat)await prisma.chat.delete({where:{id:chat.id}}).catch(()=>{});
      throw inner;
    }
  }catch(e){console.error(e);return res.status(500).json({message:"Failed to create support conversation."});}
};

export const getConversationDetail = async (req,res)=>{
  try{const id=Number(req.params.id);if(!Number.isInteger(id))return res.status(400).json({message:"Invalid conversation ID."});const c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});const messages=await getMessages(id,null,DEFAULT_LIMIT);await prisma.$executeRawUnsafe(`UPDATE support_conversations SET ${canManage(req)?"staffUnreadCount=0":"customerUnreadCount=0"} WHERE id=?`,id);const notes=canManage(req)?await getNotesForConversation(id):[];return res.json({...c,messages,notes,unreadCount:canManage(req)?c.staffUnreadCount:c.customerUnreadCount});}catch(e){console.error(e);return res.status(500).json({message:"Failed to load conversation."});}
};

export const listMessages = async (req,res)=>{try{const id=Number(req.params.id);if(!(await getConversation(req,id)))return res.status(404).json({message:"Conversation not found."});const before=req.query.before?new Date(req.query.before):null;const messages=await getMessages(id,before&&!Number.isNaN(before.getTime())?before:null,req.query.limit);return res.json({messages,hasMore:messages.length>=Math.min(100,Number(req.query.limit)||DEFAULT_LIMIT)});}catch(e){console.error(e);return res.status(500).json({message:"Failed to load messages."});}};

export const sendMessage = async (req,res)=>{
  try{const id=Number(req.params.id);const c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});const text=typeof req.body?.text==="string"?req.body.text.trim():"";const attachments=Array.isArray(req.body?.attachments)?req.body.attachments:[];if(!text&&!attachments.length)return res.status(400).json({message:"Message text or attachment is required."});if(text.length>MAX_TEXT)return res.status(400).json({message:`Message must be ${MAX_TEXT} characters or fewer.`});if(c.status==="CLOSED"&&!canManage(req))return res.status(409).json({message:"This conversation is closed. Reopen it before replying."});
    const message=await prisma.message.create({data:{chatId:c.chatId,userId:Number(req.userId),text:text||""}});await prisma.$executeRawUnsafe(`INSERT INTO support_message_meta(messageId,attachments,readReceipts,isInternal) VALUES(?,?,?,FALSE)`,message.id,JSON.stringify(attachments),JSON.stringify([{userId:Number(req.userId),readAt:new Date().toISOString()}]));await prisma.chat.update({where:{id:c.chatId},data:{lastMessage:text||"[attachment]",updatedAt:new Date()}});
    const wasUnread=canManage(req)?c.customerUnreadCount:c.staffUnreadCount;const update=canManage(req)?"customerUnreadCount=customerUnreadCount+1":"staffUnreadCount=staffUnreadCount+1";await prisma.$executeRawUnsafe(`UPDATE support_conversations SET ${update},status=CASE WHEN status IN ('RESOLVED','CLOSED') THEN 'OPEN' ELSE status END,updatedAt=NOW(3) WHERE id=?`,id);
    const rows=await prisma.$queryRawUnsafe(`SELECT m.id,m.chatId,m.userId,m.text,m.createdAt,m.createdAt updatedAt,u.username,u.avatar,u.role,smm.attachments,smm.readReceipts,smm.isInternal,smm.deletedAt,smm.editedAt,'TEXT' type FROM Message m JOIN User u ON u.id=m.userId LEFT JOIN support_message_meta smm ON smm.messageId=m.id WHERE m.id=?`,message.id);const saved=hydrateMessage(rows[0]);
    if(canManage(req)){await notify([c.customerId],"Support replied",`You have a new reply in support conversation #${id}.`,`/support?conversation=${id}`);emitToUsers(req,[c.customerId,c.assignedToId,Number(req.userId)],"support:newMessage",{conversationId:id,message:saved,senderInfo:saved.sender});}
    else{const recipients=c.assignedToId?[c.assignedToId]:await activeSupportStaff();if(wasUnread===0)await notify(recipients,"New customer message",`Customer ${c.customerName} sent a new support message.`,`/admin/support?conversation=${id}`);emitToUsers(req,[...recipients,c.assignedToId,Number(req.userId)],"support:newMessage",{conversationId:id,message:saved,senderInfo:saved.sender});}
    return res.status(201).json(saved);
  }catch(e){console.error(e);return res.status(500).json({message:"Failed to send message."});}
};

export const markRead=async(req,res)=>{try{const id=Number(req.params.id);const c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});await prisma.$executeRawUnsafe(`UPDATE support_conversations SET ${canManage(req)?"staffUnreadCount=0":"customerUnreadCount=0"} WHERE id=?`,id);return res.json({ok:true});}catch(e){console.error(e);return res.status(500).json({message:"Failed to mark conversation as read."});}};

export const markMessageRead=async(req,res)=>{try{const id=Number(req.params.id),messageId=Number(req.params.messageId);const c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});const rows=await prisma.$queryRawUnsafe(`SELECT readReceipts FROM support_message_meta smm JOIN Message m ON m.id=smm.messageId WHERE smm.messageId=? AND m.chatId=?`,messageId,c.chatId);if(!rows.length)return res.status(404).json({message:"Message not found."});const next=[...parseJson(rows[0].readReceipts).filter((r)=>Number(r.userId)!==Number(req.userId)),{userId:Number(req.userId),readAt:new Date().toISOString()}];await prisma.$executeRawUnsafe(`UPDATE support_message_meta SET readReceipts=? WHERE messageId=?`,JSON.stringify(next),messageId);emitToUsers(req,[c.customerId,c.assignedToId],"support:messageRead",{conversationId:id,messageId,readBy:Number(req.userId)});return res.json({ok:true});}catch(e){console.error(e);return res.status(500).json({message:"Failed to mark message as read."});}};

const fetchMessageRow=async(messageId,conversationId)=>{
  const rows=await prisma.$queryRawUnsafe(`SELECT m.id,m.chatId,m.userId,m.text,m.createdAt,m.createdAt updatedAt,u.username,u.avatar,u.role,smm.attachments,smm.readReceipts,smm.isInternal,smm.deletedAt,smm.editedAt,CASE WHEN smm.attachments IS NOT NULL AND JSON_LENGTH(smm.attachments)>0 THEN 'ATTACHMENT' ELSE 'TEXT' END type FROM Message m JOIN User u ON u.id=m.userId JOIN support_conversations sc ON sc.chatId=m.chatId LEFT JOIN support_message_meta smm ON smm.messageId=m.id WHERE m.id=? AND sc.id=?`,messageId,conversationId);
  return rows[0]?hydrateMessage(rows[0]):null;
};

export const editMessage=async(req,res)=>{
  try{
    const id=Number(req.params.id),messageId=Number(req.params.messageId);
    const c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});
    const text=typeof req.body?.text==="string"?req.body.text.trim():"";
    if(!text)return res.status(400).json({message:"Message text is required."});
    if(text.length>MAX_TEXT)return res.status(400).json({message:`Message must be ${MAX_TEXT} characters or fewer.`});
    const rows=await prisma.$queryRawUnsafe(`SELECT m.id,m.userId,smm.deletedAt FROM Message m JOIN support_conversations sc ON sc.chatId=m.chat LEFT JOIN support_message_meta smm ON smm.messageId=m.id WHERE m.id=? AND sc.id=?`,messageId,id);
    if(!rows.length)return res.status(404).json({message:"Message not found."});
    if(Number(rows[0].userId)!==Number(req.userId))return res.status(403).json({message:"You can only edit your own messages."});
    if(rows[0].deletedAt)return res.status(400).json({message:"This message was deleted."});
    await prisma.message.update({where:{id:messageId},data:{text}});
    await prisma.$executeRawUnsafe(`INSERT INTO support_message_meta(messageId,editedAt) VALUES(?,NOW(3)) ON DUPLICATE KEY UPDATE editedAt=NOW(3)`,messageId);
    const saved=await fetchMessageRow(messageId,id);
    emitToUsers(req,[c.customerId,c.assignedToId,Number(req.userId)],"support:messageUpdated",{conversationId:id,message:saved});
    return res.json(saved);
  }catch(e){console.error(e);return res.status(500).json({message:"Failed to edit message."});}
};

export const deleteMessage=async(req,res)=>{
  try{
    const id=Number(req.params.id),messageId=Number(req.params.messageId);
    const c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});
    const rows=await prisma.$queryRawUnsafe(`SELECT m.id,m.userId FROM Message m JOIN support_conversations sc ON sc.chatId=m.chat WHERE m.id=? AND sc.id=?`,messageId,id);
    if(!rows.length)return res.status(404).json({message:"Message not found."});
    if(Number(rows[0].userId)!==Number(req.userId)&&req.userRole!=="ADMIN")return res.status(403).json({message:"You can only delete your own messages."});
    await prisma.$executeRawUnsafe(`INSERT INTO support_message_meta(messageId,deletedAt) VALUES(?,NOW(3)) ON DUPLICATE KEY UPDATE deletedAt=NOW(3)`,messageId);
    emitToUsers(req,[c.customerId,c.assignedToId,Number(req.userId)],"support:messageDeleted",{conversationId:id,messageId});
    return res.json({ok:true});
  }catch(e){console.error(e);return res.status(500).json({message:"Failed to delete message."});}
};

export const assignConversation=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Support assignment access required."});try{const id=Number(req.params.id),c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});const assigned=req.body?.assignedToId==null||req.body.assignedToId===""?null:Number(req.body.assignedToId);if(assigned!=null){const u=await prisma.user.findFirst({where:{id:assigned,role:{in:STAFF_ROLES},isActive:true},select:{id:true}});if(!u)return res.status(400).json({message:"Invalid or inactive staff member."});}await prisma.$executeRawUnsafe(`UPDATE support_conversations SET assignedToId=?,assignedAt=? WHERE id=?`,assigned,assigned?new Date():null,id);const updated=await getConversation(req,id);emitToUsers(req,[c.customerId,c.assignedToId,assigned],"support:assigned",{conversationId:id,assignedToId:assigned,assignedById:Number(req.userId),assignedTo:updated.assignedTo});return res.json({conversation:updated});}catch(e){console.error(e);return res.status(500).json({message:"Failed to assign conversation."});}};

export const updateStatus=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Support status access required."});try{const id=Number(req.params.id),status=String(req.body?.status||"").toUpperCase();if(!["OPEN","PENDING","RESOLVED","CLOSED"].includes(status))return res.status(400).json({message:"Invalid status."});const c=await getConversation(req,id);if(!c)return res.status(404).json({message:"Conversation not found."});await prisma.$executeRawUnsafe(`UPDATE support_conversations SET status=?,updatedAt=NOW(3) WHERE id=?`,status,id);emitToUsers(req,[c.customerId,c.assignedToId],"support:statusChanged",{conversationId:id,status,changedBy:Number(req.userId)});return res.json({...c,status});}catch(e){console.error(e);return res.status(500).json({message:"Failed to update conversation status."});}};

const getNotesForConversation=async(id)=>{const rows=await prisma.$queryRawUnsafe(`SELECT n.*,u.username authorName FROM support_notes n JOIN User u ON u.id=n.authorId WHERE n.conversationId=? ORDER BY n.createdAt DESC`,id);return rows.map((r)=>({...r,id:Number(r.id),conversationId:Number(r.conversationId),authorId:Number(r.authorId),author:{id:Number(r.authorId),username:r.authorName}}));};
export const getNotes=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Internal note access required."});const id=Number(req.params.id);if(!(await getConversation(req,id)))return res.status(404).json({message:"Conversation not found."});return res.json(await getNotesForConversation(id));};
export const addNote=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Internal note access required."});try{const id=Number(req.params.id);if(!(await getConversation(req,id)))return res.status(404).json({message:"Conversation not found."});const body=String(req.body?.body||"").trim();if(!body)return res.status(400).json({message:"Note text is required."});const result=await prisma.$queryRawUnsafe(`INSERT INTO support_notes(conversationId,authorId,body,pinned,createdAt,updatedAt) VALUES(?,?,?,?,NOW(3),NOW(3))`,id,Number(req.userId),body,Boolean(req.body?.pinned));const noteId=Number(result.insertId);const note=(await getNotesForConversation(id)).find((n)=>n.id===noteId);emitToUsers(req,[Number(req.userId)],"support:noteAdded",{conversationId:id,note});return res.status(201).json(note);}catch(e){console.error(e);return res.status(500).json({message:"Failed to add internal note."});}};
export const updateNote=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Internal note access required."});try{const noteId=Number(req.params.noteId);const rows=await prisma.$queryRawUnsafe(`SELECT conversationId FROM support_notes WHERE id=?`,noteId);if(!rows.length||!(await getConversation(req,Number(rows[0].conversationId))))return res.status(404).json({message:"Note not found."});const body=String(req.body?.body||"").trim();if(!body)return res.status(400).json({message:"Note text is required."});await prisma.$executeRawUnsafe(`UPDATE support_notes SET body=?,pinned=?,updatedAt=NOW(3) WHERE id=?`,body,Boolean(req.body?.pinned),noteId);return res.json((await getNotesForConversation(Number(rows[0].conversationId))).find((n)=>n.id===noteId));}catch(e){console.error(e);return res.status(500).json({message:"Failed to update note."});}};
export const deleteNote=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Internal note access required."});try{const noteId=Number(req.params.noteId);const rows=await prisma.$queryRawUnsafe(`SELECT conversationId FROM support_notes WHERE id=?`,noteId);if(!rows.length||!(await getConversation(req,Number(rows[0].conversationId))))return res.status(404).json({message:"Note not found."});await prisma.$executeRawUnsafe(`DELETE FROM support_notes WHERE id=?`,noteId);return res.json({ok:true});}catch(e){console.error(e);return res.status(500).json({message:"Failed to delete note."});}};

export const listStaff=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Support staff access required."});return res.json(await prisma.user.findMany({where:{role:{in:STAFF_ROLES},isActive:true},select:{id:true,username:true,email:true,phone:true,avatar:true,role:true},orderBy:{username:"asc"}}));};
export const stats=async(req,res)=>{if(!canManage(req))return res.status(403).json({message:"Support stats access required."});const rows=await prisma.$queryRawUnsafe(`SELECT status,COUNT(*) total FROM support_conversations WHERE type='CUSTOMER_SUPPORT' GROUP BY status`);const out={open:0,pending:0,resolved:0,closed:0,unassigned:0};rows.forEach((r)=>{out[String(r.status).toLowerCase()]=Number(r.total)});const un=await prisma.$queryRawUnsafe(`SELECT COUNT(*) total FROM support_conversations WHERE type='CUSTOMER_SUPPORT' AND assignedToId IS NULL`);out.unassigned=Number(un[0]?.total||0);return res.json(out);};

export const uploadAttachment=async(req,res)=>{
  try{
    const id=Number(req.params.id);
    const c=await getConversation(req,id);
    if(!c)return res.status(404).json({message:"Conversation not found."});
    if(!req.file)return res.status(400).json({message:"File is required."});
    return res.status(201).json({name:req.file.originalname,url:`/uploads/${req.file.filename}`,mimeType:req.file.mimetype,size:req.file.size});
  }catch(e){console.error(e);return res.status(500).json({message:"Failed to upload attachment."});}
};
export const sendAttachment=async(req,res)=>{if(!req.file)return res.status(400).json({message:"File is required."});const attachment={name:req.file.originalname,url:`/uploads/${req.file.filename}`,mimeType:req.file.mimetype,size:req.file.size};req.body={text:"",attachments:[attachment]};return sendMessage(req,res);};
