const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function requestJson(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WCIM API request failed: ${response.status} ${text}`);
  }

  return response.json();
}

function normalizeImageUrl(imageUrl) {
  if (!imageUrl) return "/images/wcim_soccer_ball_miami_background.png";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return imageUrl;
}

async function getApiStatus() {
  return requestJson("/status");
}

async function getFeaturedBusinesses() {
  const data = await requestJson("/businesses/featured");
  return data.businesses || [];
}

async function getBusinessMapPins() {
  const data = await requestJson("/businesses/map-pins");
  return data.pins || [];
}

async function getStreamingNews(limit = 6) {
  const data = await requestJson(`/feeds/news?limit=${encodeURIComponent(limit)}`);
  return {
    ...data,
    articles: (data.articles || []).map((article) => ({
      ...article,
      imageUrl: normalizeImageUrl(article.imageUrl),
    })),
  };
}

async function getDailyNews() {
  const data = await requestJson("/feeds/news/daily");
  return {
    ...data,
    article: data.article
      ? {
          ...data.article,
          imageUrl: normalizeImageUrl(data.article.imageUrl),
        }
      : null,
  };
}

async function getNewsCategories() {
  const data = await requestJson("/feeds/news/categories?homepageOnly=true");
  return data.categories || [];
}

async function getNewsByCategory(slug, limit = 4) {
  const data = await requestJson(
    `/feeds/news/category/${encodeURIComponent(slug)}?limit=${encodeURIComponent(limit)}`
  );

  return {
    ...data,
    articles: (data.articles || []).map((article) => ({
      ...article,
      imageUrl: normalizeImageUrl(article.imageUrl),
    })),
  };
}

async function getEventsFeed(limit = 6, offline = true) {
  const offlineParam = offline ? "&offline=true" : "";
  const data = await requestJson(`/feeds/events?limit=${encodeURIComponent(limit)}${offlineParam}`);

  return {
    ...data,
    events: (data.events || []).map((event) => ({
      ...event,
      imageUrl: normalizeImageUrl(event.imageUrl),
    })),
  };
}

async function getEventCategories() {
  const data = await requestJson("/feeds/events/categories?homepageOnly=true");
  return data.categories || [];
}

async function getEventsByCategory(slug, limit = 4, offline = true) {
  const offlineParam = offline ? "&offline=true" : "";
  const data = await requestJson(
    `/feeds/events/category/${encodeURIComponent(slug)}?limit=${encodeURIComponent(limit)}${offlineParam}`
  );

  return {
    ...data,
    events: (data.events || []).map((event) => ({
      ...event,
      imageUrl: normalizeImageUrl(event.imageUrl),
    })),
  };
}

async function getPromotionTypes() {
  const data = await requestJson("/promotions/types");
  return data.types || [];
}

async function submitPromotion(payload) {
  return requestJson("/promotions/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export {
  API_BASE_URL,
  getApiStatus,
  getFeaturedBusinesses,
  getBusinessMapPins,
  getStreamingNews,
  getDailyNews,
  getNewsCategories,
  getNewsByCategory,
  getEventsFeed,
  getEventCategories,
  getEventsByCategory,
  getPromotionTypes,
  submitPromotion,
};
