import express from "express";
import {
  getAdInventory,
  getAdPackages,
  getAdSections,
  getFeaturedAdSlots,
} from "../services/adInventoryService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const slots = await getAdInventory(req.query);

    res.json({
      status: "ok",
      count: slots.length,
      slots,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/featured", async (req, res, next) => {
  try {
    const slots = await getFeaturedAdSlots(Number(req.query.limit) || 6);

    res.json({
      status: "ok",
      count: slots.length,
      slots,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/sections", async (req, res, next) => {
  try {
    const sections = await getAdSections();

    res.json({
      status: "ok",
      count: sections.length,
      sections,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/packages", async (req, res, next) => {
  try {
    const packages = await getAdPackages();

    res.json({
      status: "ok",
      count: packages.length,
      packages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
