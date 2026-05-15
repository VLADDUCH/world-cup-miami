import express from "express";
import {
  createLead,
  exportLeadsCsv,
  getLeadStats,
  getLeads,
} from "../services/leadService.js";

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

router.post("/subscribe", async (req, res, next) => {
  try {
    const lead = await createLead(req.body);

    res.status(201).json({
      status: "ok",
      message: "Lead captured successfully.",
      lead,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const leads = await getLeads(req.query);

    res.json({
      status: "ok",
      count: leads.length,
      leads,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", requireAdmin, async (req, res, next) => {
  try {
    const stats = await getLeadStats();

    res.json({
      status: "ok",
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/export.csv", requireAdmin, async (req, res, next) => {
  try {
    const csv = await exportLeadsCsv(req.query);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=wcim-leads.csv");
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
