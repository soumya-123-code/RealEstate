import express from "express";
import { getCallLogs, createCallLog } from "../controllers/call.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/:chatId", verifyToken, getCallLogs);
router.post("/", verifyToken, createCallLog);

export default router;