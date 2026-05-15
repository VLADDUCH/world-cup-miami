import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

import apiKeys from "../config/apiKeys.js";
import { cachedGet } from "./externalApiClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fallbackEventsPath = path.resolve(__dirname, "../data/eventsFallback.json");
const eventCategoriesPath = path.resolve(__dirname, "../data/eventCategories.json");

const DEFAULT_IMAGE = "/images/wcim_soccer_ball_miami_background.png";

const eventQuerySchema = z.object({
  q: z.string().trim().min(1).max(220).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  provider: z.enum(["all", "ticketmaster", "eventbrite", "local"]).optional().default("all"),
  limit: z.coerce.number().int().min(1).max(30).optional().default(12),
  forceRefresh: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .optional()
    .default(false),
  offline: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .optional()
    .default(false),
});

function boolValue(value) {
  return value === true || value === "true" || value === "1";
}

function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return cleanText(value).slice(0, 700);
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

function makeId(...parts) {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 140);
}

function firstImage(images = []) {
  if (!Array.isArray(images) || images.length === 0) return DEFAULT_IMAGE;

  const preferred = [...images].sort((a, b) => {
    const aSize = Number(a.width || 0) * Number(a.height || 0);
    const bSize = Number(b.width || 0) * Number(b.height || 0);
    return bSize - aSize;
  })[0];

  return preferred?.url || DEFAULT_IMAGE;
}

function normalizeFallbackEvent(event, index = 0) {
  return {
    id: event.id || makeId("wcim", event.title, index),
    title: safeString(event.title, "Miami event"),
    description: safeString(event.description, "Miami event listing."),
    category: event.category || "watch-parties",
    source: event.source || "World Cup in Miami",
    provider: event.provider || "wcim",
    url: event.url || "/",
    imageUrl: event.imageUrl || DEFAULT_IMAGE,
    startDate: event.startDate || "",
    startTime: event.startTime || "",
    venueName: event.venueName || "Miami",
    city: event.city || "Miami",
    state: event.state || "FL",
    address: event.address || "Miami, FL",
    lat: Number(event.lat) || 25.7617,
    lng: Number(event.lng) || -80.1918,
    featured: Boolean(event.featured),
    tags: Array.isArray(event.tags) ? event.tags : [],
  };
}

function normalizeTicketmasterEvent(event, index = 0, categorySlug = "") {
  const venue = event?._embedded?.venues?.[0] || {};
  const location = venue.location || {};
  const addressLine = venue.address?.line1 || "";
  const city = venue.city?.name || "Miami";
  const state = venue.state?.stateCode || venue.state?.name || "FL";

  return {
    id: event.id || makeId("ticketmaster", event.name, index),
    title: safeString(event.name, "Miami event"),
    description: safeString(event.info || event.pleaseNote || event.description || "Ticketmaster event near Miami."),
    category: categorySlug || "watch-parties",
    source: "Ticketmaster",
    provider: "ticketmaster",
    url: event.url || "/",
    imageUrl: firstImage(event.images),
    startDate: event.dates?.start?.localDate || "",
    startTime: event.dates?.start?.localTime || "",
    venueName: venue.name || "Miami venue",
    city,
    state,
    address: [addressLine, city, state].filter(Boolean).join(", "),
    lat: Number(location.latitude) || 25.7617,
    lng: Number(location.longitude) || -80.1918,
    featured: false,
    tags: ["ticketmaster", "event", "miami"],
  };
}

function normalizeEventbriteEvent(event, index = 0, categorySlug = "") {
  const venue = event.venue || {};
  const address = venue.address || {};
  const logoUrl = event.logo?.url || event.logo?.original?.url || DEFAULT_IMAGE;

  return {
    id: event.id || makeId("eventbrite", event.name?.text, index),
    title: safeString(event.name?.text || event.name || "Eventbrite event"),
    description: safeString(event.description?.text || event.summary || "Eventbrite event."),
    category: categorySlug || "watch-parties",
    source: "Eventbrite",
    provider: "eventbrite",
    url: event.url || "/",
    imageUrl: logoUrl,
    startDate: String(event.start?.local || "").slice(0, 10),
    startTime: String(event.start?.local || "").slice(11, 16),
    venueName: venue.name || "Eventbrite venue",
    city: address.city || "Miami",
    state: address.region || "FL",
    address: address.localized_address_display || address.address_1 || "Miami, FL",
    lat: Number(address.latitude) || 25.7617,
    lng: Number(address.longitude) || -80.1918,
    featured: false,
    tags: ["eventbrite", "event", "miami"],
  };
}

async function getEventCategories(options = {}) {
  const categories = await readJsonFile(eventCategoriesPath, []);
  const sorted = [...categories].sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999));

  if (options.homepageOnly) {
    return sorted.filter((category) => category.showOnHomepage === true);
  }

  return sorted;
}

async function getEventCategoryBySlug(slug) {
  const categories = await getEventCategories();
  return categories.find((category) => category.slug === slug) || null;
}

async function getFallbackEvents(limit = 12, categorySlug = "") {
  const events = await readJsonFile(fallbackEventsPath, []);
  const filtered = categorySlug
    ? events.filter((event) => event.category === categorySlug)
    : events.filter((event) => event.category !== "promoted-business-events");

  const source = filtered.length > 0 ? filtered : events;

  return source.slice(0, limit).map((event, index) => normalizeFallbackEvent(event, index));
}

