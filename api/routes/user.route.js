import express from "express";
import {
  deleteUser,
  getAdminUser,
  getUser,
  getUsers,
  updateUser,
  uploadAvatar,
} from "../controllers/user.controller.js";
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/**
 * @openapi
 * /api/users/admin:
 *   get:
 *     tags: [Users]
 *     summary: Get admin user for chat
 *     responses:
 *       200:
 *         description: Admin info
 */
router.get("/admin", verifyToken, getAdminUser);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 */
router.get("/", verifyToken, verifyAdmin, getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User data
 */

router.post("/upload-avatar", verifyToken, upload.single("avatar"), uploadAvatar);
router.get("/:id", verifyToken, getUser);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User updated
 */
router.put("/:id", verifyToken, updateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/:id", verifyToken, deleteUser);

export default router;
