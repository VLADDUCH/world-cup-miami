import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

import apiKeys from "../config/apiKeys.js";
import env from "../config/env.js";
import { cachedGet } from "./externalApiClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fallbackNewsPath = path.resolve(__dirname, "../data/newsFallback.json");
const dailyNewsPath = path.resolve(__dirname, "../data/dailyNews.json");

const DEFAULT_IMAGE = "/images/wcim_soccer_ball_miami_background.png";

const querySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional().default(12),
  forceRefresh: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .optional()
    .default(false),
});

function boolValue(value) {
  return value === true || value === "true" || value === "1";
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return stripHtml(value).slice(0, 500);
}

function makeId(...parts) {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

function normalizeArticle(article, provider = "fallback", index = 0) {
  const title = safeString(article.title || article.name || "Miami football update", "Miami football update");
  const description = safeString(
    article.description || article.content || article.summary || "Latest Miami soccer and fan guide update.",
    "Latest Miami soccer and fan guide update."
  );

  const source =
    typeof article.source === "string"
      ? article.source
      : article.source?.name || article.source_name || provider;

  const url = article.url || article.link || "/";
  const imageUrl =
    article.image ||
    article.imageUrl ||
    article.urlToImage ||
    article.thumbnail ||
    article.media ||
    DEFAULT_IMAGE;

  const publishedAt =
    article.publishedAt ||
    article.published_at ||
    article.published ||
    article.date ||
    new Date().toISOString();

  return {
    id: article.id || makeId(provider, title, publishedAt, index),
    title,
    description,
    source: safeString(source, provider),
    author: safeString(article.author || ""),
    url,
    imageUrl: imageUrl || DEFAULT_IMAGE,
    publishedAt,
    provider,
    category: article.category || "streaming-news",
    tags: Array.isArray(article.tags) ? article.tags : ["miami", "soccer", "news"],
  };
}

async function getFallbackNews(limit = 12) {
  const fallback = await readJsonFile(fallbackNewsPath, []);
  return fallback.slice(0, limit).map((article, index) => normalizeArticle(article, "wcim", index));
}

async function fetchFromGNews({ query, limit, forceRefresh }) {
  if (!apiKeys.gnews) return null;

  const response = await cachedGet(
    "gnews",
    "https://gnews.io/api/v4/search",
    {
      params: {
        q: query,
        lang: process.env.WCIM_NEWS_LANGUAGE || "en",
        country: process.env.WCIM_NEWS_COUNTRY || "us",
        max: limit,
        apikey: apiKeys.gnews,
      },
      forceRefresh,
    }
  );

  const articles = Array.isArray(response.data?.articles) ? response.data.articles : [];

  return {
    provider: "gnews",
    cached: response.cached,
    fetchedAt: response.fetchedAt,
    articles: articles.map((article, index) => normalizeArticle(article, "gnews", index)),
  };
}

async function fetchFromNewsApi({ query, limit, forceRefresh }) {
  if (!apiKeys.newsApi) return null;

  const response = await cachedGet(
    "newsapi",
    "https://newsapi.org/v2/everything",
    {
      params: {
        q: query,
        language: process.env.WCIM_NEWS_LANGUAGE || "en",
        pageSize: limit,
        sortBy: "publishedAt",
        apiKey: apiKeys.newsApi,
      },
      forceRefresh,
    }
  );

  const articles = Array.isArray(response.data?.articles) ? response.data.articles : [];

  return {
    provider: "newsapi",
    cached: response.cached,
    fetchedAt: response.fetchedAt,
    articles: articles.map((article, index) => normalizeArticle(article, "newsapi", index)),
  };
}

async function getStreamingNews(options = {}) {
  const parsed = querySchema.parse(options);

  const query =
    parsed.q ||
    process.env.WCIM_NEWS_QUERY ||
    "Miami soccer OR World Cup Miami OR Miami watch party";

  const limit = parsed.limit;
  const forceRefresh = boolValue(parsed.forceRefresh);

  const providersTried = [];

  const gnews = await fetchFromGNews({ query, limit, forceRefresh });
  if (gnews) providersTried.push(gnews);

  const newsapi = await fetchFromNewsApi({ query, limit, forceRefresh });
  if (newsapi) providersTried.push(newsapi);

  const mergedArticles = providersTried
    .flatMap((providerResult) => providerResult.articles)
    .filter((article) => article.title && article.url);

  const deduped = [];
  const seen = new Set();

  for (const article of mergedArticles) {
    const key = `${article.title.toLowerCase()}|${article.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(article);
  }

  if (deduped.length > 0) {
    return {
      status: "ok",
      mode: "live",
      query,
      count: deduped.slice(0, limit).length,
      providers: providersTried.map((provider) => ({
        provider: provider.provider,
        cached: provider.cached,
        fetchedAt: provider.fetchedAt,
      })),
      articles: deduped.slice(0, limit),
    };
  }

  const fallback = await getFallbackNews(limit);

  return {
    status: "ok",
    mode: "fallback",
    query,
    count: fallback.length,
    providers: [],
    articles: fallback,
  };
}

async function getDailyArticle(options = {}) {
  const dateKey = options.date || todayKey();
  const existing = await readJsonFile(dailyNewsPath, []);
  const found = existing.find((entry) => entry.date === dateKey);

  if (found) {
    return {
      status: "ok",
      mode: found.mode || "stored",
      date: dateKey,
      article: found.article,
    };
  }

  const news = await getStreamingNews({
    q: options.q,
    limit: 10,
    forceRefresh: options.forceRefresh,
  });

  const article = news.articles[0] || (await getFallbackNews(1))[0];

  const stored = {
    date: dateKey,
    mode: news.mode,
    createdAt: new Date().toISOString(),
    article,
  };

  existing.push(stored);
  await writeJsonFile(dailyNewsPath, existing);

  return {
    status: "ok",
    mode: news.mode,
    date: dateKey,
    article,
  };
}

export {
  DEFAULT_IMAGE,
  normalizeArticle,
  getStreamingNews,
  getDailyArticle,
  getFallbackNews,
};
