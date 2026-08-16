import express from "express";
import { verifyToken, requireAgent } from "../middleware/verifyToken.js";
import { getAgentProperties, getAgentBookings, getAgentEnquiries } from "../controllers/agent.controller.js";

const router = express.Router();

router.use(verifyToken, requireAgent);
router.get("/properties", getAgentProperties);
router.get("/bookings", getAgentBookings);
router.get("/enquiries", getAgentEnquiries);

export default router;
