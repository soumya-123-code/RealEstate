import prisma from "../lib/prisma.js";

const getAgent = (req) => prisma.agent.findUnique({ where: { userId: Number(req.userId) } });

export const getAgentProperties = async (req, res) => {
  try {
    const agent = await getAgent(req);
    if (!agent) return res.status(404).json({ message: "Agent profile not found." });

    const properties = await prisma.property.findMany({
      where: { agentId: agent.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, title: true, images: true, city: true, state: true,
        status: true, price: true, tokenAmount: true, propertyType: true,
        saleType: true, bedroom: true, bathroom: true, area: true,
      },
    });
    res.json({ properties });
  } catch (error) {
    console.error("getAgentProperties:", error);
    res.status(500).json({ message: "Unable to load your properties." });
  }
};

export const getAgentBookings = async (req, res) => {
  try {
    const agent = await getAgent(req);
    if (!agent) return res.status(404).json({ message: "Agent profile not found." });

    const bookings = await prisma.booking.findMany({
      where: { property: { agentId: agent.id } },
      include: {
        property: { select: { id: true, title: true, city: true, state: true } },
        user: { select: { id: true, username: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings });
  } catch (error) {
    console.error("getAgentBookings:", error);
    res.status(500).json({ message: "Unable to load your bookings." });
  }
};

export const getAgentEnquiries = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { assignedToId: Number(req.userId) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ enquiries: leads });
  } catch (error) {
    console.error("getAgentEnquiries:", error);
    res.status(500).json({ message: "Unable to load your enquiries." });
  }
};
