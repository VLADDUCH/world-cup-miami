import rateLimit from "express-rate-limit";
import env from "./env.js";
import logger from "./logger.js";

function rateLimitHandler(code, eventName) {
  return (req, res, next, options) => {
    logger.security(eventName, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      limit: options.limit,
      windowMs: options.windowMs,
    });

    return res.status(options.statusCode).json({
      error: options.message?.error || "Too many requests.",
      code,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  };
}

export function globalRateLimiter() {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Please try again shortly.",
      code: "RATE_LIMITED",
    },
    handler: rateLimitHandler("RATE_LIMITED", "security.rate_limit.global_exceeded"),
  });
}

export function authRateLimiter() {
  return rateLimit({
    windowMs: env.authRateLimitWindowMs,
    max: env.authRateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many authentication attempts. Please try again later.",
      code: "AUTH_RATE_LIMITED",
    },
    handler: rateLimitHandler("AUTH_RATE_LIMITED", "security.rate_limit.auth_exceeded"),
  });
}
