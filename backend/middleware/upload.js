const fs = require("fs");
const path = require("path");
const multer = require("multer");
const appConfig = require("../config/appConfig");

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname).replace(/[^\w.\-]+/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}-${safeBase}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExact = new Set([
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "text/plain",
    "text/csv",
  ]);
  const allowedPrefix = ["image/"];
  const ok =
    allowedExact.has(file.mimetype) ||
    allowedPrefix.some((p) => file.mimetype.startsWith(p));

  if (!ok) {
    return cb(
      new Error("Unsupported file type. Allowed: images, PDF, ZIP, TXT, CSV."),
      false
    );
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: appConfig.upload.maxFileSizeBytes,
    files: appConfig.upload.maxFilesPerRequest,
  },
  fileFilter,
});

module.exports = upload;
