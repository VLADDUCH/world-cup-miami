import express from "express";
import {
  getEventCategories,
  getEventsByCategory,
  getEventsFeed,
  getFallbackEvents,
} from "../services/eventsFeedService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const events = await getEventsFeed(req.query);

    res.json({
      ...events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await getEventCategories({
      homepageOnly: req.query.homepageOnly === "true" || req.query.homepageOnly === "1",
    });

    res.json({
      status: "ok",
      count: categories.length,
      categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/category/:slug", async (req, res, next) => {
  try {
    const events = await getEventsByCategory(req.params.slug, req.query);

    res.json({
      ...events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/ticketmaster", async (req, res, next) => {
  try {
    const events = await getEventsFeed({
      ...req.query,
      provider: "ticketmaster",
    });

    res.json({
      ...events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/eventbrite", async (req, res, next) => {
  try {
    const events = await getEventsFeed({
      ...req.query,
      provider: "eventbrite",
    });

    res.json({
      ...events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/local", async (req, res, next) => {
  try {
    const events = await getFallbackEvents(Number(req.query.limit) || 12, req.query.category || "");

    res.json({
      status: "ok",
      mode: "fallback",
      count: events.length,
      events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
