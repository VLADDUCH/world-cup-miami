import express from "express";
import {
  getPromotionTypes,
  submitPromotion,
} from "../services/promotionSubmissionService.js";

const router = express.Router();

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
