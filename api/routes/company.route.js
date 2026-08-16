import express from "express";
import {
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  uploadPropertyImages,
} from "../controllers/company.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/**
 * @openapi
 * /api/company/settings:
 *   get:
 *     tags: [Company]
 *     summary: Get public company settings
 *     responses:
 *       200:
 *         description: Company settings returned
 */
router.get("/settings", getCompanySettings);

/**
 * @openapi
 * /api/company/settings:
 *   put:
 *     tags: [Company]
 *     summary: Update company settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put("/settings", verifyToken, updateCompanySettings);

/**
 * @openapi
 * /api/company/upload-logo:
 *   post:
 *     tags: [Company]
 *     summary: Upload company logo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 */
router.post("/upload-logo", verifyToken, upload.single("logo"), uploadCompanyLogo);

/**
 * @openapi
 * /api/company/upload-images:
 *   post:
 *     tags: [Company]
 *     summary: Upload property or company images
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Images uploaded
 */
router.post(
  "/upload-images",
  verifyToken,
  upload.array("images", 10),
  uploadPropertyImages
);

export default router;
