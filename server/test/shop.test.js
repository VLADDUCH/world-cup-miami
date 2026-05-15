import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  getFeaturedShopProducts,
  getShopCategories,
  getShopProducts,
  normalizeProduct,
} from "../src/services/shopService.js";

test("normalizeProduct returns safe defaults", () => {
  const product = normalizeProduct({
    id: "test-product",
    name: "Test Product",
    price: "25",
    featured: true,
  });

  assert.equal(product.id, "test-product");
  assert.equal(product.price, 25);
  assert.equal(product.featured, true);
  assert.ok(product.imageUrl);
});

test("getShopProducts returns product catalog", async () => {
  const products = await getShopProducts({ limit: 3 });

  assert.ok(products.length >= 1);
  assert.ok(products.length <= 3);
  assert.ok(products[0].name);
});

test("getFeaturedShopProducts returns featured products", async () => {
  const products = await getFeaturedShopProducts(4);

  assert.ok(products.length >= 1);
  assert.ok(products.every((product) => product.featured === true));
});

test("getShopCategories returns categories", async () => {
  const categories = await getShopCategories();

  assert.ok(categories.length >= 1);
  assert.ok(categories.some((category) => category.slug === "shirts"));
});

test("GET /api/v1/shop/products returns products", async () => {
  const response = await request(app)
    .get("/api/v1/shop/products?limit=3")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(Array.isArray(response.body.products));
});

test("GET /api/v1/shop/featured returns featured products", async () => {
  const response = await request(app)
    .get("/api/v1/shop/featured?limit=4")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
  assert.ok(response.body.products.every((product) => product.featured === true));
});

test("GET /api/v1/shop/categories returns shop categories", async () => {
  const response = await request(app)
    .get("/api/v1/shop/categories")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
});

test("GET /api/v1/status includes shop readiness", async () => {
  const response = await request(app)
    .get("/api/v1/status")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.shop.productCatalogEndpoint, "configured");
  assert.equal(response.body.feeds.shop.featuredProductsEndpoint, "configured");
});
