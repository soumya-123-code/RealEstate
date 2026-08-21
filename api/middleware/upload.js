import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Allowed attachment types for chat/support uploads.
// Kept in sync with the composer's accept list (images, documents, audio, video, archives).
const ALLOWED_EXTENSIONS = /jpeg|jpg|png|gif|webp|bmp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|md|json|zip|rar|7z|mp3|wav|ogg|m4a|aac|mp4|webm|mov|mkv|avi/;
const ALLOWED_MIME_PREFIXES = /^(image|application|text|audio|video)\//;

const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = ALLOWED_MIME_PREFIXES.test(file.mimetype);

  if (extOk && mimeOk) {
    return cb(null, true);
  }
  return cb(new Error("File type not allowed!"));
};

// Strict images-only filter — used for avatars / company logos, which must render in <img> tags.
const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  return cb(new Error("Only image files are allowed!"));
};

// Multer configuration (chat/support attachments)
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (matches the support composer)
  },
  fileFilter: fileFilter,
});

// Multer configuration (avatars, logos and other image-only uploads)
export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
});
