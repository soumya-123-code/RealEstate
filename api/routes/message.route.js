import express from "express";
import { addMessage } from "../controllers/message.controller.js";
import { readChat } from "../controllers/chat.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/:chatId", verifyToken, addMessage);
router.post("/:chatId/read", verifyToken, (req, res) => {
  req.params.id = req.params.chatId;
  return readChat(req, res);
});

export default router;
