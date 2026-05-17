import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";
import {
  clearAuditEventsForTests,
  recordAuditEvent,
} from "../src/services/auditService.js";

const ADMIN_TOKEN = process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token";

test("Batch 18: audit events route requires admin token", async () => {
  clearAuditEventsForTests();

  const response = await request(app).get("/api/v1/audit/events").expect(401);

  assert.equal(response.body.status, "error");
  assert.equal(response.body.error, "Admin audit token required.");
});

test("Batch 18: admin can list audit events", async () => {
  clearAuditEventsForTests();

  recordAuditEvent({
    action: "promotion.approve",
    actor: {
      type: "admin",
      id: "admin-user",
    },
    resourceType: "promotionSubmission",
    resourceId: "promo-1",
    requestId: "request-1",
    metadata: {
      decision: "approved",
    },
  });

  const response = await request(app)
    .get("/api/v1/audit/events")
    .set("x-admin-token", ADMIN_TOKEN)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.count, 1);
  assert.equal(response.body.events.length, 1);
  assert.equal(response.body.events[0].action, "promotion.approve");
  assert.equal(response.body.events[0].resourceId, "promo-1");
});

test("Batch 18: admin can filter audit events by action and resource type", async () => {
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
    action: "lead.export",
    actor: {
      type: "admin",
      id: "admin-b",
    },
    resourceType: "lead",
    resourceId: "export",
  });

  const response = await request(app)
    .get("/api/v1/audit/events?action=lead.export&resourceType=lead")
    .set("x-admin-token", ADMIN_TOKEN)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.count, 1);
  assert.equal(response.body.events[0].action, "lead.export");
  assert.equal(response.body.events[0].resourceType, "lead");
});

test("Batch 18: admin can limit audit event results", async () => {
  clearAuditEventsForTests();

  for (let index = 0; index < 4; index += 1) {
    recordAuditEvent({
      action: "audit.limit.route",
      actor: {
        type: "admin",
        id: "admin-user",
      },
      resourceType: "testResource",
      resourceId: `resource-${index}`,
    });
  }

  const response = await request(app)
    .get("/api/v1/audit/events?limit=2")
    .set("x-admin-token", ADMIN_TOKEN)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.count, 2);
  assert.equal(response.body.events.length, 2);
});

test("Batch 18: audit stats route requires admin token", async () => {
  clearAuditEventsForTests();

  const response = await request(app).get("/api/v1/audit/stats").expect(401);

  assert.equal(response.body.status, "error");
  assert.equal(response.body.error, "Admin audit token required.");
});

test("Batch 18: admin can read audit stats", async () => {
  clearAuditEventsForTests();

  recordAuditEvent({
    action: "promotion.approve",
    actor: {
      type: "admin",
      id: "admin-user",
    },
    resourceType: "promotionSubmission",
    resourceId: "promo-1",
  });

  recordAuditEvent({
    action: "promotion.approve",
    actor: {
      type: "admin",
      id: "admin-user",
    },
    resourceType: "promotionSubmission",
    resourceId: "promo-2",
  });

  const response = await request(app)
    .get("/api/v1/audit/stats")
    .set("x-admin-token", ADMIN_TOKEN)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.stats.total, 2);
  assert.equal(response.body.stats.byAction["promotion.approve"], 2);
  assert.equal(response.body.stats.byResourceType.promotionSubmission, 2);
  assert.equal(response.body.stats.byActorType.admin, 2);
});
