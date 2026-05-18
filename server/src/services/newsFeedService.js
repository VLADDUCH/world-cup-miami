import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

import apiKeys from "../config/apiKeys.js";
import { cachedGet } from "./externalApiClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fallbackNewsPath = path.resolve(__dirname, "../data/newsFallback.json");
const dailyNewsPath = path.resolve(__dirname, "../data/dailyNews.json");
const categoriesPath = path.resolve(__dirname, "../data/newsCategories.json");

const DEFAULT_IMAGE = "/images/hero-skyline.jpg";

const LOCAL_CONTEXT_TERMS = [
  "miami",
  "miami gardens",
  "hard rock stadium",
  "south florida",
  "broward",
  "dade",
  "miami-dade",
  "bayfront",
  "wynwood",
  "brickell",
  "doral",
  "coral gables",
  "coconut grove",
  "south beach",
];

const SOCCER_CONTEXT_TERMS = [
  "world cup",
  "2026 world cup",
  "fifa",
  "fifa world cup",
  "soccer",
  "football",
  "match",
  "fixture",
  "stadium",
  "fan zone",
  "watch party",
  "supporters",
  "tickets",
  "ticket",
  "brazil",
  "colombia",
  "portugal",
  "uruguay",
  "scotland",
  "saudi arabia",
  "cape verde",
];

const FAN_ACTIVITY_TERMS = [
  "watch party",
  "fan zone",
  "fan festival",
  "sports bar",
  "restaurant",
  "nightlife",
  "viewing party",
  "public event",
  "meetup",
  "tailgate",
];

const TEAM_COMMUNITY_TERMS = [
  "brazil",
  "brazilian",
  "colombia",
  "colombian",
  "portugal",
  "portuguese",
  "uruguay",
  "uruguayan",
  "scotland",
  "scottish",
  "saudi arabia",
  "saudi",
  "cape verde",
  "cape verdean",
];

const HARD_EXCLUDE_TERMS = [
  "padel",
  "pickleball",
  "tennis",
  "golf",
  "basketball",
  "nba",
  "nfl",
  "baseball",
  "mlb",
  "hockey",
  "ufc",
  "mma",
  "formula 1",
  "f1",
  "luxury house",
  "luxury houses",
];

const WORLD_CUP_CORE_TERMS = [
  "world cup",
  "2026 world cup",
  "fifa",
  "fifa world cup",
];

const MIAMI_HOST_CONTEXT_TERMS = [
  "miami",
  "miami gardens",
  "hard rock stadium",
  "south florida",
  "world cup miami",
  "fifa miami",
];

const MIAMI_MATCH_TEAM_TERMS = [
  "saudi arabia",
  "uruguay",
  "cape verde",
  "scotland",
  "brazil",
  "colombia",
  "portugal",
];

const EXCLUDED_NON_TOURNAMENT_LOCAL_TERMS = [
  "inter miami",
  "mls",
  "major league soccer",
];

const MESSI_TERMS = [
  "messi",
  "lionel messi",
];

const querySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().min(1).max(80).optional(),
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

