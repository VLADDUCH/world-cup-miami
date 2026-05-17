import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";

import {
  clearAuditEventsForTests,
  getAuditDataFilePathForTests,
  getAuditEvents,
  getAuditStats,
  recordAuditEvent,
} from "../src/services/auditService.js";

test("Batch 18: recordAuditEvent persists an audit event to JSON", () => {
  clearAuditEventsForTests();

  const event = recordAuditEvent({
    action: "admin.test.persist",
    actor: {
      type: "admin",
      id: "admin-user",
    },
    resourceType: "testResource",
    resourceId: "resource-1",
    requestId: "request-1",
    metadata: {
      decision: "approved",
    },
  });

  const filePath = getAuditDataFilePathForTests();
  const raw = fs.readFileSync(filePath, "utf8");
  const rows = JSON.parse(raw);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, event.id);
  assert.equal(rows[0].action, "admin.test.persist");
  assert.equal(rows[0].actor.type, "admin");
  assert.equal(rows[0].actor.id, "admin-user");
  assert.equal(rows[0].resourceType, "testResource");
  assert.equal(rows[0].resourceId, "resource-1");
  assert.equal(rows[0].requestId, "request-1");
  assert.equal(rows[0].metadata.decision, "approved");
  assert.ok(rows[0].timestamp);
});

test("Batch 18: getAuditEvents filters persisted events", () => {
  clearAuditEventsForTests();

  recordAuditEvent({
    action: "promotion.approve",
    actor: {
      type: "admin",
      id: "admin-a",
    },
    resourceType: "promotionSubmission",
    resourceId: "promo-1",
    requestId: "request-a",
    status: "recorded",
  });

  recordAuditEvent({
    action: "promotion.reject",
    actor: {
      type: "admin",
      id: "admin-b",
    },
    resourceType: "promotionSubmission",
    resourceId: "promo-2",
    requestId: "request-b",
    status: "denied",
  });

  assert.equal(getAuditEvents({ action: "promotion.approve" }).length, 1);
  assert.equal(getAuditEvents({ resourceType: "promotionSubmission" }).length, 2);
  assert.equal(getAuditEvents({ resourceId: "promo-2" }).length, 1);
  assert.equal(getAuditEvents({ actorType: "admin" }).length, 2);
  assert.equal(getAuditEvents({ actorId: "admin-b" }).length, 1);
  assert.equal(getAuditEvents({ requestId: "request-a" }).length, 1);
  assert.equal(getAuditEvents({ status: "denied" }).length, 1);
});

test("Batch 18: getAuditEvents respects limit", () => {
  clearAuditEventsForTests();

  for (let index = 0; index < 5; index += 1) {
    recordAuditEvent({
      action: "audit.limit.test",
      actor: {
        type: "test",
        id: `actor-${index}`,
      },
      resourceType: "testResource",
      resourceId: `resource-${index}`,
    });
  }

  const rows = getAuditEvents({ limit: 2 });

  assert.equal(rows.length, 2);
});

test("Batch 18: audit metadata redacts sensitive values", () => {
  clearAuditEventsForTests();

  recordAuditEvent({
    action: "audit.redaction.test",
    actor: {
      type: "admin",
      id: "admin-user",
    },
    resourceType: "secretResource",
    resourceId: "secret-1",
    metadata: {
      email: "person@example.com",
      authorization: "Bearer abc.def.ghi",
      nested: {
        message: "Contact person@example.com and use 123-45-6789",
      },
    },
  });

  const [event] = getAuditEvents({ action: "audit.redaction.test" });

  assert.equal(event.metadata.email, "[REDACTED]");
  assert.equal(event.metadata.authorization, "[REDACTED]");
  assert.equal(
    event.metadata.nested.message,
    "Contact [REDACTED_EMAIL] and use [REDACTED_SSN]"
  );
});

test("Batch 18: getAuditStats summarizes persisted audit events", () => {
  clearAuditEventsForTests();

  recordAuditEvent({
    action: "promotion.approve",
    actor: {
      type: "admin",
      id: "admin-a",
    },
    resourceType: "promotionSubmission",
    resourceId: "promo-1",
  });

  recordAuditEvent({
    action: "promotion.approve",
    actor: {
      type: "admin",
      id: "admin-a",
    },
    resourceType: "promotionSubmission",
    resourceId: "promo-2",
  });

  recordAuditEvent({
    action: "lead.export",
    actor: {
      type: "system",
      id: "system",
    },
    resourceType: "lead",
    resourceId: "export",
  });

  const stats = getAuditStats();

  assert.equal(stats.total, 3);
  assert.equal(stats.byAction["promotion.approve"], 2);
  assert.equal(stats.byAction["lead.export"], 1);
  assert.equal(stats.byResourceType.promotionSubmission, 2);
  assert.equal(stats.byResourceType.lead, 1);
  assert.equal(stats.byActorType.admin, 2);
  assert.equal(stats.byActorType.system, 1);
  assert.ok(stats.latestTimestamp);
});
