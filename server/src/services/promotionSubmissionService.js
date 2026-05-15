import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const submissionsPath = path.resolve(__dirname, "../data/promotionSubmissions.json");

const promotionTypes = [
  {
    slug: "business_listing",
    label: "Add My Business",
    description: "For restaurants, bars, shops, venues, creators, and local services.",
  },
  {
    slug: "flyer",
    label: "Add My Flyer",
    description: "For flyers, watch parties, merch drops, nightlife, and local events.",
  },
  {
    slug: "watch_party",
    label: "Submit Watch Party",
    description: "For sports bars, restaurants, and community gathering spaces.",
  },
  {
    slug: "event",
    label: "Submit Event",
    description: "For fan zones, local activations, community events, and nightlife.",
  },
  {
    slug: "featured_placement",
    label: "Request Featured Placement",
    description: "For paid placement on homepage, map, news, and event sections.",
  },
  {
    slug: "sponsor_inquiry",
    label: "Sponsor / Advertise Inquiry",
    description: "For brands that want visibility during Miami match weeks.",
  },
];

const promotionSubmissionSchema = z.object({
  submissionType: z
    .enum([
      "business_listing",
      "flyer",
      "watch_party",
      "event",
      "featured_placement",
      "sponsor_inquiry",
    ])
    .default("business_listing"),
  businessName: z.string().trim().min(2).max(140),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().default(""),
  website: z.string().trim().url().optional().or(z.literal("")).default(""),
  instagram: z.string().trim().max(120).optional().default(""),
  category: z.string().trim().min(2).max(80).optional().default("Business"),
  locationArea: z.string().trim().min(2).max(100).optional().default("Miami"),
  address: z.string().trim().max(240).optional().default(""),
  eventDate: z.string().trim().max(40).optional().default(""),
  eventTime: z.string().trim().max(40).optional().default(""),
  budgetRange: z
    .enum(["not_sure", "under_250", "250_500", "500_1000", "1000_plus"])
    .optional()
    .default("not_sure"),
  message: z.string().trim().min(10).max(1400),
  consentToContact: z.boolean().default(false),
});

function normalizeText(value) {
  if (typeof value !== "string") return value;

  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPayload(payload) {
  const cleaned = {};

  for (const [key, value] of Object.entries(payload || {})) {
    cleaned[key] = normalizeText(value);
  }

  if (payload?.consentToContact === true || payload?.consentToContact === "true") {
    cleaned.consentToContact = true;
  } else {
    cleaned.consentToContact = false;
  }

  return cleaned;
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

async function getPromotionTypes() {
  return promotionTypes;
}

async function submitPromotion(payload) {
  const cleaned = cleanPayload(payload);
  const parsed = promotionSubmissionSchema.safeParse(cleaned);

  if (!parsed.success) {
    const error = new Error("Invalid promotion submission.");
    error.status = 400;
    error.details = parsed.error.flatten();
    throw error;
  }

  if (!parsed.data.consentToContact) {
    const error = new Error("Consent to contact is required.");
    error.status = 400;
    error.details = {
      fieldErrors: {
        consentToContact: ["Consent to contact is required."],
      },
    };
    throw error;
  }

  const submissions = await readJsonFile(submissionsPath, []);

  const now = new Date().toISOString();
  const idBase = slugify(`${parsed.data.submissionType}-${parsed.data.businessName}`);

  const submission = {
    id: `${idBase || "promotion"}-${Date.now()}`,
    status: "pending_review",
    source: "wcim_homepage_form",
    createdAt: now,
    updatedAt: now,
    ...parsed.data,
  };

  submissions.push(submission);
  await writeJsonFile(submissionsPath, submissions);

  return submission;
}

export {
  promotionSubmissionSchema,
  getPromotionTypes,
  submitPromotion,
};
