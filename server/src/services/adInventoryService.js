import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adInventoryPath = path.resolve(__dirname, "../data/adInventory.json");

const querySchema = z.object({
  section: z.string().trim().max(80).optional().default(""),
  packageTier: z.string().trim().max(80).optional().default(""),
  featured: z
    .union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0"), z.boolean()])
    .optional()
    .default("false"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(30),
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

function normalizeAdSlot(slot = {}) {
  return {
    id: slot.id,
    name: slot.name || "WCIM Ad Slot",
    slot: slot.slot || "general",
    section: slot.section || "homepage",
    packageTier: slot.packageTier || "standard",
    price: Number(slot.price || 0),
    currency: slot.currency || "USD",
    durationDays: Number(slot.durationDays || 7),
    status: slot.status || "available",
    headline: slot.headline || "",
    description: slot.description || "",
    deliverables: Array.isArray(slot.deliverables) ? slot.deliverables : [],
    recommendedFor: Array.isArray(slot.recommendedFor) ? slot.recommendedFor : [],
    ctaLabel: slot.ctaLabel || "Request Placement",
    ctaHref: slot.ctaHref || "/#submit",
    featured: Boolean(slot.featured),
  };
}

async function getAdInventory(options = {}) {
  const parsed = querySchema.parse(options);
  const inventory = await readJsonFile(adInventoryPath, []);

  let slots = inventory.map(normalizeAdSlot);

  if (parsed.section) {
    slots = slots.filter((slot) => slot.section === parsed.section);
  }

  if (parsed.packageTier) {
    slots = slots.filter((slot) => slot.packageTier === parsed.packageTier);
  }

  if (boolValue(parsed.featured)) {
    slots = slots.filter((slot) => slot.featured === true);
  }

  return slots.slice(0, parsed.limit);
}

async function getFeaturedAdSlots(limit = 6) {
  return getAdInventory({
    featured: "true",
    limit,
  });
}

async function getAdSections() {
  const inventory = await readJsonFile(adInventoryPath, []);
  const counts = new Map();

  for (const item of inventory) {
    const section = item.section || "homepage";
    counts.set(section, (counts.get(section) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({
      slug,
      label: slug
        .split("_")
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
        .join(" "),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function getAdPackages() {
  const inventory = await readJsonFile(adInventoryPath, []);
  const counts = new Map();

  for (const item of inventory) {
    const tier = item.packageTier || "standard";
    counts.set(tier, (counts.get(tier) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({
      slug,
      label: slug
        .split("_")
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
        .join(" "),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export {
  getAdInventory,
  getFeaturedAdSlots,
  getAdSections,
  getAdPackages,
  normalizeAdSlot,
};
