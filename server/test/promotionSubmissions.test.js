import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

test("GET /api/v1/promotions/types returns promotion submission types", async () => {
  const response = await request(app).get("/api/v1/promotions/types").expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 5);

  const slugs = response.body.types.map((type) => type.slug);
  assert.ok(slugs.includes("business_listing"));
  assert.ok(slugs.includes("flyer"));
  assert.ok(slugs.includes("watch_party"));
  assert.ok(slugs.includes("event"));
  assert.ok(slugs.includes("sponsor_inquiry"));
});

test("POST /api/v1/promotions/submit accepts valid promotion submission", async () => {
  const payload = {
    submissionType: "watch_party",
    businessName: "Test Miami Soccer Bar",
    contactName: "Test Owner",
    email: "owner@example.com",
    phone: "555-111-2222",
    website: "",
    instagram: "@testmiamisoccerbar",
    category: "Sports Bar",
    locationArea: "Wynwood",
    address: "123 Test Ave, Miami, FL",
    eventDate: "2026-06-15",
    eventTime: "18:00",
    budgetRange: "250_500",
    message: "We want to promote a World Cup watch party for Miami soccer fans.",
    consentToContact: true
  };

  const response = await request(app)
    .post("/api/v1/promotions/submit")
    .send(payload)
    .expect(201);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.submission.status, "pending_review");
  assert.equal(response.body.submission.submissionType, "watch_party");
  assert.equal(response.body.submission.businessName, payload.businessName);
});

test("POST /api/v1/promotions/submit rejects invalid promotion submission", async () => {
  const response = await request(app)
    .post("/api/v1/promotions/submit")
    .send({
      submissionType: "event",
      businessName: "x",
      contactName: "",
      email: "bad-email",
      message: "short",
      consentToContact: true
    })
    .expect(400);

  assert.ok(response.body.error);
});

test("POST /api/v1/promotions/submit requires consent to contact", async () => {
  const response = await request(app)
    .post("/api/v1/promotions/submit")
    .send({
      submissionType: "business_listing",
      businessName: "Valid Business",
      contactName: "Valid Contact",
      email: "valid@example.com",
      category: "Restaurant",
      locationArea: "Miami",
      message: "This is a valid message but consent is missing.",
      consentToContact: false
    })
    .expect(400);

  assert.ok(response.body.error);
});

test("GET /api/v1/status includes promotion submission readiness", async () => {
  const response = await request(app).get("/api/v1/status").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.promotions.promotionTypesEndpoint, "configured");
  assert.equal(response.body.feeds.promotions.promotionSubmitEndpoint, "configured");
});
