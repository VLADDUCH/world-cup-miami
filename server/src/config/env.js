import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

function csvToList(value, fallback = []) {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  API_PREFIX: z
    .string()
    .min(1)
    .regex(/^\/[a-zA-Z0-9/_-]*$/, "API_PREFIX must start with /")
    .default("/api/v1"),

  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
  CORS_ALLOWED_ORIGINS: z.string().optional(),

  TRUST_PROXY: z.coerce.number().int().min(0).max(3).default(1),
  REQUEST_BODY_LIMIT: z.string().min(1).default("500kb"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),

  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),

  API_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  EXTERNAL_API_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

  SECURITY_HEADERS_CSP_ENABLED: z.coerce.boolean().default(true),
  SECURITY_HSTS_ENABLED: z.coerce.boolean().default(false),

  LOG_ERROR_STACKS: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  LOG_FORMAT: z.enum(["json"]).default("json"),
  AUDIT_LOG_ENABLED: z.coerce.boolean().default(true),
  REQUEST_LOGGING_ENABLED: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid server environment configuration:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const raw = parsed.data;

const localDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const configuredOrigins = [
  raw.CORS_ORIGIN,
  ...csvToList(raw.CORS_ALLOWED_ORIGINS),
];

const corsAllowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    ...(raw.NODE_ENV === "production" ? [] : localDevOrigins),
  ])
);

const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
  isDevelopment: raw.NODE_ENV === "development",

  port: raw.PORT,
  apiPrefix: raw.API_PREFIX,

  corsOrigin: raw.CORS_ORIGIN,
  corsAllowedOrigins,

  trustProxy: raw.TRUST_PROXY,
  requestBodyLimit: raw.REQUEST_BODY_LIMIT,

  rateLimitWindowMs: raw.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: raw.RATE_LIMIT_MAX_REQUESTS,

  authRateLimitWindowMs: raw.AUTH_RATE_LIMIT_WINDOW_MS,
  authRateLimitMaxRequests: raw.AUTH_RATE_LIMIT_MAX_REQUESTS,

  apiCacheTtlSeconds: raw.API_CACHE_TTL_SECONDS,
  externalApiTimeoutMs: raw.EXTERNAL_API_TIMEOUT_MS,

  securityHeadersCspEnabled: raw.SECURITY_HEADERS_CSP_ENABLED,
  securityHstsEnabled: raw.SECURITY_HSTS_ENABLED,

  logErrorStacks: raw.LOG_ERROR_STACKS,
  logLevel: raw.LOG_LEVEL,
  logFormat: raw.LOG_FORMAT,
  auditLogEnabled: raw.AUDIT_LOG_ENABLED,
  requestLoggingEnabled: raw.REQUEST_LOGGING_ENABLED,
};

export default env;
