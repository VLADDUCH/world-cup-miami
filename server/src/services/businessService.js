import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const listingsPath = path.resolve(__dirname, "../data/businessListings.json");
const submissionsPath = path.resolve(__dirname, "../data/businessSubmissions.json");

const businessSubmissionSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120).optional().default(""),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().default(""),
  category: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(80).optional().default("Miami"),
  address: z.string().trim().max(220).optional().default(""),
  website: z.string().trim().url().optional().or(z.literal("")).default(""),
  instagram: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().min(10).max(1000),
  promotionType: z
    .enum(["free_listing", "featured_listing", "flyer", "sponsor", "match_day_ad"])
    .optional()
    .default("free_listing"),
  preferredMatchDay: z.string().trim().max(80).optional().default(""),
});

function normalizeText(value) {
  if (typeof value !== "string") return value;

  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
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

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function cleanSubmissionPayload(payload) {
  const cleaned = {};

  for (const [key, value] of Object.entries(payload || {})) {
    cleaned[key] = normalizeText(value);
  }

  return cleaned;
}

async function getAllBusinesses(filters = {}) {
  const listings = await readJsonFile(listingsPath, []);

  const category = normalizeText(filters.category || "").toLowerCase();
  const area = normalizeText(filters.area || "").toLowerCase();
  const featured =
    filters.featured === true ||
    filters.featured === "true" ||
    filters.featured === "1";

  return listings.filter((business) => {
    if (featured && !business.featured) return false;

    if (category) {
      const haystack = `${business.category} ${(business.tags || []).join(" ")}`.toLowerCase();
      if (!haystack.includes(category)) return false;
    }

    if (area) {
      const haystack = `${business.area} ${business.address}`.toLowerCase();
      if (!haystack.includes(area)) return false;
    }

    return true;
  });
}

async function getFeaturedBusinesses() {
  return getAllBusinesses({ featured: true });
}

async function getBusinessById(id) {
  const listings = await readJsonFile(listingsPath, []);
  return listings.find((business) => business.id === id) || null;
}

async function getMapPins() {
  const listings = await getAllBusinesses();

  return listings
    .filter((business) => Number.isFinite(business.lat) && Number.isFinite(business.lng))
    .map((business) => ({
      id: business.id,
      name: business.name,
      category: business.category,
      area: business.area,
      address: business.address,
      lat: business.lat,
      lng: business.lng,
      featured: business.featured,
      sponsorTier: business.sponsorTier,
    }));
}

async function submitBusiness(payload) {
  const cleaned = cleanSubmissionPayload(payload);
  const parsed = businessSubmissionSchema.safeParse(cleaned);

  if (!parsed.success) {
    const error = new Error("Invalid business submission.");
    error.status = 400;
    error.details = parsed.error.flatten();
    throw error;
  }

  const submissions = await readJsonFile(submissionsPath, []);

  const now = new Date().toISOString();
  const idBase = slugify(parsed.data.businessName);
  const submission = {
    id: `${idBase || "business"}-${Date.now()}`,
    status: "pending_review",
    createdAt: now,
    updatedAt: now,
    ...parsed.data,
  };

  submissions.push(submission);
  await writeJsonFile(submissionsPath, submissions);

  return submission;
}

export {
  businessSubmissionSchema,
  getAllBusinesses,
  getFeaturedBusinesses,
  getBusinessById,
  getMapPins,
  submitBusiness,
};
