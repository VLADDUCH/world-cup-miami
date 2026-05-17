import env from "../config/env.js";
import logger from "../config/logger.js";

function normalizeStatus(error) {
  const status = Number(error?.status || error?.statusCode || 500);

  if (!Number.isInteger(status) || status < 400 || status > 599) {
    return 500;
  }

  return status;
}

function normalizeCode(error, status) {
  if (error?.code && error.code !== "SERVER_ERROR") {
    return error.code;
  }

  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "AUTHENTICATION_REQUIRED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 413) return "REQUEST_ENTITY_TOO_LARGE";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";

  return "SERVER_ERROR";
}

function publicMessage(error, status) {
  if (error?.type === "entity.too.large") {
    return "Request body is too large.";
  }

  if (error?.code === "CORS_BLOCKED") {
    return "Request blocked by CORS policy.";
  }

  if (error?.expose === true && error?.message) {
    return error.message;
  }

  if (!env.isProduction && error?.message) {
    return error.message;
  }

  if (status === 404) return "Not found.";
  if (status === 400) return "Bad request.";
  if (status === 401) return "Authentication required.";
  if (status === 403) return "Forbidden.";
  if (status === 429) return "Too many requests.";

  return "Internal server error.";
}

export function notFoundHandler(req, res) {
  logger.warn("http.request.not_found", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    error: "Not found.",
    code: "NOT_FOUND",
    path: req.originalUrl,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
}

export function errorHandler(error, req, res, next) {
  const status = normalizeStatus(error);
  const code = normalizeCode(error, status);

  const payload = {
    error: publicMessage(error, status),
    code,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  if (!env.isProduction && env.logErrorStacks && error?.stack) {
    payload.stack = error.stack;
  }

  const logPayload = {
    requestId: req.requestId,
    status,
    code,
    message: error?.message,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    error,
  };

  if (status >= 500) {
    logger.error("http.error.server_error", logPayload);
  } else {
    logger.warn("http.error.client_error", logPayload);
  }

  res.status(status).json(payload);
}

export default errorHandler;
