import rateLimit from "express-rate-limit";
import env from "./env.js";

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
  });
}
