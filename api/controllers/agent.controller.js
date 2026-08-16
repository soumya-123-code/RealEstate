import prisma from "../lib/prisma.js";

const getAgent = (req) => prisma.agent.findUnique({ where: { userId: Number(req.userId) } });
const PROPERTY_STATUSES = new Set(["AVAILABLE", "TOKEN_BOOKED", "SOLD", "RENTED", "UNAVAILABLE", "UNDER_CONSTRUCTION"]);
const BOOKING_STATUSES = new Set(["CONTACTED", "TOKEN_PAID", "BOOKING_CONFIRMED", "CANCELLED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"]);

export const getAgentProperties = async (req, res) => {
  try {
    const agent = await getAgent(req); if (!agent) return res.status(404).json({ message: "Agent profile not found." });
    const properties = await prisma.property.findMany({ where: { agentId: agent.id }, orderBy: { updatedAt: "desc" }, select: { id:true,title:true,images:true,city:true,state:true,status:true,price:true,tokenAmount:true,propertyType:true,saleType:true,bedroom:true,bathroom:true,area:true } });
    res.json({ properties });
  } catch (error) { console.error("getAgentProperties:", error); res.status(500).json({ message: "Unable to load your properties." }); }
};

export const updateAgentProperty = async (req, res) => {
  try {
    const agent = await getAgent(req); if (!agent) return res.status(404).json({ message: "Agent profile not found." });
    const id = Number(req.params.id); if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid property." });
    const property = await prisma.property.findFirst({ where: { id, agentId: agent.id }, select: { id: true } });
    if (!property) return res.status(404).json({ message: "Property not found." });
    const data = {};
    if (req.body.status !== undefined) { if (!PROPERTY_STATUSES.has(req.body.status)) return res.status(400).json({ message: "Invalid property status." }); data.status = req.body.status; }
    if (req.body.price !== undefined) { const price = Number(req.body.price); if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: "Invalid property price." }); data.price = price; }
    if (!Object.keys(data).length) return res.status(400).json({ message: "No supported property changes were provided." });
    const updated = await prisma.property.update({ where: { id }, data, select: { id:true,title:true,status:true,price:true,updatedAt:true } });
    res.json({ property: updated });
  } catch (error) { console.error("updateAgentProperty:", error); res.status(500).json({ message: "Unable to update the property." }); }
};

export const getAgentBookings = async (req, res) => {
  try {
    const agent = await getAgent(req); if (!agent) return res.status(404).json({ message: "Agent profile not found." });
    const bookings = await prisma.booking.findMany({ where: { property: { agentId: agent.id } }, include: { property: { select: { id:true,title:true,city:true,state:true } }, user: { select: { id:true,username:true,email:true,phone:true } } }, orderBy: { createdAt: "desc" } });
    res.json({ bookings });
  } catch (error) { console.error("getAgentBookings:", error); res.status(500).json({ message: "Unable to load your bookings." }); }
};

export const updateAgentBooking = async (req, res) => {
  try {
    const agent = await getAgent(req); if (!agent) return res.status(404).json({ message: "Agent profile not found." });
    const id = Number(req.params.id), status = String(req.body.status || "");
    if (!Number.isInteger(id) || !BOOKING_STATUSES.has(status)) return res.status(400).json({ message: "Invalid booking update." });
    const booking = await prisma.booking.findFirst({ where: { id, property: { agentId: agent.id } }, select: { id: true } });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    const updated = await prisma.booking.update({ where: { id }, data: { bookingStatus: status }, select: { id:true,bookingStatus:true,updatedAt:true } });
    res.json({ booking: updated });
  } catch (error) { console.error("updateAgentBooking:", error); res.status(500).json({ message: "Unable to update the booking." }); }
};

export const getAgentEnquiries = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({ where: { assignedToId: Number(req.userId) }, orderBy: { createdAt: "desc" } });
    res.json({ enquiries: leads });
  } catch (error) { console.error("getAgentEnquiries:", error); res.status(500).json({ message: "Unable to load your enquiries." }); }
};
