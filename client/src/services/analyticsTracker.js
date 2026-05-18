const TRACKED_EVENT_TYPES = new Set([
  "page_view",
  "lead_submitted",
  "promotion_submitted",
  "advertise_cta_clicked",
  "news_article_clicked",
  "event_clicked",
  "admin_review_action",
  "generic_click",
]);

function sanitizeText(value, fallback = "") {
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

function normalizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      sanitizeText(key),
      typeof value === "string" ? sanitizeText(value) : value,
    ])
  );
}

async function submitAnalyticsEvent(payload) {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const response = await fetch(`${apiBase}/analytics/events`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }

  if (!response.ok) {
    throw new Error(
      data?.error
        ? `Analytics event failed: ${data.error}`
        : `Analytics event failed with status ${response.status}`
    );
  }

  return data;
}

export async function trackEvent({
  eventType = "generic_click",
  page = "",
  label = "",
  target = "",
  source = "frontend",
  metadata = {},
} = {}) {
  const payload = {
    eventType: TRACKED_EVENT_TYPES.has(eventType) ? eventType : "generic_click",
    page: sanitizeText(page || currentPage(), "/"),
    label: sanitizeText(label),
    target: sanitizeText(target),
    source: sanitizeText(source || "frontend"),
    metadata: {
      ...normalizeMetadata(metadata),
      userAgent:
        typeof navigator !== "undefined"
          ? sanitizeText(navigator.userAgent).slice(0, 220)
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

export function trackPageView(page) {
  return trackEvent({
    eventType: "page_view",
    page: page || currentPage(),
    label: "Page View",
    source: "frontend",
    metadata: {
      path: page || currentPage(),
    },
  });
}

export function trackLeadSubmitted({ source = "homepage", interest = "", email = "" } = {}) {
  const cleanedEmail = sanitizeText(email);
  const emailDomain = cleanedEmail.includes("@") ? cleanedEmail.split("@").pop() : "";

  return trackEvent({
    eventType: "lead_submitted",
    page: currentPage(),
    label: "Lead Submitted",
    source: "frontend",
    metadata: {
      leadSource: source,
      interest,
      emailDomain,
    },
  });
}

export function trackAdvertiseCtaClick(slot = {}) {
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

export function trackNewsArticleClick(article = {}) {
  return trackEvent({
    eventType: "news_article_clicked",
    page: currentPage(),
    label: article.title || article.id || "News Article",
    target: article.url || "",
    source: "frontend",
    metadata: {
      articleId: article.id || "",
      source: article.source || "",
      provider: article.provider || "",
      category: article.category || "",
    },
  });
}

export function trackEventClick(event = {}) {
  return trackEvent({
    eventType: "event_clicked",
    page: currentPage(),
    label: event.title || event.id || "Event",
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


export function trackAdvertiseCtaClicked(slot = {}) {
  return trackAdvertiseCtaClick(slot);
}
