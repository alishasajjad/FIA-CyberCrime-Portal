const multer = require("multer");
const appConfig = require("../config/appConfig");

function formatBytesToMb(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

function notFoundHandler(req, res) {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: `File too large. Maximum per-file size is ${appConfig.upload.maxFileSizeMb}MB.`,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: `Too many files. Maximum ${appConfig.upload.maxFilesPerRequest} files per request.`,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected upload field name." });
    }
    return res.status(400).json({ message: err.message || "Upload failed" });
  }

  if (err?.message?.includes("Unsupported file type")) {
    return res.status(400).json({ message: err.message });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err?.name === "MongoServerError" && err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate record already exists." });
  }

  console.error("[Server Error]", {
    method: req.method,
    url: req.originalUrl,
    message: err?.message,
    stack: appConfig.isProduction ? undefined : err?.stack,
  });

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    message: err?.message || "Server error",
  });
}

module.exports = { notFoundHandler, errorHandler, formatBytesToMb };
