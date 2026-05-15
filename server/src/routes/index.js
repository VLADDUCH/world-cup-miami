import express from "express";
import apiStatusRouter from "./apiStatus.js";
import businessesRouter from "./businesses.js";
import newsFeedRouter from "./newsFeed.js";
import eventsFeedRouter from "./eventsFeed.js";
import promotionsRouter from "./promotions.js";
import adminReviewRouter from "./adminReview.js";
import shopRouter from "./shop.js";
import adInventoryRouter from "./adInventory.js";
import leadsRouter from "./leads.js";
import analyticsRouter from "./analytics.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "world-cup-in-miami-api",
    message: "WCIM API root is online.",
    routes: {
      status: "/api/v1/status",
      cache: "/api/v1/status/cache",
      businesses: "/api/v1/businesses",
      featuredBusinesses: "/api/v1/businesses/featured",
      businessMapPins: "/api/v1/businesses/map-pins",
      submitBusiness: "/api/v1/businesses/submit",
      streamingNews: "/api/v1/feeds/news",
      dailyNews: "/api/v1/feeds/news/daily",
      newsCategories: "/api/v1/feeds/news/categories",
      searchNews: "/api/v1/feeds/news/search?q=Miami%20soccer",
      events: "/api/v1/feeds/events",
      eventCategories: "/api/v1/feeds/events/categories",
      ticketmasterEvents: "/api/v1/feeds/events/ticketmaster",
      eventbriteEvents: "/api/v1/feeds/events/eventbrite",
      localEvents: "/api/v1/feeds/events/local",
      promotionTypes: "/api/v1/promotions/types",
      submitPromotion: "/api/v1/promotions/submit",
      adminPromotionReview: "/api/v1/admin/review/promotions",
      shopProducts: "/api/v1/shop/products",
      shopCategories: "/api/v1/shop/categories",
      shopFeatured: "/api/v1/shop/featured",
    },
    timestamp: new Date().toISOString(),
  });
});

router.use("/", apiStatusRouter);
router.use("/businesses", businessesRouter);
router.use("/feeds/news", newsFeedRouter);
router.use("/feeds/events", eventsFeedRouter);
router.use("/promotions", promotionsRouter);
router.use("/admin/review", adminReviewRouter);
router.use("/shop", shopRouter);
router.use("/ads/inventory", adInventoryRouter);
router.use("/leads", leadsRouter);
router.use("/analytics", analyticsRouter);

export default router;
