import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  getAdInventory,
  getAdPackages,
  getAdSections,
  getFeaturedAdSlots,
  normalizeAdSlot,
} from "../src/services/adInventoryService.js";

test("normalizeAdSlot returns safe defaults", () => {
  const slot = normalizeAdSlot({
    id: "test-slot",
    name: "Test Slot",
    price: "500",
    featured: true,
  });

  assert.equal(slot.id, "test-slot");
  assert.equal(slot.price, 500);
  assert.equal(slot.featured, true);
  assert.equal(slot.status, "available");
});

test("getAdInventory returns ad slots", async () => {
  const slots = await getAdInventory({ limit: 3 });

  assert.ok(slots.length >= 1);
  assert.ok(slots.length <= 3);
  assert.ok(slots[0].name);
});

test("getFeaturedAdSlots returns featured slots", async () => {
  const slots = await getFeaturedAdSlots(4);

  assert.ok(slots.length >= 1);
  assert.ok(slots.every((slot) => slot.featured === true));
});

test("getAdSections returns sections", async () => {
  const sections = await getAdSections();

  assert.ok(sections.length >= 1);
  assert.ok(sections.some((section) => section.slug === "homepage"));
});

test("getAdPackages returns packages", async () => {
  const packages = await getAdPackages();

  assert.ok(packages.length >= 1);
  assert.ok(packages.some((pkg) => pkg.slug === "premium"));
});

test("GET /api/v1/ads/inventory returns ad inventory", async () => {
  const response = await request(app)
    .get("/api/v1/ads/inventory?limit=4")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(Array.isArray(response.body.slots));
});

test("GET /api/v1/ads/inventory/featured returns featured inventory", async () => {
  const response = await request(app)
    .get("/api/v1/ads/inventory/featured?limit=4")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.slots.every((slot) => slot.featured === true));
});

test("GET /api/v1/ads/inventory/sections returns sections", async () => {
  const response = await request(app)
    .get("/api/v1/ads/inventory/sections")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
});

test("GET /api/v1/ads/inventory/packages returns packages", async () => {
  const response = await request(app)
    .get("/api/v1/ads/inventory/packages")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
});

test("GET /api/v1/status includes ad inventory readiness", async () => {
  const response = await request(app)
    .get("/api/v1/status")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.ads.inventoryEndpoint, "configured");
  assert.equal(response.body.feeds.ads.featuredInventoryEndpoint, "configured");
  assert.equal(response.body.feeds.ads.salesMode, "manual_inquiry");
});
