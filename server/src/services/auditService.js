import crypto from "crypto";
import logger from "../config/logger.js";

const auditEvents = [];
const MAX_IN_MEMORY_AUDIT_EVENTS = 500;

function normalizeActor(actor = {}) {
  return {
    type: actor.type || "unknown",
    id: actor.id || "anonymous",
  };
}

export function recordAuditEvent({
  action,
  actor,
  resourceType,
  resourceId,
  requestId,
  status = "recorded",
  metadata = {},
}) {
  const event = {
    id: crypto.randomUUID(),
    action,
    actor: normalizeActor(actor),
    resourceType: resourceType || "unknown",
    resourceId: resourceId || "unknown",
    requestId: requestId || null,
    status,
    metadata,
    timestamp: new Date().toISOString(),
  };

  auditEvents.push(event);

  while (auditEvents.length > MAX_IN_MEMORY_AUDIT_EVENTS) {
    auditEvents.shift();
  }

  logger.audit("audit.event.recorded", event);

  return event;
}

export function getAuditEvents({ limit = 100, action, resourceType } = {}) {
  let rows = [...auditEvents].reverse();

  if (action) {
    rows = rows.filter((event) => event.action === action);
  }

  if (resourceType) {
    rows = rows.filter((event) => event.resourceType === resourceType);
  }

  return rows.slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
}

export function clearAuditEventsForTests() {
  auditEvents.length = 0;
}
