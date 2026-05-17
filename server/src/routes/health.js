import express from "express";
import { getLiveHealth, getReadyHealth } from "../services/healthService.js";

const router = express.Router();

router.get("/health", async (req, res, next) => {
  try {
    res.json(await getReadyHealth());
  } catch (error) {
    next(error);
  }
});

router.get("/health/live", async (req, res, next) => {
  try {
    res.json(await getLiveHealth());
  } catch (error) {
    next(error);
  }
});

router.get("/health/ready", async (req, res, next) => {
  try {
    res.json(await getReadyHealth());
  } catch (error) {
    next(error);
  }
});

export default router;
