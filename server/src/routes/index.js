import express from "express";
import apiStatusRouter from "./apiStatus.js";
import businessesRouter from "./businesses.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "world-cup-in-miami-api",
    message: "WCIM API root is online.",
    routes: {
      status: "/api/v1/status",
      cache: "/api/v1/status/cache",
      businesses: "/api/v1/businesses",
      featuredBusinesses: "/api/v1/businesses/featured",
      businessMapPins: "/api/v1/businesses/map-pins",
      submitBusiness: "/api/v1/businesses/submit"
    },
    timestamp: new Date().toISOString(),
  });
});

router.use("/", apiStatusRouter);
router.use("/businesses", businessesRouter);

export default router;
