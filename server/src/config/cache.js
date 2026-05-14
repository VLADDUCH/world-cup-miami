import NodeCache from "node-cache";
import env from "./env.js";

const apiCache = new NodeCache({
  stdTTL: env.apiCacheTtlSeconds,
  checkperiod: Math.max(60, Math.floor(env.apiCacheTtlSeconds / 2)),
  useClones: false,
});

function buildCacheKey(namespace, input = {}) {
  return `${namespace}:${JSON.stringify(input)}`;
}

function getCacheStats() {
  return apiCache.getStats();
}

function clearCache() {
  apiCache.flushAll();
}

export {
  apiCache,
  buildCacheKey,
  getCacheStats,
  clearCache,
};
