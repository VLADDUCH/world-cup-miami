import express from "express";
import {
  createAnalyticsEvent,
  exportAnalyticsCsv,
  getAnalyticsEvents,
  getAnalyticsSummary,
} from "../services/analyticsService.js";

const router = express.Router();

function adminToken() {
  return process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token";
}

function requireAdmin(req, res, next) {
  const suppliedToken = req.headers["x-admin-token"];

  if (!suppliedToken || suppliedToken !== adminToken()) {
    return res.status(401).json({
      status: "error",
      error: "Admin token required.",
      timestamp: new Date().toISOString(),
    });
  }

  return next();
}

router.post("/events", async (req, res, next) => {
  try {
    const event = await createAnalyticsEvent(req.body);

    res.status(201).json({
      status: "ok",
      event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/events", requireAdmin, async (req, res, next) => {
  try {
    const events = await getAnalyticsEvents(req.query);

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

router.get("/summary", requireAdmin, async (req, res, next) => {
  try {
    const summary = await getAnalyticsSummary();

    res.json({
      status: "ok",
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/export.csv", requireAdmin, async (req, res, next) => {
  try {
    const csv = await exportAnalyticsCsv(req.query);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=wcim-analytics-events.csv");
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
