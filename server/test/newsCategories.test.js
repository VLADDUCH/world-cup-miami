import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

test("GET /api/v1/feeds/news/categories returns editorial categories", async () => {
  const response = await request(app).get("/api/v1/feeds/news/categories").expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 5);
  assert.ok(Array.isArray(response.body.categories));

  const slugs = response.body.categories.map((category) => category.slug);
  assert.ok(slugs.includes("miami-world-cup"));
  assert.ok(slugs.includes("match-day-updates"));
  assert.ok(slugs.includes("watch-parties"));
  assert.ok(slugs.includes("fan-zone-events"));
  assert.ok(slugs.includes("team-fan-communities"));
});

test("GET /api/v1/feeds/news/categories?homepageOnly=true excludes business promotions", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/news/categories?homepageOnly=true")
    .expect(200);

  assert.equal(response.body.status, "ok");

  const slugs = response.body.categories.map((category) => category.slug);
  assert.ok(!slugs.includes("business-promotions"));
});

test("GET /api/v1/feeds/news/category/:slug returns category-specific articles", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/news/category/watch-parties?limit=2")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(["live", "fallback"].includes(response.body.mode));
  assert.equal(response.body.category.slug, "watch-parties");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.articles[0].imageUrl);
});

test("GET /api/v1/feeds/news/category/:slug rejects unknown category", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/news/category/random-global-news")
    .expect(404);

  assert.ok(response.body.error);
});

test("GET /api/v1/status includes news category readiness", async () => {
  const response = await request(app).get("/api/v1/status").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.news.categoriesEndpoint, "configured");
  assert.ok(response.body.feeds.news.categoryCount >= 5);
});
