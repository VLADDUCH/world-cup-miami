import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";
import {
  clearAuditEventsForTests,
  getAuditEvents,
} from "../src/services/auditService.js";

const ADMIN_TOKEN = process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token";

test("Batch 19: approving a promotion records an audit event", async () => {
  clearAuditEventsForTests();

  const response = await request(app)
    .post("/api/v1/admin/review/promotions/test-review-submission-1/approve")
    .set("x-admin-token", ADMIN_TOKEN)
    .set("x-admin-id", "batch19-admin")
    .send({
      reviewNotes: "Approved during Batch 19 audit integration test.",
    })
    .expect(200);

  assert.equal(response.body.status, "ok");

  const events = getAuditEvents({
    action: "admin.review.promotion.approve",
    resourceId: "test-review-submission-1",
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].actor.type, "admin");
  assert.equal(events[0].actor.id, "batch19-admin");
  assert.equal(events[0].resourceType, "promotionSubmission");
  assert.equal(events[0].resourceId, "test-review-submission-1");
  assert.equal(events[0].metadata.decision, "approved");
  assert.ok(events[0].requestId);
});

test("Batch 19: rejecting a promotion records an audit event", async () => {
  clearAuditEventsForTests();

  const response = await request(app)
    .post("/api/v1/admin/review/promotions/test-review-submission-1/reject")
    .set("x-admin-token", ADMIN_TOKEN)
    .set("x-admin-id", "batch19-admin")
    .send({
      reason: "Rejected during Batch 19 audit integration test.",
    })
    .expect(200);

  assert.equal(response.body.status, "ok");

  const events = getAuditEvents({
    action: "admin.review.promotion.reject",
    resourceId: "test-review-submission-1",
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].actor.id, "batch19-admin");
  assert.equal(events[0].metadata.decision, "rejected");
  assert.equal(events[0].metadata.reasonProvided, true);
});

test("Batch 19: marking a promotion contacted records an audit event", async () => {
  clearAuditEventsForTests();

  const response = await request(app)
    .post("/api/v1/admin/review/promotions/test-review-submission-1/contacted")
    .set("x-admin-token", ADMIN_TOKEN)
    .set("x-admin-id", "batch19-admin")
    .send({
      reviewNotes: "Contacted during Batch 19 audit integration test.",
    })
    .expect(200);

  assert.equal(response.body.status, "ok");

  const events = getAuditEvents({
    action: "admin.review.promotion.contacted",
    resourceId: "test-review-submission-1",
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].actor.id, "batch19-admin");
  assert.equal(events[0].metadata.decision, "contacted");
});

test("Batch 19: updating a promotion review records updated fields", async () => {
  clearAuditEventsForTests();

  const response = await request(app)
    .patch("/api/v1/admin/review/promotions/test-review-submission-1")
    .set("x-admin-token", ADMIN_TOKEN)
    .set("x-admin-id", "batch19-admin")
    .send({
      reviewNotes: "Updated during Batch 19 audit integration test.",
    })
    .expect(200);

  assert.equal(response.body.status, "ok");

  const events = getAuditEvents({
    action: "admin.review.promotion.update",
    resourceId: "test-review-submission-1",
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].actor.id, "batch19-admin");
  assert.deepEqual(events[0].metadata.updatedFields, ["reviewNotes"]);
});
