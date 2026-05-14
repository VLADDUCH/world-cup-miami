import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || "/api/v1",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  apiCacheTtlSeconds: toNumber(process.env.API_CACHE_TTL_SECONDS, 900),
  externalApiTimeoutMs: toNumber(process.env.EXTERNAL_API_TIMEOUT_MS, 8000),

  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMaxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 120),
};

export default env;
