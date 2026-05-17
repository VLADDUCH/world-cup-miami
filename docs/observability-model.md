# WCIM Observability Model

## Batch 17 Production Logging Audit Trail and Monitoring Foundation

Batch 17 adds production-friendly observability without adding external logging dependencies yet.

## Goals

- Every request receives a request ID.
- Every response includes X-Request-Id.
- Request completion logs are structured JSON.
- Security events are logged as metadata only.
- Audit events are available through a central service helper.
- Logs redact secrets and common PII patterns.
- Health responses expose observability readiness fields.

## Files Added

- server/src/config/logger.js
- server/src/utils/logger.js
- server/src/middleware/requestContext.js
- server/src/middleware/requestLogger.js
- server/src/services/auditService.js
- server/test/middleware/observability.test.js

## Files Updated

- server/src/app.js
- server/src/config/env.js
- server/src/config/rateLimit.js
- server/src/middleware/cors.js
- server/src/middleware/errorHandler.js
- server/src/middleware/inputScanner.js
- server/src/services/healthService.js
- server/.env.example

## Log Event Types

Request events:

- http.request.completed
- http.request.not_found
- http.error.client_error
- http.error.server_error

Security events:

- security.cors.blocked_origin
- security.input_policy.blocked
- security.rate_limit.global_exceeded
- security.rate_limit.auth_exceeded

Audit events:

- audit.event.recorded

## Redaction Rules

Logs redact authorization tokens, API keys, private keys, SSN-like values, credit-card-like values, email addresses, and sensitive object keys such as password, secret, token, authorization, cookie, and apiKey.

## Environment Variables

- LOG_LEVEL=info
- LOG_FORMAT=json
- LOG_ERROR_STACKS=false
- REQUEST_LOGGING_ENABLED=true
- AUDIT_LOG_ENABLED=true

## Production Notes

- Keep LOG_ERROR_STACKS=false.
- Keep logs metadata-only.
- Send stdout and stderr logs to a real log sink later.
- Do not store raw form submissions in observability logs.
- Use request IDs to trace a request across API, logs, and future worker jobs.
- Treat in-memory audit events as a temporary foundation only.

## Current Limitations

This batch does not yet add persistent database audit tables, Sentry, OpenTelemetry, Prometheus metrics, alerting rules, dashboards, or log shipping.
