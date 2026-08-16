import express from "express";
import { verifyToken, requireAgent } from "../middleware/verifyToken.js";
import { getAgentProperties, updateAgentProperty, getAgentBookings, updateAgentBooking, getAgentEnquiries } from "../controllers/agent.controller.js";

const router = express.Router();
router.use(verifyToken, requireAgent);
router.get("/properties", getAgentProperties);
router.patch("/properties/:id", updateAgentProperty);
router.get("/bookings", getAgentBookings);
router.patch("/bookings/:id", updateAgentBooking);
router.get("/enquiries", getAgentEnquiries);
export default router;
