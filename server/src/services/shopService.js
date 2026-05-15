import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsPath = path.resolve(__dirname, "../data/shopProducts.json");

const querySchema = z.object({
  category: z.string().trim().max(80).optional().default(""),
  featured: z
    .union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0"), z.boolean()])
    .optional()
    .default("false"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
});

function boolValue(value) {
  return value === true || value === "true" || value === "1";
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function normalizeProduct(product = {}) {
  return {
    id: product.id,
    name: product.name || "WCIM Product",
    category: product.category || "merch",
    collection: product.collection || "World Cup in Miami",
    price: Number(product.price || 0),
    compareAtPrice: Number(product.compareAtPrice || 0),
    currency: product.currency || "USD",
    description: product.description || "",
    imageUrl: product.imageUrl || "/images/wcim_soccer_ball_miami_background.png",
    checkoutUrl: product.checkoutUrl || "#submit",
    badge: product.badge || "",
    featured: Boolean(product.featured),
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
}

async function getShopProducts(options = {}) {
  const parsed = querySchema.parse(options);
  const products = await readJsonFile(productsPath, []);

  let result = products.map(normalizeProduct);

  if (parsed.category) {
    result = result.filter((product) => product.category === parsed.category);
  }

  if (boolValue(parsed.featured)) {
    result = result.filter((product) => product.featured === true);
  }

  return result.slice(0, parsed.limit);
}

async function getShopCategories() {
  const products = await readJsonFile(productsPath, []);
  const counts = new Map();

  for (const product of products) {
    const category = product.category || "merch";
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({
      slug,
      label: slug
        .split("-")
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
        .join(" "),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function getFeaturedShopProducts(limit = 6) {
  return getShopProducts({
    featured: "true",
    limit,
  });
}

export {
  getShopProducts,
  getShopCategories,
  getFeaturedShopProducts,
  normalizeProduct,
};
