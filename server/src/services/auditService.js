import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import logger, { redactLogValue } from "../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_DATA_FILE = path.resolve(__dirname, "../data/auditEvents.json");
const MAX_AUDIT_EVENTS = 5000;

function ensureAuditFile() {
  const directory = path.dirname(AUDIT_DATA_FILE);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(AUDIT_DATA_FILE)) {
    fs.writeFileSync(AUDIT_DATA_FILE, "[]\n", "utf8");
  }
}

function readAuditFile() {
  ensureAuditFile();

  try {
    const raw = fs.readFileSync(AUDIT_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    logger.error("audit.file.read_failed", {
      message: error.message,
      file: AUDIT_DATA_FILE,
    });

    return [];
  }
}

function writeAuditFile(events) {
  ensureAuditFile();

  const safeEvents = Array.isArray(events) ? events.slice(-MAX_AUDIT_EVENTS) : [];

  fs.writeFileSync(
    AUDIT_DATA_FILE,
    `${JSON.stringify(safeEvents, null, 2)}\n`,
    "utf8"
  );
}

function normalizeActor(actor = {}) {
  return {
    type: actor.type || "unknown",
    id: actor.id || "anonymous",
  };
}

function normalizeLimit(value) {
  const limit = Number(value);

  if (!Number.isFinite(limit)) {
    return 100;
  }

  return Math.max(1, Math.min(Math.trunc(limit), 500));
}

function redactMetadata(metadata = {}) {
  return redactLogValue(metadata);
}

function buildAuditEvent({
  action,
  actor,
  resourceType,
  resourceId,
  requestId,
  status = "recorded",
  metadata = {},
}) {
  return {
    id: crypto.randomUUID(),
    action: action || "unknown.action",
    actor: normalizeActor(actor),
    resourceType: resourceType || "unknown",
    resourceId: resourceId || "unknown",
    requestId: requestId || null,
    status,
    metadata: redactMetadata(metadata),
    timestamp: new Date().toISOString(),
  };
}

export function recordAuditEvent(input = {}) {
  const event = buildAuditEvent(input);
  const events = readAuditFile();

  events.push(event);
  writeAuditFile(events);

  logger.audit("audit.event.recorded", event);

  return event;
}

export function getAuditEvents({
  limit = 100,
  action,
  resourceType,
  resourceId,
  actorType,
  actorId,
  requestId,
  status,
} = {}) {
  let rows = readAuditFile();

  if (action) {
    rows = rows.filter((event) => event.action === action);
  }

  if (resourceType) {
    rows = rows.filter((event) => event.resourceType === resourceType);
  }

  if (resourceId) {
    rows = rows.filter((event) => event.resourceId === resourceId);
  }

  if (actorType) {
    rows = rows.filter((event) => event.actor?.type === actorType);
  }

  if (actorId) {
    rows = rows.filter((event) => event.actor?.id === actorId);
  }

  if (requestId) {
    rows = rows.filter((event) => event.requestId === requestId);
  }

  if (status) {
    rows = rows.filter((event) => event.status === status);
  }

  return rows
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, normalizeLimit(limit));
}

export function getAuditStats() {
  const rows = readAuditFile();

  const byAction = {};
  const byResourceType = {};
  const byActorType = {};

  for (const event of rows) {
    byAction[event.action] = (byAction[event.action] || 0) + 1;
    byResourceType[event.resourceType] =
      (byResourceType[event.resourceType] || 0) + 1;
    byActorType[event.actor?.type || "unknown"] =
      (byActorType[event.actor?.type || "unknown"] || 0) + 1;
  }

  return {
    total: rows.length,
    byAction,
    byResourceType,
    byActorType,
    latestTimestamp: rows.length > 0 ? rows[rows.length - 1].timestamp : null,
  };
}

export function clearAuditEventsForTests() {
  writeAuditFile([]);
}

export function getAuditDataFilePathForTests() {
  return AUDIT_DATA_FILE;
}
