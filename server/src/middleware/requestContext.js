import crypto from "crypto";

function sanitizeRequestId(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function requestContext(req, res, next) {
  const incomingRequestId = sanitizeRequestId(req.headers["x-request-id"]);
  const requestId = incomingRequestId || crypto.randomUUID();

  req.requestId = requestId;
  req.requestStartedAt = process.hrtime.bigint();

  res.setHeader("X-Request-Id", requestId);

  next();
}

export default requestContext;
