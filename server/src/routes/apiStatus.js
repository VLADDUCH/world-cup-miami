import express from "express";
import apiKeys from "../config/apiKeys.js";
import env from "../config/env.js";
import { getCacheStats, clearCache } from "../config/cache.js";
import { getAllBusinesses, getFeaturedBusinesses } from "../services/businessService.js";
import { getNewsCategories } from "../services/newsFeedService.js";
import { getEventCategories } from "../services/eventsFeedService.js";

const router = express.Router();

function keyLabel(isConfigured) {
  return isConfigured ? "configured" : "missing_key";
}

router.get("/status", async (req, res, next) => {
  try {
    const businesses = await getAllBusinesses();
    const featuredBusinesses = await getFeaturedBusinesses();
    const newsCategories = await getNewsCategories({ homepageOnly: true });
    const eventCategories = await getEventCategories({ homepageOnly: true });

    const feeds = {
      news: {
        gnews: keyLabel(apiKeys.status.gnews),
        newsApi: keyLabel(apiKeys.status.newsApi),
        streamingNewsEndpoint: "configured",
        dailyArticleEndpoint: "configured",
        imageSupport: "configured",
        categoriesEndpoint: "configured",
        relevanceFilter: "configured",
        providerFailureFallback: "configured",
        categoryCount: newsCategories.length,
      },
      events: {
        ticketmaster: keyLabel(apiKeys.status.ticketmaster),
        eventbrite: keyLabel(apiKeys.status.eventbrite),
        eventsFeedEndpoint: "configured",
        eventCategoriesEndpoint: "configured",
        eventImageSupport: "configured",
        providerFailureFallback: "configured",
        categoryCount: eventCategories.length,
        eventbriteMode: process.env.EVENTBRITE_ORGANIZATION_ID
          ? "organization_events_configured"
          : "organization_id_missing",
      },
      football: {
        sportmonks: keyLabel(apiKeys.status.sportmonks),
        apiFootball: keyLabel(apiKeys.status.apiFootball),
        openFootball: "public_or_static_source",
      },
      maps: {
        geoapify: keyLabel(apiKeys.status.geoapify),
        openStreetMap: "public_tile_source",
        leaflet: "frontend_library",
      },
      businessData: {
        wcimBusinessDb: "configured_json_store",
        businessCount: businesses.length,
        featuredBusinessCount: featuredBusinesses.length,
      },
      promotions: {
        promotionTypesEndpoint: "configured",
        promotionSubmitEndpoint: "configured",
        reviewWorkflow: "pending_review_json_store",
        adminReviewQueueEndpoint: "configured",
        adminReviewAuth: "x-admin-token",
        publishedPromotionsEndpoint: "configured",
        publishedBusinessesEndpoint: "configured",
        publishedEventsEndpoint: "configured",
        publishedMapPinsEndpoint: "configured",
        publishedSponsorsEndpoint: "configured",
      },
    };

    res.json({
      status: "ok",
      service: "world-cup-in-miami-api",
      environment: env.nodeEnv,
      apiPrefix: env.apiPrefix,
      cache: {
        ttlSeconds: env.apiCacheTtlSeconds,
        stats: getCacheStats(),
      },
      feeds,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status/cache", (req, res) => {
  res.json({
    status: "ok",
    cache: getCacheStats(),
    timestamp: new Date().toISOString(),
  });
});

router.post("/status/cache/clear", (req, res) => {
  clearCache();

  res.json({
    status: "ok",
    message: "API cache cleared.",
    timestamp: new Date().toISOString(),
  });
});

export default router;
