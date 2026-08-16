import express from "express";
import {
  getChats,
  getChat,
  addChat,
  readChat,
} from "../controllers/chat.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/**
 * @openapi
 * /api/chats:
 *   get:
 *     tags: [Chat]
 *     summary: Get all chats for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat list
 */
router.get("/", verifyToken, getChats);

/**
 * @openapi
 * /api/chats/{id}:
 *   get:
 *     tags: [Chat]
 *     summary: Get a specific chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat details
 */
router.get("/:id", verifyToken, getChat);

/**
 * @openapi
 * /api/chats:
 *   post:
 *     tags: [Chat]
 *     summary: Create a new chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat created
 */
router.post("/", verifyToken, addChat);

/**
 * @openapi
 * /api/chats/read/{id}:
 *   put:
 *     tags: [Chat]
 *     summary: Mark chat as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: chat marked as read
 */
router.put("/read/:id", verifyToken, readChat);

export default router;
