const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const appConfig = require("../config/appConfig");

const generalLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again shortly." },
});

const authLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please wait and retry." },
});

function requestTimeout(ms) {
  return function timeoutMiddleware(req, res, next) {
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(503).json({ message: "Request timed out. Please try again." });
      }
    });
    next();
  };
}

module.exports = {
  compression: compression(),
  helmet: helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
  generalLimiter,
  authLimiter,
  requestTimeout,
};