function articleSearchText(article = {}) {
  const source =
    typeof article.source === "string"
      ? article.source
      : article.source?.name || article.source_name || "";

  return [
    article.title,
    article.description,
    article.content,
    article.summary,
    source,
    article.author,
    article.url,
    Array.isArray(article.tags) ? article.tags.join(" ") : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}


function articleFreshnessScore(article = {}) {
  const publishedAt = article.publishedAt || article.date || article.createdAt;
  const timestamp = publishedAt ? new Date(publishedAt).getTime() : 0;

  if (!Number.isFinite(timestamp) || timestamp <= 0) return 0;

  const ageHours = Math.max(0, (Date.now() - timestamp) / 36e5);

  if (ageHours <= 24) return 4;
  if (ageHours <= 72) return 3;
  if (ageHours <= 24 * 7) return 2;
  if (ageHours <= 24 * 21) return 1;

  return 0;
}

function hasWorldCupCore(article = {}) {
  return containsAny(articleSearchText(article), WORLD_CUP_CORE_TERMS);
}

function hasMiamiHostContext(article = {}) {
  return containsAny(articleSearchText(article), MIAMI_HOST_CONTEXT_TERMS);
}

function hasMiamiMatchTeamContext(article = {}) {
  return containsAny(articleSearchText(article), MIAMI_MATCH_TEAM_TERMS);
}

function isDisallowedInterMiamiOrMessiArticle(article = {}) {
  const text = articleSearchText(article);
  const mentionsExcludedLocalClub = containsAny(text, EXCLUDED_NON_TOURNAMENT_LOCAL_TERMS);
  const mentionsMessi = containsAny(text, MESSI_TERMS);

  if (!mentionsExcludedLocalClub && !mentionsMessi) return false;

  const clearlyWorldCupInMiami =
    hasWorldCupCore(article) &&
    hasMiamiHostContext(article) &&
    !text.includes("inter miami cf") &&
    !text.includes("mls comeback") &&
    !text.includes("mls denied");

  return !clearlyWorldCupInMiami;
}

function articleHasFreshWorldCupValue(article = {}) {
  if (articleFreshnessScore(article) < 2) return false;
  if (!hasWorldCupCore(article)) return false;
  if (isDisallowedInterMiamiOrMessiArticle(article)) return false;

  return hasMiamiHostContext(article) || hasMiamiMatchTeamContext(article);
}

function sortArticlesForHomepage(articles = []) {
  return [...articles].sort((a, b) => {
    const scoreA =
      Number(a.editorial?.score || 0) * 10 +
      articleFreshnessScore(a) * 4 +
      Number(Boolean(a.imageUrl)) * 2;

    const scoreB =
      Number(b.editorial?.score || 0) * 10 +
      articleFreshnessScore(b) * 4 +
      Number(Boolean(b.imageUrl)) * 2;

    if (scoreB !== scoreA) return scoreB - scoreA;

    return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
  });
}

function calculateArticleRelevance(article = {}, categorySlug = "") {
  const text = articleSearchText(article);

  const hasLocalContext = containsAny(text, LOCAL_CONTEXT_TERMS);
  const hasSoccerContext = containsAny(text, SOCCER_CONTEXT_TERMS);
  const hasFanActivity = containsAny(text, FAN_ACTIVITY_TERMS);
  const hasTeamCommunity = containsAny(text, TEAM_COMMUNITY_TERMS);
  const hasHardExclude = containsAny(text, HARD_EXCLUDE_TERMS);

  const reasons = [];

  if (hasLocalContext) reasons.push("local_context");
  if (hasSoccerContext) reasons.push("soccer_context");
  if (hasFanActivity) reasons.push("fan_activity");
  if (hasTeamCommunity) reasons.push("team_community");
  if (hasHardExclude) reasons.push("hard_exclude_term");

  if (hasHardExclude && !(hasLocalContext && hasSoccerContext) && !articleHasFreshWorldCupValue(article)) {
    return {
      accepted: false,
      score: 0,
      reasons,
      rule: "Rejected because unrelated sport/lifestyle terms appeared without enough Miami soccer context.",
    };
  }

  if (categorySlug === "watch-parties") {
    const accepted = hasLocalContext && (hasSoccerContext || hasFanActivity);
    return {
      accepted,
      score: Number(hasLocalContext) + Number(hasSoccerContext) + Number(hasFanActivity),
      reasons,
      rule: "Watch party content must connect Miami/local context to soccer or fan gathering activity.",
    };
  }

  if (categorySlug === "fan-zone-events") {
    const accepted = hasLocalContext && (hasSoccerContext || hasFanActivity);
    return {
      accepted,
      score: Number(hasLocalContext) + Number(hasSoccerContext) + Number(hasFanActivity),
      reasons,
      rule: "Fan zone content must connect Miami/local context to soccer or public fan activity.",
    };
  }

  if (categorySlug === "team-fan-communities") {
    const accepted = hasLocalContext && hasSoccerContext && hasTeamCommunity;
    return {
      accepted,
      score: Number(hasLocalContext) + Number(hasSoccerContext) + Number(hasTeamCommunity),
      reasons,
      rule: "Team fan community content must connect Miami/local context to soccer and target team communities.",
    };
  }

  if (categorySlug === "match-day-updates") {
    const accepted = hasLocalContext && hasSoccerContext;
    return {
      accepted,
      score: Number(hasLocalContext) + Number(hasSoccerContext),
      reasons,
      rule: "Match-day content must connect Miami/local context to soccer, match, or stadium activity.",
    };
  }

  const accepted = hasLocalContext && hasSoccerContext;

  return {
    accepted,
    score: Number(hasLocalContext) + Number(hasSoccerContext),
    reasons,
    rule: "Default editorial rule requires Miami/local context plus soccer/World Cup context.",
  };
}

function isEditoriallyRelevant(article = {}, categorySlug = "") {
  return calculateArticleRelevance(article, categorySlug).accepted;
}

function normalizeArticle(article, provider = "fallback", index = 0, forcedCategory = "") {
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

  const relevance = calculateArticleRelevance(article, forcedCategory || article.category || "");

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
    category: forcedCategory || article.category || "miami-world-cup",
    tags: Array.isArray(article.tags) ? article.tags : [],
    editorial: {
      accepted: relevance.accepted,
      score: relevance.score,
      reasons: relevance.reasons,
    },
  };
}

async function getNewsCategories(options = {}) {
  const categories = await readJsonFile(categoriesPath, []);
  const sorted = [...categories].sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999));

  if (options.homepageOnly) {
    return sorted.filter((category) => category.showOnHomepage === true);
  }

  return sorted;
}

async function getNewsCategoryBySlug(slug) {
  const categories = await getNewsCategories();
  return categories.find((category) => category.slug === slug) || null;
}

async function getFallbackNews(limit = 12, categorySlug = "") {
  const fallback = await readJsonFile(fallbackNewsPath, []);
  const filtered = categorySlug
    ? fallback.filter((article) => article.category === categorySlug)
    : fallback.filter((article) => article.category !== "business-promotions");

  const source = filtered.length > 0 ? filtered : fallback;

  return source
    .slice(0, limit)
    .map((article, index) => normalizeArticle(article, "wcim", index, categorySlug || article.category));
}

