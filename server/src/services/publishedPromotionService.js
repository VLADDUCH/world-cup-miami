import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promotionSubmissionsPath = path.resolve(__dirname, "../data/promotionSubmissions.json");

const DEFAULT_IMAGE = "/images/wcim_soccer_ball_miami_background.png";

function safeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;

  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
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

function isApproved(submission = {}) {
  return submission.status === "approved";
}

function isPlacement(submission = {}, placements = []) {
  if (!placements.length) return true;
  return placements.includes(submission.approvedPlacement || "none");
}

function isBusinessType(submission = {}) {
  return [
    "business_listing",
    "featured_placement",
    "sponsor_inquiry",
    "flyer",
    "watch_party",
    "event",
  ].includes(submission.submissionType);
}

function isEventType(submission = {}) {
  return ["watch_party", "event", "flyer", "featured_placement", "sponsor_inquiry"].includes(
    submission.submissionType
  );
}

function stablePublicId(submission = {}, prefix = "promotion") {
  return `${prefix}-${submission.id || slugify(submission.businessName)}`;
}

function deriveCoordinates(submission = {}) {
  const area = String(submission.locationArea || "").toLowerCase();
  const address = String(submission.address || "").toLowerCase();

  if (area.includes("wynwood") || address.includes("wynwood")) {
    return { lat: 25.8004, lng: -80.1994 };
  }

  if (area.includes("brickell") || address.includes("brickell")) {
    return { lat: 25.7665, lng: -80.1933 };
  }

  if (area.includes("doral") || address.includes("doral")) {
    return { lat: 25.8195, lng: -80.3553 };
  }

  if (area.includes("miami gardens") || address.includes("miami gardens")) {
    return { lat: 25.942, lng: -80.2456 };
  }

  if (area.includes("south beach") || address.includes("south beach")) {
    return { lat: 25.7826, lng: -80.1341 };
  }

  if (area.includes("downtown") || address.includes("bayfront")) {
    return { lat: 25.7743, lng: -80.187 };
  }

  return { lat: 25.7617, lng: -80.1918 };
}

function normalizeBudgetLabel(value = "not_sure") {
  const labels = {
    not_sure: "Budget TBD",
    under_250: "Under $250",
    "250_500": "$250 - $500",
    "500_1000": "$500 - $1,000",
    "1000_plus": "$1,000+",
  };

  return labels[value] || "Budget TBD";
}

function publishedBusinessFromSubmission(submission = {}) {
  const coords = deriveCoordinates(submission);

  return {
    id: stablePublicId(submission, "business"),
    sourceSubmissionId: submission.id,
    name: safeText(submission.businessName, "Miami Business"),
    category: safeText(submission.category, "Business"),
    area: safeText(submission.locationArea, "Miami"),
    address: safeText(submission.address, "Miami, FL"),
    website: safeText(submission.website, ""),
    instagram: safeText(submission.instagram, ""),
    description: safeText(submission.message, "Approved World Cup in Miami business promotion."),
    sponsorTier:
      submission.approvedPlacement === "featured_business" ||
      submission.approvedPlacement === "homepage_sponsor"
        ? "featured"
        : "standard",
    approvedPlacement: submission.approvedPlacement || "business_listing",
    featured:
      submission.approvedPlacement === "featured_business" ||
      submission.approvedPlacement === "homepage_sponsor",
    lat: coords.lat,
    lng: coords.lng,
    status: "published",
    publishedFrom: "approved_promotion_submission",
    createdAt: submission.createdAt || "",
    reviewedAt: submission.reviewedAt || "",
  };
}

function publishedEventFromSubmission(submission = {}) {
  const coords = deriveCoordinates(submission);

  return {
    id: stablePublicId(submission, "event"),
    sourceSubmissionId: submission.id,
    title: safeText(submission.businessName, "Miami Event"),
    description: safeText(submission.message, "Approved World Cup in Miami event promotion."),
    category:
      submission.submissionType === "watch_party"
        ? "watch-parties"
        : submission.submissionType === "event"
          ? "fan-zone-events"
          : "promoted-business-events",
    source: "World Cup in Miami",
    provider: "approved-promotion",
    url: safeText(submission.website, "/#submit"),
    imageUrl: DEFAULT_IMAGE,
    startDate: safeText(submission.eventDate, "Match Week"),
    startTime: safeText(submission.eventTime, ""),
    venueName: safeText(submission.businessName, "Miami Venue"),
    city: "Miami",
    state: "FL",
    address: safeText(submission.address, "Miami, FL"),
    lat: coords.lat,
    lng: coords.lng,
    featured:
      submission.approvedPlacement === "event_card" ||
      submission.approvedPlacement === "events_sponsor" ||
      submission.approvedPlacement === "homepage_sponsor",
    approvedPlacement: submission.approvedPlacement || "event_card",
    status: "published",
    publishedFrom: "approved_promotion_submission",
    tags: [
      submission.submissionType,
      submission.approvedPlacement,
      safeText(submission.locationArea, "miami"),
    ].filter(Boolean),
    createdAt: submission.createdAt || "",
    reviewedAt: submission.reviewedAt || "",
  };
}

