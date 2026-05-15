import express from "express";
import {
  getFeaturedShopProducts,
  getShopCategories,
  getShopProducts,
} from "../services/shopService.js";

const router = express.Router();

router.get("/products", async (req, res, next) => {
  try {
    const products = await getShopProducts(req.query);

    res.json({
      status: "ok",
      count: products.length,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/featured", async (req, res, next) => {
  try {
    const products = await getFeaturedShopProducts(Number(req.query.limit) || 6);

    res.json({
      status: "ok",
      count: products.length,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await getShopCategories();

    res.json({
      status: "ok",
      count: categories.length,
      categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
