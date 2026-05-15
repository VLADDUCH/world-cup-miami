import express from "express";
import {
  getPromotionTypes,
  submitPromotion,
} from "../services/promotionSubmissionService.js";
import {
  getPublishedBusinesses,
  getPublishedEvents,
  getPublishedMapPins,
  getPublishedPromotionFeeds,
  getPublishedSponsors,
} from "../services/publishedPromotionService.js";

const router = express.Router();


router.get("/published", async (req, res, next) => {
  try {
    const feeds = await getPublishedPromotionFeeds();

    res.json({
      ...feeds,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/published/businesses", async (req, res, next) => {
  try {
    const businesses = await getPublishedBusinesses();

    res.json({
      status: "ok",
      count: businesses.length,
      businesses,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/published/events", async (req, res, next) => {
  try {
    const events = await getPublishedEvents();

    res.json({
      status: "ok",
      count: events.length,
      events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/published/map-pins", async (req, res, next) => {
  try {
    const pins = await getPublishedMapPins();

    res.json({
      status: "ok",
      count: pins.length,
      pins,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/published/sponsors", async (req, res, next) => {
  try {
    const sponsors = await getPublishedSponsors();

    res.json({
      status: "ok",
      count: sponsors.length,
      sponsors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/types", async (req, res, next) => {
  try {
    const types = await getPromotionTypes();

    res.json({
      status: "ok",
      count: types.length,
      types,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/submit", async (req, res, next) => {
  try {
    const submission = await submitPromotion(req.body);

    res.status(201).json({
      status: "ok",
      message: "Promotion submission received and pending review.",
      submission,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
