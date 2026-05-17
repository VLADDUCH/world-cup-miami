import env from "../config/env.js";

function normalizeStatus(error) {
  const status = Number(error?.status || error?.statusCode || 500);

  if (!Number.isInteger(status) || status < 400 || status > 599) {
    return 500;
  }

  return status;
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

  if (status === 404) {
    return "Not found.";
  }

  if (status === 400) {
    return "Bad request.";
  }

  if (status === 401) {
    return "Authentication required.";
  }

  if (status === 403) {
    return "Forbidden.";
  }

  if (status === 429) {
    return "Too many requests.";
  }

  return "Internal server error.";
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not found.",
    code: "NOT_FOUND",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}

export function errorHandler(error, req, res, next) {
  const status = normalizeStatus(error);
  const payload = {
    error: publicMessage(error, status),
    code: error?.code || "SERVER_ERROR",
    timestamp: new Date().toISOString(),
  };

  if (!env.isProduction && env.logErrorStacks && error?.stack) {
    payload.stack = error.stack;
  }

  console.error("[server:error]", {
    status,
    code: payload.code,
    message: error?.message,
    method: req.method,
    path: req.originalUrl,
  });

  res.status(status).json(payload);
}

export default errorHandler;
