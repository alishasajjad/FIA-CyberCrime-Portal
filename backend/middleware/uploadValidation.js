const fs = require("fs");
const appConfig = require("../config/appConfig");

/**
 * Reject oversized multipart requests before Multer buffers files into disk/memory.
 */
function validateUploadContentLength(req, res, next) {
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > 0 && contentLength > appConfig.upload.maxTotalUploadBytes) {
    return res.status(413).json({
      message: `Upload too large. Maximum total upload size is ${appConfig.upload.maxTotalUploadMb}MB.`,
    });
  }
  return next();
}

/**
 * After Multer runs, verify combined file size and remove files if invalid.
 */
function validateUploadedFilesTotal(req, res, next) {
  const files = req.files || [];
  if (files.length === 0) return next();

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
  if (totalBytes > appConfig.upload.maxTotalUploadBytes) {
    for (const file of files) {
      if (file.path) {
        fs.unlink(file.path, () => null);
      }
    }
    return res.status(413).json({
      message: `Combined upload exceeds ${appConfig.upload.maxTotalUploadMb}MB total limit.`,
    });
  }
  return next();
}

module.exports = {
  validateUploadContentLength,
  validateUploadedFilesTotal,
};
