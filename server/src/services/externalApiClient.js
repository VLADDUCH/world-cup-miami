import axios from "axios";
import env from "../config/env.js";
import { apiCache, buildCacheKey } from "../config/cache.js";

const http = axios.create({
  timeout: env.externalApiTimeoutMs,
  headers: {
    "User-Agent": "WorldCupInMiami/1.0",
    Accept: "application/json",
  },
});

function normalizeAxiosError(error) {
  if (error.response) {
    return {
      type: "external_api_response_error",
      status: error.response.status,
      statusText: error.response.statusText,
      data:
        typeof error.response.data === "string"
          ? error.response.data.slice(0, 500)
          : error.response.data,
    };
  }

  if (error.request) {
    return {
      type: "external_api_no_response",
      message: "External API did not respond before timeout.",
    };
  }

  return {
    type: "external_api_request_setup_error",
    message: error.message,
  };
}

async function cachedGet(namespace, url, options = {}) {
  const {
    params = {},
    headers = {},
    ttlSeconds = env.apiCacheTtlSeconds,
    forceRefresh = false,
  } = options;

  const cacheKey = buildCacheKey(namespace, { url, params });

  if (!forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return {
        source: namespace,
        cached: true,
        cacheKey,
        fetchedAt: cached.fetchedAt,
        data: cached.data,
      };
    }
  }

  try {
    const response = await http.get(url, {
      params,
      headers,
    });

    const payload = {
      fetchedAt: new Date().toISOString(),
      data: response.data,
    };

    apiCache.set(cacheKey, payload, ttlSeconds);

    return {
      source: namespace,
      cached: false,
      cacheKey,
      fetchedAt: payload.fetchedAt,
      data: payload.data,
    };
  } catch (error) {
    const normalized = normalizeAxiosError(error);
    const wrapped = new Error(`External API request failed for ${namespace}`);
    wrapped.details = normalized;
    throw wrapped;
  }
}

export {
  http,
  cachedGet,
  normalizeAxiosError,
};
