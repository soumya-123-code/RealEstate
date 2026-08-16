import express from "express";
import {
  getProperties,
  getFilterOptions,
  getProperty,
  generateWhatsAppLink,
  getMyBookings,
} from "../controllers/property.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/**
 * @openapi
 * /api/properties:
 *   get:
 *     tags: [Properties]
 *     summary: Get all properties
 *     responses:
 *       200:
 *         description: List of properties
 */
router.get("/", getProperties);

/**
 * @openapi
 * /api/properties/filters:
 *   get:
 *     tags: [Properties]
 *     summary: Get filter options
 *     responses:
 *       200:
 *         description: Filter data
 */
router.get("/filters", getFilterOptions);

/**
 * @openapi
 * /api/properties/my/bookings:
 *   get:
 *     tags: [Properties]
 *     summary: Get current user's bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User bookings
 */
router.get("/my/bookings", verifyToken, getMyBookings);

/**
 * @openapi
 * /api/properties/{id}:
 *   get:
 *     tags: [Properties]
 *     summary: Get a property by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Property data
 */
router.get("/:id", getProperty);

/**
 * @openapi
 * /api/properties/whatsapp-link:
 *   post:
 *     tags: [Properties]
 *     summary: Generate WhatsApp inquiry link
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp link generated
 */
router.post("/whatsapp-link", verifyToken, generateWhatsAppLink);
router.post("/token-bookings", verifyToken, generateWhatsAppLink);
router.get("/token-bookings/my", verifyToken, getMyBookings);

export default router;
