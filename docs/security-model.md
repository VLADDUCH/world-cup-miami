# WCIM Security Model

## Batch 16 — Production Deployment Hardening

This batch hardens the World Cup in Miami backend for production deployment.

## Controls Added

### 1. Helmet / Security Headers

The server applies centralized Helmet security headers from:

`server/src/config/securityHeaders.js`

Controls include:

- Content Security Policy
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Optional production HSTS

HSTS should only be enabled after HTTPS is confirmed in production.

### 2. Rate Limits

The server applies a global API rate limiter from:

`server/src/config/rateLimit.js`

Environment variables:

- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX_REQUESTS`

### 3. CORS Allowlist

CORS is centralized in:

`server/src/middleware/cors.js`

Environment variables:

- `CORS_ORIGIN`
- `CORS_ALLOWED_ORIGINS`

Production should explicitly list:

- `https://worldcupinmiami.com`
- `https://www.worldcupinmiami.com`

### 4. Environment Validation

Environment variables are validated in:

`server/src/config/env.js`

Invalid production configuration fails fast at startup.

### 5. Request Size Limits

Request body limits are controlled by:

`REQUEST_BODY_LIMIT`

Default:

`500kb`

### 6. Input Scanning

The input scanner blocks obvious:

- Secret leakage
- Private keys
- Shell droppers
- Basic prompt injection
- System/developer prompt override attempts
- High-entropy suspicious strings

File:

`server/src/middleware/inputScanner.js`

### 7. Safe Error Responses

Error responses are centralized in:

`server/src/middleware/errorHandler.js`

Production responses do not leak stack traces.

### 8. Production Health Checks

Health probes are available at:

- `/health`
- `/health/live`
- `/health/ready`
- `/api/v1/health`
- `/api/v1/health/live`
- `/api/v1/health/ready`

File:

`server/src/routes/health.js`

## Deployment Notes

Before production:

1. Set `NODE_ENV=production`.
2. Set `CORS_ALLOWED_ORIGINS` to the real domains.
3. Confirm HTTPS works.
4. Then set `SECURITY_HSTS_ENABLED=true`.
5. Keep `LOG_ERROR_STACKS=false`.
6. Keep real API keys only in `server/.env` or the hosting secret manager.
