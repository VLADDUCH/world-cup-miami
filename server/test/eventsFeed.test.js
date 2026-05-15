import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  normalizeTicketmasterEvent,
  normalizeEventbriteEvent,
} from "../src/services/eventsFeedService.js";

test("GET /api/v1/feeds/events returns fallback events offline", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/events?offline=true")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.mode, "fallback");
  assert.ok(response.body.count >= 1);
  assert.ok(Array.isArray(response.body.events));
  assert.ok(response.body.events[0].imageUrl);
});

test("GET /api/v1/feeds/events/categories returns event categories", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/events/categories")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 4);

  const slugs = response.body.categories.map((category) => category.slug);
  assert.ok(slugs.includes("watch-parties"));
  assert.ok(slugs.includes("fan-zone-events"));
});

test("GET /api/v1/feeds/events/categories?homepageOnly=true excludes promoted business events", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/events/categories?homepageOnly=true")
    .expect(200);

  const slugs = response.body.categories.map((category) => category.slug);
  assert.ok(!slugs.includes("promoted-business-events"));
});

test("GET /api/v1/feeds/events/category/:slug returns category events", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/events/category/watch-parties?offline=true")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.category.slug, "watch-parties");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.events[0].imageUrl);
});

test("GET /api/v1/feeds/events/category/:slug rejects unknown category", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/events/category/not-real?offline=true")
    .expect(404);

  assert.ok(response.body.error);
});

test("GET /api/v1/status includes events feed readiness", async () => {
  const response = await request(app).get("/api/v1/status").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.events.eventsFeedEndpoint, "configured");
  assert.equal(response.body.feeds.events.eventCategoriesEndpoint, "configured");
  assert.equal(response.body.feeds.events.eventImageSupport, "configured");
});

test("normalizeTicketmasterEvent maps useful Ticketmaster event fields", () => {
  const normalized = normalizeTicketmasterEvent(
    {
      id: "tm-1",
      name: "Miami Soccer Watch Party",
      url: "https://example.com/tm",
      images: [{ url: "https://example.com/image.jpg", width: 1200, height: 600 }],
      dates: { start: { localDate: "2026-06-15", localTime: "18:00:00" } },
      _embedded: {
        venues: [
          {
            name: "Miami Venue",
            city: { name: "Miami" },
            state: { stateCode: "FL" },
            address: { line1: "123 Biscayne Blvd" },
            location: { latitude: "25.7617", longitude: "-80.1918" },
          },
        ],
      },
    },
    0,
    "watch-parties"
  );

  assert.equal(normalized.provider, "ticketmaster");
  assert.equal(normalized.title, "Miami Soccer Watch Party");
  assert.equal(normalized.category, "watch-parties");
  assert.equal(normalized.imageUrl, "https://example.com/image.jpg");
  assert.equal(normalized.lat, 25.7617);
});

test("normalizeEventbriteEvent maps useful Eventbrite event fields", () => {
  const normalized = normalizeEventbriteEvent(
    {
      id: "eb-1",
      name: { text: "Miami Fan Event" },
      description: { text: "A local Miami fan event." },
      url: "https://example.com/eb",
      logo: { url: "https://example.com/logo.jpg" },
      start: { local: "2026-06-15T18:00:00" },
      venue: {
        name: "Eventbrite Venue",
        address: {
          city: "Miami",
          region: "FL",
          address_1: "456 Miami Ave",
          latitude: "25.77",
          longitude: "-80.19",
        },
      },
    },
    0,
    "fan-zone-events"
  );

  assert.equal(normalized.provider, "eventbrite");
  assert.equal(normalized.title, "Miami Fan Event");
  assert.equal(normalized.category, "fan-zone-events");
  assert.equal(normalized.imageUrl, "https://example.com/logo.jpg");
  assert.equal(normalized.lat, 25.77);
});