async function fetchFromGNews({ query, limit, forceRefresh, categorySlug }) {
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
    articles: articles.map((article, index) => normalizeArticle(article, "gnews", index, categorySlug)),
  };
}

async function fetchFromNewsApi({ query, limit, forceRefresh, categorySlug }) {
  if (!apiKeys.newsApi) return null;

  const response = await cachedGet(
    "newsapi",
    "https://newsapi.org/v2/everything",
    {
      params: {
        q: query,
        language: process.env.WCIM_NEWS_LANGUAGE || "en",
        pageSize: Math.min(Math.max(limit * 3, 10), 30),
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
    articles: articles.map((article, index) => normalizeArticle(article, "newsapi", index, categorySlug)),
  };
}

async function getStreamingNews(options = {}) {
  const parsed = querySchema.parse(options);

  let selectedCategory = null;

  if (parsed.category) {
    selectedCategory = await getNewsCategoryBySlug(parsed.category);

    if (!selectedCategory) {
      const error = new Error("News category not found.");
      error.status = 404;
      throw error;
    }
  }

  const query =
    parsed.q ||
    selectedCategory?.query ||
    process.env.WCIM_NEWS_QUERY ||
    "Miami soccer OR World Cup Miami OR Miami watch party";

  const limit = parsed.limit;
  const forceRefresh = boolValue(parsed.forceRefresh);
  const categorySlug = selectedCategory?.slug || parsed.category || "miami-world-cup";

  const providersTried = [];
  const providerErrors = [];

  try {
    const gnews = await fetchFromGNews({ query, limit, forceRefresh, categorySlug });
    if (gnews) providersTried.push(gnews);
  } catch (error) {
    providerErrors.push({
      provider: "gnews",
      message: error.message,
      details: error.details || null,
    });
  }

  try {
    const newsapi = await fetchFromNewsApi({ query, limit, forceRefresh, categorySlug });
    if (newsapi) providersTried.push(newsapi);
  } catch (error) {
    providerErrors.push({
      provider: "newsapi",
      message: error.message,
      details: error.details || null,
    });
  }

  const mergedArticles = providersTried
    .flatMap((providerResult) => providerResult.articles)
    .filter((article) => article.title && article.url);

  const relevantArticles = mergedArticles.filter((article) =>
    isEditoriallyRelevant(article, categorySlug)
  );

  const deduped = [];
  const seen = new Set();

  for (const article of relevantArticles) {
    const key = `${article.title.toLowerCase()}|${article.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(article);
  }

  const acceptedDeduped = deduped.filter((article) => article.editorial?.accepted === true);

  if (acceptedDeduped.length > 0) {
    return {
      status: "ok",
      mode: "live",
      query,
      category: selectedCategory,
      relevanceFilter: "enabled",
      count: acceptedDeduped.slice(0, limit).length,
      totalFetchedBeforeFilter: mergedArticles.length,
      totalAfterFilter: acceptedDeduped.length,
      providers: providersTried.map((provider) => ({
        provider: provider.provider,
        cached: provider.cached,
        fetchedAt: provider.fetchedAt,
      })),
      providerErrors,
      articles: acceptedDeduped.slice(0, limit),
    };
  }

  const fallback = await getFallbackNews(limit, categorySlug);

  return {
    status: "ok",
    mode: "fallback",
    query,
    category: selectedCategory,
    relevanceFilter: "enabled",
    count: fallback.length,
    totalFetchedBeforeFilter: mergedArticles.length,
    totalAfterFilter: relevantArticles.length,
    providers: providersTried.map((provider) => ({
      provider: provider.provider,
      cached: provider.cached,
      fetchedAt: provider.fetchedAt,
    })),
    providerErrors,
    articles: fallback,
  };
}

async function getNewsByCategory(slug, options = {}) {
  const category = await getNewsCategoryBySlug(slug);

  if (!category) {
    const error = new Error("News category not found.");
    error.status = 404;
    throw error;
  }

  return getStreamingNews({
    ...options,
    category: slug,
    q: options.q || category.query,
  });
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

  const categorySlug = options.category || "miami-world-cup";

  const news = await getStreamingNews({
    q: options.q,
    category: categorySlug,
    limit: 10,
    forceRefresh: options.forceRefresh,
  });

  const article = news.articles[0] || (await getFallbackNews(1, categorySlug))[0];

  const stored = {
    date: dateKey,
    mode: news.mode,
    category: categorySlug,
    createdAt: new Date().toISOString(),
    article,
  };

  existing.push(stored);
  await writeJsonFile(dailyNewsPath, existing);

  return {
    status: "ok",
    mode: news.mode,
    date: dateKey,
    category: categorySlug,
    article,
  };
}

export {
  DEFAULT_IMAGE,
  normalizeArticle,
  getStreamingNews,
  getDailyArticle,
  getFallbackNews,
  getNewsCategories,
  getNewsCategoryBySlug,
  getNewsByCategory,
  calculateArticleRelevance,
  isEditoriallyRelevant,
};
