import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

test("GET /api/v1/feeds/news returns streaming news articles", async () => {
  const response = await request(app).get("/api/v1/feeds/news").expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(["live", "fallback"].includes(response.body.mode));
  assert.ok(response.body.count >= 1);
  assert.ok(Array.isArray(response.body.articles));

  const article = response.body.articles[0];
  assert.ok(article.title);
  assert.ok(article.description);
  assert.ok(article.imageUrl);
});

test("GET /api/v1/feeds/news/daily returns one daily article with image", async () => {
  const response = await request(app).get("/api/v1/feeds/news/daily").expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.date);
  assert.ok(response.body.article);
  assert.ok(response.body.article.title);
  assert.ok(response.body.article.imageUrl);
});

test("GET /api/v1/feeds/news/search supports q and limit", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/news/search?q=Miami%20soccer&limit=2")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.count <= 2);
  assert.ok(Array.isArray(response.body.articles));
});

test("GET /api/v1/status includes news endpoint readiness", async () => {
  const response = await request(app).get("/api/v1/status").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.news.streamingNewsEndpoint, "configured");
  assert.equal(response.body.feeds.news.dailyArticleEndpoint, "configured");
  assert.equal(response.body.feeds.news.imageSupport, "configured");
});
