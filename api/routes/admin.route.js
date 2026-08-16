import express from "express";
import {
  getAllProperties,
  addProperty,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
  getAllBookings,
  updateBookingStatus,
  getDashboardStats,
  getStaff,
  createStaff,
  updateStaff,
  deactivateStaff,
  activateStaff,
  deleteStaff,
} from "../controllers/admin.controller.js";
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";

const router = express.Router();

/**
 * @openapi
 * /api/admin/properties:
 *   get:
 *     tags: [Admin]
 *     summary: Get all properties for admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Properties list
 */
router.get("/properties", verifyToken, getAllProperties);

/**
 * @openapi
 * /api/admin/properties:
 *   post:
 *     tags: [Admin]
 *     summary: Add a new property
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Property created
 */
router.post("/properties", verifyToken, verifyAdmin, addProperty);

/**
 * @openapi
 * /api/admin/properties/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a property
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Property updated
 */
router.put("/properties/:id", verifyToken, verifyAdmin, updateProperty);

/**
 * @openapi
 * /api/admin/properties/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update property status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/properties/:id/status", verifyToken, verifyAdmin, updatePropertyStatus);

/**
 * @openapi
 * /api/admin/properties/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a property
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Property deleted
 */
router.delete("/properties/:id", verifyToken, verifyAdmin, deleteProperty);

/**
 * @openapi
 * /api/admin/bookings:
 *   get:
 *     tags: [Admin]
 *     summary: Get all bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings list
 */
router.get("/bookings", verifyToken, getAllBookings);

/**
 * @openapi
 * /api/admin/bookings/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update booking status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking updated
 */
router.patch("/bookings/:id", verifyToken, verifyAdmin, updateBookingStatus);

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get("/dashboard", verifyToken, verifyAdmin, getDashboardStats);

/**
 * @openapi
 * /api/admin/staff:
 *   get:
 *     tags: [Admin]
 *     summary: Get staff list
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff list
 */
router.get("/staff", verifyToken, verifyAdmin, getStaff);

/**
 * @openapi
 * /api/admin/staff:
 *   post:
 *     tags: [Admin]
 *     summary: Create staff member
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff created
 */
router.post("/staff", verifyToken, verifyAdmin, createStaff);

/**
 * @openapi
 * /api/admin/staff/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update staff member
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff updated
 */
router.put("/staff/:id", verifyToken, verifyAdmin, updateStaff);

/**
 * @openapi
 * /api/admin/staff/{id}/deactivate:
 *   patch:
 *     tags: [Admin]
 *     summary: Deactivate staff member
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff deactivated
 */
router.patch("/staff/:id/deactivate", verifyToken, verifyAdmin, deactivateStaff);

/**
 * @openapi
 * /api/admin/staff/{id}/activate:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate staff member
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff activated
 */
router.patch("/staff/:id/activate", verifyToken, verifyAdmin, activateStaff);

/**
 * @openapi
 * /api/admin/staff/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete staff member
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff deleted
 */
router.delete("/staff/:id", verifyToken, verifyAdmin, deleteStaff);

export default router;
