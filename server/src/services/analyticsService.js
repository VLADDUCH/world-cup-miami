import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analyticsEventsPath = path.resolve(__dirname, "../data/analyticsEvents.json");

const allowedEventTypes = [
  "page_view",
  "lead_submitted",
  "promotion_submitted",
  
  "advertise_cta_clicked",
  "news_article_clicked",
  "event_clicked",
  "admin_review_action",
  "generic_click",
];

const analyticsEventSchema = z.object({
  eventType: z.enum(allowedEventTypes),
  page: z.string().trim().max(220).optional().default(""),
  label: z.string().trim().max(220).optional().default(""),
  target: z.string().trim().max(500).optional().default(""),
  source: z.string().trim().max(120).optional().default("frontend"),
  metadata: z.record(z.any()).optional().default({}),
});

function sanitizeText(value) {
  if (typeof value !== "string") return value;

  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPayload(payload = {}) {
  const cleaned = {};

  for (const [key, value] of Object.entries(payload)) {
    cleaned[key] = sanitizeText(value);
  }

  if (payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)) {
    cleaned.metadata = Object.fromEntries(
      Object.entries(payload.metadata).map(([key, value]) => [
        sanitizeText(key),
        typeof value === "string" ? sanitizeText(value) : value,
      ])
    );
  }

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

function toCsvValue(value) {
  const text =
    typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}

function analyticsEventsToCsv(events = []) {
  const headers = [
    "id",
    "eventType",
    "page",
    "label",
    "target",
    "source",
    "metadata",
    "createdAt",
  ];

  const rows = events.map((event) =>
    headers.map((header) => toCsvValue(event[header])).join(",")
  );

  return [headers.join(","), ...rows].join("\n") + "\n";
}

async function createAnalyticsEvent(payload) {
  const cleaned = cleanPayload(payload);
  const parsed = analyticsEventSchema.safeParse(cleaned);

  if (!parsed.success) {
    const error = new Error("Invalid analytics event.");
    error.status = 400;
    error.details = parsed.error.flatten();
    throw error;
  }

  const events = await readJsonFile(analyticsEventsPath, []);
  const now = new Date().toISOString();

  const event = {
    id: `analytics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    ...parsed.data,
  };

  events.push(event);

  await writeJsonFile(analyticsEventsPath, events);

  return event;
}

async function getAnalyticsEvents(filters = {}) {
  const events = await readJsonFile(analyticsEventsPath, []);
  const eventType = String(filters.eventType || "").trim();
  const page = String(filters.page || "").trim();
  const source = String(filters.source || "").trim();
  const limit = Math.min(Number(filters.limit) || 100, 500);

  let result = events;

  if (eventType) {
    result = result.filter((event) => event.eventType === eventType);
  }

  if (page) {
    result = result.filter((event) => event.page === page);
  }

  if (source) {
    result = result.filter((event) => event.source === source);
  }

  return [...result]
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, limit);
}

async function getAnalyticsSummary() {
  const events = await readJsonFile(analyticsEventsPath, []);

  const summary = {
    total: events.length,
    byEventType: {},
    byPage: {},
    bySource: {},
    conversions: {
      lead_submitted: 0,
      promotion_submitted: 0,
      content_clicked: 0,
      advertise_cta_clicked: 0,
    },
  };

  for (const event of events) {
    const eventType = event.eventType || "unknown";
    const page = event.page || "unknown";
    const source = event.source || "unknown";

    summary.byEventType[eventType] = (summary.byEventType[eventType] || 0) + 1;
    summary.byPage[page] = (summary.byPage[page] || 0) + 1;
    summary.bySource[source] = (summary.bySource[source] || 0) + 1;

    if (Object.prototype.hasOwnProperty.call(summary.conversions, eventType)) {
      summary.conversions[eventType] += 1;
    }
  }

  return summary;
}

async function exportAnalyticsCsv(filters = {}) {
  const events = await getAnalyticsEvents({
    ...filters,
    limit: 500,
  });

  return analyticsEventsToCsv(events);
}

export {
  allowedEventTypes,
  analyticsEventSchema,
  createAnalyticsEvent,
  getAnalyticsEvents,
  getAnalyticsSummary,
  exportAnalyticsCsv,
  analyticsEventsToCsv,
};
