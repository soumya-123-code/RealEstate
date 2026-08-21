import express from "express";
import {
  listCustomerConversations,
  createCustomerConversation,
  listStaffConversations,
  getConversationDetail,
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markRead,
  markMessageRead,
  assignConversation,
  updateStatus,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  listStaff,
  stats,
  uploadAttachment,
  sendAttachment,
} from "../controllers/support.controller.v2.js";
import { verifyTokenStrict } from "../middleware/verifyToken.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();
router.use(verifyTokenStrict);

// Customer support API — customer access is enforced by the controller.
router.get("/chat/conversations", listCustomerConversations);
router.post("/chat/conversations", createCustomerConversation);
router.get("/chat/conversations/:id", getConversationDetail);
router.get("/chat/conversations/:id/messages", listMessages);
router.post("/chat/conversations/:id/messages", sendMessage);
router.patch("/chat/conversations/:id/messages/:messageId", editMessage);
router.delete("/chat/conversations/:id/messages/:messageId", deleteMessage);
router.put("/chat/conversations/:id/read", markRead);
router.post("/chat/conversations/:id/messages/:messageId/read", markMessageRead);
router.post("/chat/conversations/:id/messages/upload", upload.single("file"), uploadAttachment);
router.post("/chat/conversations/:id/attachments", upload.single("file"), sendAttachment);

// Admin/staff support queue — controller enforces role/permission and assignment scope.
router.get("/conversations", listStaffConversations);
router.get("/conversations/admin/stats", stats);
router.get("/conversations/staff", listStaff);
router.get("/conversations/:id", getConversationDetail);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", sendMessage);
router.patch("/conversations/:id/messages/:messageId", editMessage);
router.delete("/conversations/:id/messages/:messageId", deleteMessage);
router.put("/conversations/:id/read", markRead);
router.post("/conversations/:id/messages/:messageId/read", markMessageRead);
router.patch("/conversations/:id/assign", assignConversation);
router.patch("/conversations/:id/status", updateStatus);
router.get("/conversations/:id/notes", getNotes);
router.post("/conversations/:id/notes", addNote);
router.patch("/conversations/:id/notes/:noteId", updateNote);
router.delete("/conversations/:id/notes/:noteId", deleteNote);
router.post("/conversations/:id/messages/upload", upload.single("file"), uploadAttachment);

export default router;
