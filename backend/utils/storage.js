/**
 * Evidence storage strategy.
 *
 * Local/default behaviour is UNCHANGED: files are written to disk by Multer
 * (see middleware/upload.js) and served from /uploads.
 *
 * When Cloudinary credentials are present in the environment (required for
 * serverless hosts like Vercel, whose filesystem is read-only/ephemeral),
 * uploads are streamed to Cloudinary instead and the returned secure URL is
 * persisted as the evidence filePath. No business logic changes — only where
 * the bytes physically live.
 */

// Cloudinary is "configured" when either CLOUDINARY_URL is set, or the three
// discrete credentials are all present.
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET)
);

let cloudinary = null;
if (cloudinaryConfigured) {
  // Lazy require so local/dev installs never need the dependency loaded.
  cloudinary = require("cloudinary").v2;
  // CLOUDINARY_URL auto-configures the SDK; otherwise use discrete vars.
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

function isCloudStorage() {
  return cloudinaryConfigured;
}

/**
 * Upload a single Multer in-memory file to Cloudinary.
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} file
 * @returns {Promise<object>} Cloudinary upload result (has secure_url, bytes...)
 */
function uploadBufferToCloud(file) {
  return new Promise((resolve, reject) => {
    if (!cloudinary) return reject(new Error("Cloudinary is not configured"));
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "cybercrime-evidence",
        // "auto" lets Cloudinary store images as images and PDFs/zip/txt/csv
        // as raw — matching the existing allowed-types policy.
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

module.exports = { cloudinaryConfigured, isCloudStorage, uploadBufferToCloud };
