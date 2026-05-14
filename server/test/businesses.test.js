import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

test("GET /api/v1/businesses returns business listings", async () => {
  const response = await request(app).get("/api/v1/businesses").expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(Array.isArray(response.body.businesses));
});

test("GET /api/v1/businesses/featured returns featured businesses", async () => {
  const response = await request(app).get("/api/v1/businesses/featured").expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.businesses.every((business) => business.featured === true));
});

test("GET /api/v1/businesses/map-pins returns coordinates", async () => {
  const response = await request(app).get("/api/v1/businesses/map-pins").expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(Number.isFinite(response.body.pins[0].lat));
  assert.ok(Number.isFinite(response.body.pins[0].lng));
});

test("POST /api/v1/businesses/submit accepts valid submission", async () => {
  const payload = {
    businessName: "Test Soccer Cafe",
    contactName: "Test Owner",
    email: "owner@example.com",
    phone: "555-555-5555",
    category: "Restaurant",
    area: "Wynwood",
    address: "123 Test Ave, Miami, FL",
    website: "",
    instagram: "@testsoccer",
    description: "A test business submission for World Cup in Miami fan traffic.",
    promotionType: "featured_listing",
    preferredMatchDay: "June 24"
  };

  const response = await request(app)
    .post("/api/v1/businesses/submit")
    .send(payload)
    .expect(201);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.submission.status, "pending_review");
  assert.equal(response.body.submission.businessName, payload.businessName);
});

test("POST /api/v1/businesses/submit rejects invalid submission", async () => {
  const response = await request(app)
    .post("/api/v1/businesses/submit")
    .send({
      businessName: "x",
      email: "not-an-email",
      category: "",
      description: "short"
    })
    .expect(400);

  assert.ok(response.body.error);
});
