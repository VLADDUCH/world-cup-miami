import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import request from "supertest";
import app from "../src/app.js";
import {
  publishedBusinessFromSubmission,
  publishedEventFromSubmission,
  publishedMapPinFromSubmission,
} from "../src/services/publishedPromotionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const submissionsPath = path.resolve(__dirname, "../src/data/promotionSubmissions.json");

async function seedApprovedPromotions() {
  const now = new Date().toISOString();

  const data = [
    {
      id: "approved-business-1",
      status: "approved",
      source: "test",
      createdAt: now,
      updatedAt: now,
      reviewedAt: now,
      submissionType: "business_listing",
      businessName: "Approved Miami Cafe",
      contactName: "Cafe Owner",
      email: "cafe@example.com",
      phone: "555-111-2222",
      website: "https://example.com",
      instagram: "@approvedcafe",
      category: "Restaurant",
      locationArea: "Wynwood",
      address: "123 NW 2nd Ave, Miami, FL",
      eventDate: "",
      eventTime: "",
      budgetRange: "250_500",
      message: "Approved restaurant promotion for Miami soccer fans.",
      consentToContact: true,
      reviewerName: "Admin",
      reviewNote: "Approved.",
      internalPriority: "high",
      approvedPlacement: "featured_business"
    },
    {
      id: "approved-event-1",
      status: "approved",
      source: "test",
      createdAt: now,
      updatedAt: now,
      reviewedAt: now,
      submissionType: "watch_party",
      businessName: "Approved Watch Party",
      contactName: "Event Owner",
      email: "event@example.com",
      phone: "555-333-4444",
      website: "https://example.com/watch",
      instagram: "@approvedwatch",
      category: "Sports Bar",
      locationArea: "Brickell",
      address: "456 Brickell Ave, Miami, FL",
      eventDate: "2026-06-15",
      eventTime: "18:00",
      budgetRange: "500_1000",
      message: "Approved watch party for World Cup in Miami fans.",
      consentToContact: true,
      reviewerName: "Admin",
      reviewNote: "Approved.",
      internalPriority: "urgent",
      approvedPlacement: "event_card"
    },
    {
      id: "pending-business-1",
      status: "pending_review",
      source: "test",
      createdAt: now,
      updatedAt: now,
      submissionType: "business_listing",
      businessName: "Pending Business",
      contactName: "Pending Owner",
      email: "pending@example.com",
      category: "Restaurant",
      locationArea: "Miami",
      message: "This should not be public.",
      consentToContact: true,
      approvedPlacement: "featured_business"
    }
  ];

  await fs.writeFile(submissionsPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

test("published business mapper converts approved submission into public business", () => {
  const business = publishedBusinessFromSubmission({
    id: "abc",
    businessName: "Test Business",
    category: "Restaurant",
    locationArea: "Wynwood",
    address: "Wynwood, Miami",
    message: "Great place for fans.",
    approvedPlacement: "featured_business",
  });

  assert.equal(business.id, "business-abc");
  assert.equal(business.name, "Test Business");
  assert.equal(business.featured, true);
  assert.equal(business.status, "published");
  assert.equal(business.lat, 25.8004);
});

test("published event mapper converts approved watch party into public event", () => {
  const event = publishedEventFromSubmission({
    id: "event-id",
    submissionType: "watch_party",
    businessName: "Watch Party",
    locationArea: "Brickell",
    message: "Watch party details.",
    eventDate: "2026-06-15",
    eventTime: "18:00",
    approvedPlacement: "event_card",
  });

  assert.equal(event.id, "event-event-id");
  assert.equal(event.category, "watch-parties");
  assert.equal(event.featured, true);
  assert.equal(event.lat, 25.7665);
});

test("published map pin mapper creates public map pin", () => {
  const pin = publishedMapPinFromSubmission({
    id: "pin-id",
    businessName: "Map Business",
    category: "Bar",
    locationArea: "Doral",
    approvedPlacement: "map_pin",
  });

  assert.equal(pin.id, "pin-pin-id");
  assert.equal(pin.featured, true);
  assert.equal(pin.lat, 25.8195);
});

test("GET /api/v1/promotions/published returns only approved public feeds", async () => {
  await seedApprovedPromotions();

  const response = await request(app)
    .get("/api/v1/promotions/published")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.mode, "approved_submissions");
  assert.equal(response.body.counts.approvedSubmissions, 2);
  assert.ok(response.body.businesses.length >= 1);
  assert.ok(response.body.events.length >= 1);

  const names = response.body.businesses.map((business) => business.name);
  assert.ok(names.includes("Approved Miami Cafe"));
  assert.ok(!names.includes("Pending Business"));
});

test("GET /api/v1/promotions/published/businesses returns approved businesses", async () => {
  await seedApprovedPromotions();

  const response = await request(app)
    .get("/api/v1/promotions/published/businesses")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.businesses.every((business) => business.status === "published"));
});

test("GET /api/v1/promotions/published/events returns approved events", async () => {
  await seedApprovedPromotions();

  const response = await request(app)
    .get("/api/v1/promotions/published/events")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.events.every((event) => event.status === "published"));
});

test("GET /api/v1/promotions/published/map-pins returns approved map pins", async () => {
  await seedApprovedPromotions();

  const response = await request(app)
    .get("/api/v1/promotions/published/map-pins")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.pins.every((pin) => pin.status === "published"));
});

test("GET /api/v1/promotions/published/sponsors returns sponsor placements", async () => {
  await seedApprovedPromotions();

  const response = await request(app)
    .get("/api/v1/promotions/published/sponsors")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(Array.isArray(response.body.sponsors));
});

test("GET /api/v1/status includes published promotion readiness", async () => {
  const response = await request(app)
    .get("/api/v1/status")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.promotions.publishedPromotionsEndpoint, "configured");
  assert.equal(response.body.feeds.promotions.publishedBusinessesEndpoint, "configured");
  assert.equal(response.body.feeds.promotions.publishedEventsEndpoint, "configured");
  assert.equal(response.body.feeds.promotions.publishedMapPinsEndpoint, "configured");
});
