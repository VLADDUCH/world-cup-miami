import { submitAnalyticsEvent } from "./wcimApi";

const VALID_EVENT_TYPES = new Set([
  "page_view",
  "lead_submitted",
  "promotion_submitted",
  "shop_product_clicked",
  "advertise_cta_clicked",
  "news_article_clicked",
  "event_clicked",
  "admin_review_action",
  "generic_click",
]);

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;

  return String(value)
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function currentPage() {
  if (typeof window === "undefined") return "";

  return `${window.location.pathname}${window.location.search || ""}`;
}

function safeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      safeString(key),
      typeof value === "string" ? safeString(value) : value,
    ])
  );
}

async function trackEvent({
  eventType = "generic_click",
  page,
  label = "",
  target = "",
  source = "frontend",
  metadata = {},
} = {}) {
  const finalEventType = VALID_EVENT_TYPES.has(eventType)
    ? eventType
    : "generic_click";

  const payload = {
    eventType: finalEventType,
    page: safeString(page || currentPage(), "/"),
    label: safeString(label),
    target: safeString(target),
    source: safeString(source || "frontend"),
    metadata: {
      ...safeMetadata(metadata),
      userAgent:
        typeof navigator !== "undefined"
          ? safeString(navigator.userAgent).slice(0, 220)
          : "",
      trackedAtClient:
        typeof Date !== "undefined" ? new Date().toISOString() : "",
    },
  };

  try {
    await submitAnalyticsEvent(payload);
    return { ok: true };
  } catch (error) {
    console.warn("[analytics] event failed", error);
    return { ok: false, error };
  }
}

function trackPageView(pathname) {
  return trackEvent({
    eventType: "page_view",
    page: pathname || currentPage(),
    label: "Page View",
    source: "frontend",
    metadata: {
      path: pathname || currentPage(),
    },
  });
}

function trackLeadSubmitted({ source = "homepage", interest = "", email = "" } = {}) {
  return trackEvent({
    eventType: "lead_submitted",
    page: currentPage(),
    label: "Lead Submitted",
    source: "frontend",
    metadata: {
      leadSource: source,
      interest,
      emailDomain: safeString(email).includes("@")
        ? safeString(email).split("@").pop()
        : "",
    },
  });
}

function trackShopProductClicked(product = {}) {
  return trackEvent({
    eventType: "shop_product_clicked",
    page: currentPage(),
    label: product.name || product.id || "Shop Product",
    target: product.checkoutUrl || "/shop",
    source: "frontend",
    metadata: {
      productId: product.id || "",
      category: product.category || "",
      price: product.price || 0,
      currency: product.currency || "USD",
    },
  });
}

function trackAdvertiseCtaClicked(slot = {}) {
  return trackEvent({
    eventType: "advertise_cta_clicked",
    page: currentPage(),
    label: slot.name || slot.ctaLabel || "Advertise CTA",
    target: slot.ctaHref || "/advertise",
    source: "frontend",
    metadata: {
      slotId: slot.id || "",
      section: slot.section || "",
      packageTier: slot.packageTier || "",
      price: slot.price || 0,
      currency: slot.currency || "USD",
    },
  });
}

function trackNewsArticleClicked(article = {}) {
  return trackEvent({
    eventType: "news_article_clicked",
    page: currentPage(),
    label: article.title || "News Article",
    target: article.url || "",
    source: "frontend",
    metadata: {
      articleId: article.id || "",
      sourceName: article.source || "",
      category: article.category || "",
      provider: article.provider || "",
    },
  });
}

function trackEventClicked(event = {}) {
  return trackEvent({
    eventType: "event_clicked",
    page: currentPage(),
    label: event.title || event.name || "Event",
    target: event.url || "",
    source: "frontend",
    metadata: {
      eventId: event.id || "",
      category: event.category || "",
      provider: event.provider || "",
      venueName: event.venueName || "",
    },
  });
}

export {
  trackEvent,
  trackPageView,
  trackLeadSubmitted,
  trackShopProductClicked,
  trackAdvertiseCtaClicked,
  trackNewsArticleClicked,
  trackEventClicked,
};
