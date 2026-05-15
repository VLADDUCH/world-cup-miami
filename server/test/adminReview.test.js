import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import request from "supertest";
import app from "../src/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const submissionsPath = path.resolve(__dirname, "../src/data/promotionSubmissions.json");

const adminHeaders = {
  "x-admin-token": process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token",
};

async function seedSubmission() {
  const now = new Date().toISOString();
  const data = [
    {
      id: "test-review-submission-1",
      status: "pending_review",
      source: "test",
      createdAt: now,
      updatedAt: now,
      submissionType: "watch_party",
      businessName: "Review Test Soccer Bar",
      contactName: "Review Owner",
      email: "review@example.com",
      phone: "555-222-3333",
      website: "",
      instagram: "@reviewtest",
      category: "Sports Bar",
      locationArea: "Wynwood",
      address: "123 Review Ave, Miami, FL",
      eventDate: "2026-06-15",
      eventTime: "18:00",
      budgetRange: "250_500",
      message: "We want to promote a Miami soccer watch party.",
      consentToContact: true
    }
  ];

  await fs.writeFile(submissionsPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

test("GET /api/v1/admin/review/promotions requires admin token", async () => {
  await request(app).get("/api/v1/admin/review/promotions").expect(401);
});

test("GET /api/v1/admin/review/promotions returns review queue", async () => {
  await seedSubmission();

  const response = await request(app)
    .get("/api/v1/admin/review/promotions")
    .set(adminHeaders)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.equal(response.body.submissions[0].status, "pending_review");
});

test("GET /api/v1/admin/review/promotions/stats returns review stats", async () => {
  await seedSubmission();

  const response = await request(app)
    .get("/api/v1/admin/review/promotions/stats")
    .set(adminHeaders)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.stats.total >= 1);
  assert.ok(response.body.stats.pending_review >= 1);
});

test("POST /api/v1/admin/review/promotions/:id/approve approves submission", async () => {
  await seedSubmission();

  const response = await request(app)
    .post("/api/v1/admin/review/promotions/test-review-submission-1/approve")
    .set(adminHeaders)
    .send({
      reviewerName: "Admin Test",
      reviewNote: "Approved for featured placement.",
      internalPriority: "high",
      approvedPlacement: "featured_business"
    })
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.submission.status, "approved");
  assert.equal(response.body.submission.approvedPlacement, "featured_business");
});

test("POST /api/v1/admin/review/promotions/:id/reject rejects submission", async () => {
  await seedSubmission();

  const response = await request(app)
    .post("/api/v1/admin/review/promotions/test-review-submission-1/reject")
    .set(adminHeaders)
    .send({
      reviewerName: "Admin Test",
      reviewNote: "Rejected for test."
    })
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.submission.status, "rejected");
});

test("POST /api/v1/admin/review/promotions/:id/contacted marks submission contacted", async () => {
  await seedSubmission();

  const response = await request(app)
    .post("/api/v1/admin/review/promotions/test-review-submission-1/contacted")
    .set(adminHeaders)
    .send({
      reviewerName: "Admin Test",
      reviewNote: "Contacted business owner."
    })
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.submission.status, "contacted");
  assert.ok(response.body.submission.contactedAt);
});

test("GET /api/v1/status includes admin review queue readiness", async () => {
  const response = await request(app).get("/api/v1/status").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.promotions.adminReviewQueueEndpoint, "configured");
  assert.equal(response.body.feeds.promotions.adminReviewAuth, "x-admin-token");
});