async function fetchTicketmasterEvents({ query, limit, forceRefresh, categorySlug }) {
  if (!apiKeys.ticketmaster) return null;

  const latlong = process.env.WCIM_EVENTS_LATLONG || "25.7617,-80.1918";
  const radius = process.env.WCIM_EVENTS_RADIUS_MILES || "35";

  const response = await cachedGet(
    "ticketmaster-events",
    "https://app.ticketmaster.com/discovery/v2/events.json",
    {
      params: {
        apikey: apiKeys.ticketmaster,
        keyword: query,
        latlong,
        radius,
        unit: "miles",
        countryCode: "US",
        size: Math.min(Math.max(limit * 2, 10), 50),
        sort: "date,asc",
      },
      forceRefresh,
    }
  );

  const events = Array.isArray(response.data?._embedded?.events)
    ? response.data._embedded.events
    : [];

  return {
    provider: "ticketmaster",
    cached: response.cached,
    fetchedAt: response.fetchedAt,
    events: events.map((event, index) => normalizeTicketmasterEvent(event, index, categorySlug)),
  };
}

async function fetchEventbriteEvents({ limit, forceRefresh, categorySlug }) {
  if (!apiKeys.eventbrite) return null;

  const organizationId = process.env.EVENTBRITE_ORGANIZATION_ID;

  if (!organizationId) {
    return {
      provider: "eventbrite",
      cached: false,
      fetchedAt: new Date().toISOString(),
      events: [],
      warning: "EVENTBRITE_ORGANIZATION_ID missing. Eventbrite public event search is not used.",
    };
  }

  const response = await cachedGet(
    "eventbrite-events",
    `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`,
    {
      params: {
        status: "live",
        order_by: "start_asc",
      },
      headers: {
        Authorization: `Bearer ${apiKeys.eventbrite}`,
      },
      forceRefresh,
    }
  );

  const events = Array.isArray(response.data?.events) ? response.data.events : [];

  return {
    provider: "eventbrite",
    cached: response.cached,
    fetchedAt: response.fetchedAt,
    events: events.slice(0, limit).map((event, index) => normalizeEventbriteEvent(event, index, categorySlug)),
  };
}

function dedupeEvents(events) {
  const deduped = [];
  const seen = new Set();

  for (const event of events) {
    const key = `${event.provider}|${event.title.toLowerCase()}|${event.startDate}|${event.venueName.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(event);
  }

  return deduped;
}

async function getEventsFeed(options = {}) {
  const parsed = eventQuerySchema.parse(options);

  let selectedCategory = null;

  if (parsed.category) {
    selectedCategory = await getEventCategoryBySlug(parsed.category);

    if (!selectedCategory) {
      const error = new Error("Event category not found.");
      error.status = 404;
      throw error;
    }
  }

  const limit = parsed.limit;
  const forceRefresh = boolValue(parsed.forceRefresh);
  const offline = boolValue(parsed.offline);
  const categorySlug = selectedCategory?.slug || parsed.category || "";

  const query =
    parsed.q ||
    selectedCategory?.query ||
    process.env.WCIM_EVENTS_QUERY ||
    "Miami soccer watch party OR Miami World Cup OR Miami fan event";

  const providers = [];
  const providerErrors = [];

  if (!offline && ["all", "ticketmaster"].includes(parsed.provider)) {
    try {
      const ticketmaster = await fetchTicketmasterEvents({
        query,
        limit,
        forceRefresh,
        categorySlug,
      });

      if (ticketmaster) providers.push(ticketmaster);
    } catch (error) {
      providerErrors.push({
        provider: "ticketmaster",
        message: error.message,
        details: error.details || null,
      });
    }
  }

  if (!offline && ["all", "eventbrite"].includes(parsed.provider)) {
    try {
      const eventbrite = await fetchEventbriteEvents({
        limit,
        forceRefresh,
        categorySlug,
      });

      if (eventbrite) providers.push(eventbrite);
    } catch (error) {
      providerErrors.push({
        provider: "eventbrite",
        message: error.message,
        details: error.details || null,
      });
    }
  }

  const liveEvents = dedupeEvents(providers.flatMap((provider) => provider.events || []));

  if (liveEvents.length > 0 && parsed.provider !== "local") {
    return {
      status: "ok",
      mode: "live",
      query,
      category: selectedCategory,
      count: liveEvents.slice(0, limit).length,
      providers: providers.map((provider) => ({
        provider: provider.provider,
        cached: provider.cached,
        fetchedAt: provider.fetchedAt,
        warning: provider.warning || undefined,
      })),
      providerErrors,
      events: liveEvents.slice(0, limit),
    };
  }

  const fallbackEvents = await getFallbackEvents(limit, categorySlug);

  return {
    status: "ok",
    mode: "fallback",
    query,
    category: selectedCategory,
    count: fallbackEvents.length,
    providers: providers.map((provider) => ({
      provider: provider.provider,
      cached: provider.cached,
      fetchedAt: provider.fetchedAt,
      warning: provider.warning || undefined,
    })),
    providerErrors,
    events: fallbackEvents,
  };
}

async function getEventsByCategory(slug, options = {}) {
  const category = await getEventCategoryBySlug(slug);

  if (!category) {
    const error = new Error("Event category not found.");
    error.status = 404;
    throw error;
  }

  return getEventsFeed({
    ...options,
    category: slug,
    q: options.q || category.query,
  });
}

export {
  DEFAULT_IMAGE,
  getEventCategories,
  getEventCategoryBySlug,
  getFallbackEvents,
  getEventsFeed,
  getEventsByCategory,
  normalizeFallbackEvent,
  normalizeTicketmasterEvent,
  normalizeEventbriteEvent,
};
