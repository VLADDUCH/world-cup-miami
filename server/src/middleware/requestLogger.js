import env from "../config/env.js";
import logger from "../config/logger.js";

function durationMs(startedAt) {
  if (!startedAt) {
    return null;
  }

  const diff = process.hrtime.bigint() - startedAt;
  return Number(diff / 1000000n);
}

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function requestLogger(req, res, next) {
  if (!env.requestLoggingEnabled) {
    return next();
  }

  res.on("finish", () => {
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("http.request.completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      routePath: req.route?.path,
      statusCode: res.statusCode,
      durationMs: durationMs(req.requestStartedAt),
      ip: clientIp(req),
      userAgent: req.headers["user-agent"],
      contentLength: res.getHeader("content-length"),
    });
  });

  return next();
}

export default requestLogger;