function publishedMapPinFromSubmission(submission = {}) {
  const coords = deriveCoordinates(submission);

  return {
    id: stablePublicId(submission, "pin"),
    sourceSubmissionId: submission.id,
    name: safeText(submission.businessName, "Miami Location"),
    category: safeText(submission.category, "Promotion"),
    area: safeText(submission.locationArea, "Miami"),
    address: safeText(submission.address, "Miami, FL"),
    lat: coords.lat,
    lng: coords.lng,
    featured:
      submission.approvedPlacement === "map_pin" ||
      submission.approvedPlacement === "featured_business" ||
      submission.approvedPlacement === "homepage_sponsor",
    sponsorTier:
      submission.approvedPlacement === "map_pin" ||
      submission.approvedPlacement === "homepage_sponsor"
        ? "featured"
        : "standard",
    approvedPlacement: submission.approvedPlacement || "map_pin",
    status: "published",
    publishedFrom: "approved_promotion_submission",
  };
}

function publishedSponsorFromSubmission(submission = {}) {
  return {
    id: stablePublicId(submission, "sponsor"),
    sourceSubmissionId: submission.id,
    businessName: safeText(submission.businessName, "Sponsor"),
    contactName: safeText(submission.contactName, ""),
    email: safeText(submission.email, ""),
    phone: safeText(submission.phone, ""),
    category: safeText(submission.category, "Sponsor"),
    area: safeText(submission.locationArea, "Miami"),
    approvedPlacement: submission.approvedPlacement || "none",
    budgetRange: submission.budgetRange || "not_sure",
    budgetLabel: normalizeBudgetLabel(submission.budgetRange),
    message: safeText(submission.message, ""),
    status: "published",
    publishedFrom: "approved_promotion_submission",
    reviewedAt: submission.reviewedAt || "",
  };
}

async function getApprovedSubmissions() {
  const submissions = await readJsonFile(promotionSubmissionsPath, []);
  return submissions.filter(isApproved);
}

async function getPublishedPromotionFeeds() {
  const approved = await getApprovedSubmissions();

  const businesses = approved
    .filter(isBusinessType)
    .filter((submission) =>
      isPlacement(submission, [
        "business_listing",
        "featured_business",
        "homepage_sponsor",
        "news_sponsor",
        "events_sponsor",
        "map_pin",
        "event_card",
        "none",
      ])
    )
    .map(publishedBusinessFromSubmission);

  const events = approved
    .filter(isEventType)
    .filter((submission) =>
      isPlacement(submission, [
        "event_card",
        "events_sponsor",
        "homepage_sponsor",
        "map_pin",
        "featured_business",
        "none",
      ])
    )
    .map(publishedEventFromSubmission);

  const mapPins = approved
    .filter((submission) =>
      isPlacement(submission, [
        "map_pin",
        "featured_business",
        "homepage_sponsor",
        "event_card",
        "events_sponsor",
        "business_listing",
      ])
    )
    .map(publishedMapPinFromSubmission);

  const sponsors = approved
    .filter((submission) =>
      isPlacement(submission, [
        "homepage_sponsor",
        "news_sponsor",
        "events_sponsor",
        "featured_business",
        "map_pin",
        "event_card",
      ])
    )
    .map(publishedSponsorFromSubmission);

  return {
    status: "ok",
    mode: "approved_submissions",
    counts: {
      approvedSubmissions: approved.length,
      businesses: businesses.length,
      events: events.length,
      mapPins: mapPins.length,
      sponsors: sponsors.length,
    },
    businesses,
    events,
    mapPins,
    sponsors,
  };
}

async function getPublishedBusinesses() {
  const feeds = await getPublishedPromotionFeeds();
  return feeds.businesses;
}

async function getPublishedEvents() {
  const feeds = await getPublishedPromotionFeeds();
  return feeds.events;
}

async function getPublishedMapPins() {
  const feeds = await getPublishedPromotionFeeds();
  return feeds.mapPins;
}

async function getPublishedSponsors() {
  const feeds = await getPublishedPromotionFeeds();
  return feeds.sponsors;
}

export {
  DEFAULT_IMAGE,
  getApprovedSubmissions,
  getPublishedPromotionFeeds,
  getPublishedBusinesses,
  getPublishedEvents,
  getPublishedMapPins,
  getPublishedSponsors,
  publishedBusinessFromSubmission,
  publishedEventFromSubmission,
  publishedMapPinFromSubmission,
  publishedSponsorFromSubmission,
};
