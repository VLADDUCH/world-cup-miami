import express from "express";
import {
  getStreamingNews,
  getDailyArticle,
} from "../services/newsFeedService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const news = await getStreamingNews(req.query);

    res.json({
      ...news,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const news = await getStreamingNews(req.query);

    res.json({
      ...news,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/daily", async (req, res, next) => {
  try {
    const daily = await getDailyArticle(req.query);

    res.json({
      ...daily,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
