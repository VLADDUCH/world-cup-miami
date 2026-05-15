import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  calculateArticleRelevance,
  isEditoriallyRelevant,
} from "../src/services/newsFeedService.js";

test("news relevance accepts Miami World Cup local soccer article", () => {
  const article = {
    title: "Miami Gardens prepares for World Cup soccer watch parties near Hard Rock Stadium",
    description: "Fans in South Florida are preparing for match-day gatherings and fan zone events.",
    source: "WCIM Test",
    url: "https://example.com/miami-world-cup",
  };

  const result = calculateArticleRelevance(article, "miami-world-cup");

  assert.equal(result.accepted, true);
  assert.ok(result.reasons.includes("local_context"));
  assert.ok(result.reasons.includes("soccer_context"));
});

test("news relevance rejects unrelated padel lifestyle article", () => {
  const article = {
    title: "How padel became one of the hottest sports for the global elite",
    description: "Luxury houses and investors are entering a fast-growing leisure activity.",
    source: "Lifestyle Test",
    url: "https://example.com/padel",
  };

  assert.equal(isEditoriallyRelevant(article, "miami-world-cup"), false);
});

test("news relevance rejects generic global World Cup article with no Miami context", () => {
  const article = {
    title: "Five World Cup storylines to watch across the tournament",
    description: "A global overview of major stars and teams.",
    source: "Sports Test",
    url: "https://example.com/global-world-cup",
  };

  assert.equal(isEditoriallyRelevant(article, "miami-world-cup"), false);
});

test("news relevance accepts watch party article with Miami local context", () => {
  const article = {
    title: "Wynwood sports bar announces Miami soccer watch party",
    description: "Fans can gather in Miami for match-day viewing and local celebrations.",
    source: "Local Test",
    url: "https://example.com/wynwood-watch-party",
  };

  assert.equal(isEditoriallyRelevant(article, "watch-parties"), true);
});

test("GET /api/v1/status includes relevance filter readiness", async () => {
  const response = await request(app).get("/api/v1/status").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.news.relevanceFilter, "configured");
  assert.equal(response.body.feeds.news.providerFailureFallback, "configured");
});

test("GET /api/v1/feeds/news reports relevance filter status", async () => {
  const response = await request(app)
    .get("/api/v1/feeds/news?limit=3")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.relevanceFilter, "enabled");
  assert.ok(Number.isFinite(response.body.totalFetchedBeforeFilter));
  assert.ok(Number.isFinite(response.body.totalAfterFilter));
  assert.ok(Array.isArray(response.body.articles));
});
