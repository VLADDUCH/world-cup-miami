import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leadsPath = path.resolve(__dirname, "../data/leads.json");

const leadSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  source: z.string().trim().max(80).optional().default("homepage"),
  interest: z
    .enum([
      "fan_updates",
    "fan_experiences",
      "fan experiences",
      "advertising",
      "business_listing",
      "events",
      "tickets",
      "general",
    ])
    .optional()
    .default("fan_updates"),
  message: z.string().trim().max(600).optional().default(""),
  consentToContact: z.boolean().default(false),
});

function sanitizeText(value) {
  if (typeof value !== "string") return value;

  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeInterest(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/__+/g, "_");

  const aliases = {
    fan_updates: "fan_updates",
    fan_update: "fan_updates",
    updates: "fan_updates",
    fan: "fan_updates",
    fan_experiences: "fan_experiences",
    fan_experience: "fan_experiences",
    fan_experience_updates: "fan_experiences",
    fan_experience_drops: "fan_experiences",

    advertising: "advertising",
    advertising_sponsorship: "advertising",
    sponsor: "advertising",
    sponsorship: "advertising",
    sponsors: "advertising",

    business_listing: "business_listing",
    add_my_business: "business_listing",
    business: "business_listing",

    events: "events",
    events_watch_parties: "events",
    watch_parties: "events",
    watch_party: "events",

    tickets: "tickets",
    tickets_info: "tickets",

    general: "general",
    general_updates: "general",
  };

  return aliases[normalized] || normalized || "fan_updates";
}

function cleanPayload(payload = {}) {
  const cleaned = {};

  for (const [key, value] of Object.entries(payload)) {
    cleaned[key] = sanitizeText(value);
  }

  cleaned.interest = normalizeInterest(payload.interest || cleaned.interest || "fan_updates");

  cleaned.consentToContact =
    payload.consentToContact === true || payload.consentToContact === "true";

  return cleaned;
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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function leadsToCsv(leads = []) {
  const headers = [
    "id",
    "email",
    "name",
    "phone",
    "source",
    "interest",
    "message",
    "consentToContact",
    "createdAt",
    "updatedAt",
  ];

  const rows = leads.map((lead) =>
    headers.map((header) => toCsvValue(lead[header])).join(",")
  );

  return [headers.join(","), ...rows].join("\n") + "\n";
}

async function createLead(payload) {
  const cleaned = cleanPayload(payload);
  const parsed = leadSchema.safeParse(cleaned);

  if (!parsed.success) {
    const error = new Error("Invalid lead submission.");
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

  const leads = await readJsonFile(leadsPath, []);
  const now = new Date().toISOString();
  const emailSlug = slugify(parsed.data.email.split("@")[0]);

  const existingIndex = leads.findIndex(
    (lead) =>
      String(lead.email || "").toLowerCase() === parsed.data.email.toLowerCase() &&
      String(lead.interest || "") === parsed.data.interest
  );

  const lead = {
    id:
      existingIndex >= 0
        ? leads[existingIndex].id
        : `lead-${emailSlug || "subscriber"}-${Date.now()}`,
    status: "active",
    createdAt: existingIndex >= 0 ? leads[existingIndex].createdAt : now,
    updatedAt: now,
    ...parsed.data,
  };

  if (existingIndex >= 0) {
    leads[existingIndex] = {
      ...leads[existingIndex],
      ...lead,
    };
  } else {
    leads.push(lead);
  }

  await writeJsonFile(leadsPath, leads);

  return lead;
}

async function getLeads(filters = {}) {
  const leads = await readJsonFile(leadsPath, []);
  const interest = String(filters.interest || "").trim();
  const source = String(filters.source || "").trim();
  const search = String(filters.search || "").trim().toLowerCase();

  let result = leads;

  if (interest) {
    result = result.filter((lead) => lead.interest === interest);
  }

  if (source) {
    result = result.filter((lead) => lead.source === source);
  }

  if (search) {
    result = result.filter((lead) =>
      [
        lead.email,
        lead.name,
        lead.phone,
        lead.source,
        lead.interest,
        lead.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  return [...result].sort((a, b) =>
    String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
  );
}

async function getLeadStats() {
  const leads = await readJsonFile(leadsPath, []);

  const stats = {
    total: leads.length,
    byInterest: {},
    bySource: {},
  };

  for (const lead of leads) {
    const interest = lead.interest || "general";
    const source = lead.source || "unknown";

    stats.byInterest[interest] = (stats.byInterest[interest] || 0) + 1;
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;
  }

  return stats;
}

async function exportLeadsCsv(filters = {}) {
  const leads = await getLeads(filters);
  return leadsToCsv(leads);
}

export {
  leadSchema,
  createLead,
  getLeads,
  getLeadStats,
  exportLeadsCsv,
  leadsToCsv,
};
