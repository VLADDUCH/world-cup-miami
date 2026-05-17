import express from "express";
import {
  getAuditEvents,
  getAuditStats,
} from "../services/auditService.js";

const router = express.Router();

function adminToken() {
  return process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token";
}

function requireAdmin(req, res, next) {
  const suppliedToken = req.headers["x-admin-token"];

  if (!suppliedToken || suppliedToken !== adminToken()) {
    return res.status(401).json({
      status: "error",
      error: "Admin audit token required.",
      timestamp: new Date().toISOString(),
    });
  }

  return next();
}

router.use(requireAdmin);

router.get("/events", (req, res, next) => {
  try {
    const events = getAuditEvents({
      limit: req.query.limit,
      action: req.query.action,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
      actorType: req.query.actorType,
      actorId: req.query.actorId,
      requestId: req.query.requestId,
      status: req.query.status,
    });

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

router.get("/stats", (req, res, next) => {
  try {
    res.json({
      status: "ok",
      stats: getAuditStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
