import express from "express";
import {
  getAllBusinesses,
  getFeaturedBusinesses,
  getBusinessById,
  getMapPins,
  submitBusiness,
} from "../services/businessService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const businesses = await getAllBusinesses(req.query);

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

router.get("/featured", async (req, res, next) => {
  try {
    const businesses = await getFeaturedBusinesses();

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

router.get("/map-pins", async (req, res, next) => {
  try {
    const pins = await getMapPins();

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

router.post("/submit", async (req, res, next) => {
  try {
    const submission = await submitBusiness(req.body);

    res.status(201).json({
      status: "ok",
      message: "Business submission received and pending review.",
      submission,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const business = await getBusinessById(req.params.id);

    if (!business) {
      return res.status(404).json({
        status: "error",
        error: "Business not found.",
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      status: "ok",
      business,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
