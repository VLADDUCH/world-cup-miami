import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import request from "supertest";
import app from "../src/app.js";
import {
  analyticsEventsToCsv,
  createAnalyticsEvent,
  getAnalyticsEvents,
  getAnalyticsSummary,
} from "../src/services/analyticsService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const analyticsPath = path.resolve(__dirname, "../src/data/analyticsEvents.json");

const adminHeaders = {
  "x-admin-token": process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token",
};

async function resetAnalyticsEvents() {
  await fs.writeFile(analyticsPath, "[]\n", "utf8");
}

test("createAnalyticsEvent stores a valid analytics event", async () => {
  await resetAnalyticsEvents();

  const event = await createAnalyticsEvent({
    eventType: "page_view",
    page: "/",
    label: "Home",
    source: "test",
    metadata: { path: "/" },
  });

  assert.equal(event.eventType, "page_view");
  assert.equal(event.page, "/");
});

test("createAnalyticsEvent rejects invalid event type", async () => {
  await resetAnalyticsEvents();

  await assert.rejects(
    () =>
      createAnalyticsEvent({
        eventType: "bad_event",
        page: "/",
      }),
    /Invalid analytics event/
  );
});

test("getAnalyticsEvents filters by eventType", async () => {
  await resetAnalyticsEvents();

  await createAnalyticsEvent({
    eventType: "lead_submitted",
    page: "/",
    label: "Lead",
    source: "test",
  });

  const events = await getAnalyticsEvents({ eventType: "lead_submitted" });

  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, "lead_submitted");
});

test("getAnalyticsSummary returns conversion counts", async () => {
  await resetAnalyticsEvents();

  await createAnalyticsEvent({
    eventType: "advertise_cta_clicked",
    page: "/advertise",
    label: "Request placement",
    source: "test",
  });

  const summary = await getAnalyticsSummary();

  assert.equal(summary.total, 1);
  assert.equal(summary.conversions.advertise_cta_clicked, 1);
});

test("analyticsEventsToCsv exports CSV text", () => {
  const csv = analyticsEventsToCsv([
    {
      id: "analytics-1",
      eventType: "page_view",
      page: "/",
      label: "Home",
      source: "test",
      metadata: { test: true },
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ]);

  assert.ok(csv.includes("eventType"));
  assert.ok(csv.includes("page_view"));
});

test("POST /api/v1/analytics/events captures event", async () => {
  await resetAnalyticsEvents();

  const response = await request(app)
    .post("/api/v1/analytics/events")
    .send({
      eventType: "page_view",
      page: "/",
      label: "Home",
      source: "frontend",
      metadata: { pathname: "/" }
    })
    .expect(201);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.event.eventType, "page_view");
});

test("POST /api/v1/analytics/events rejects bad event", async () => {
  await request(app)
    .post("/api/v1/analytics/events")
    .send({
      eventType: "bad_event"
    })
    .expect(400);
});

test("GET /api/v1/analytics/events requires admin token", async () => {
  await request(app)
    .get("/api/v1/analytics/events")
    .expect(401);
});

test("GET /api/v1/analytics/events returns admin events", async () => {
  await resetAnalyticsEvents();

  await createAnalyticsEvent({
    eventType: "generic_click",
    page: "/site",
    label: "Miami Tee",
    source: "test",
  });

  const response = await request(app)
    .get("/api/v1/analytics/events")
    .set(adminHeaders)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
});

test("GET /api/v1/analytics/summary returns admin summary", async () => {
  await resetAnalyticsEvents();

  await createAnalyticsEvent({
    eventType: "lead_submitted",
    page: "/",
    label: "Email Capture",
    source: "test",
  });

  const response = await request(app)
    .get("/api/v1/analytics/summary")
    .set(adminHeaders)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.summary.total >= 1);
  assert.ok(response.body.summary.conversions.lead_submitted >= 1);
});

test("GET /api/v1/analytics/export.csv returns CSV for admin", async () => {
  await resetAnalyticsEvents();

  await createAnalyticsEvent({
    eventType: "event_clicked",
    page: "/",
    label: "Event Card",
    source: "test",
  });

  const response = await request(app)
    .get("/api/v1/analytics/export.csv")
    .set(adminHeaders)
    .expect(200);

  assert.ok(response.text.includes("event_clicked"));
  assert.equal(response.headers["content-type"].includes("text/csv"), true);
});

test("GET /api/v1/status includes analytics readiness", async () => {
  const response = await request(app)
    .get("/api/v1/status")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.analytics.eventCaptureEndpoint, "configured");
  assert.equal(response.body.feeds.analytics.summaryEndpoint, "configured");
});
