import env from "../config/env.js";

function memorySnapshot() {
  const memory = process.memoryUsage();

  return {
    rssMb: Math.round(memory.rss / 1024 / 1024),
    heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
  };
}

function observabilitySnapshot() {
  return {
    requestIdsEnabled: true,
    requestLoggingEnabled: env.requestLoggingEnabled,
    structuredLoggingEnabled: env.logFormat === "json",
    auditLoggingEnabled: env.auditLogEnabled,
    logLevel: env.logLevel,
  };
}

export async function getLiveHealth() {
  return {
    status: "ok",
    service: "world-cup-in-miami-api",
    check: "live",
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    observability: observabilitySnapshot(),
    timestamp: new Date().toISOString(),
  };
}

export async function getReadyHealth() {
  return {
    status: "ok",
    service: "world-cup-in-miami-api",
    check: "ready",
    environment: env.nodeEnv,
    apiPrefix: env.apiPrefix,
    corsConfiguredOrigins: env.corsAllowedOrigins.length,
    requestBodyLimit: env.requestBodyLimit,
    rateLimit: {
      windowMs: env.rateLimitWindowMs,
      maxRequests: env.rateLimitMaxRequests,
    },
    security: {
      cspEnabled: env.securityHeadersCspEnabled,
      hstsEnabled: env.securityHstsEnabled,
    },
    observability: observabilitySnapshot(),
    memory: memorySnapshot(),
    timestamp: new Date().toISOString(),
  };
}
