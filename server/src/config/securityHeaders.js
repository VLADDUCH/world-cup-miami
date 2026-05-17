import helmet from "helmet";
import env from "./env.js";

function buildConnectSrc() {
  const corsOrigins = env.corsAllowedOrigins.map((origin) => origin.replace(/\/$/, ""));

  return [
    "'self'",
    ...corsOrigins,
    "https:",
  ];
}

export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: env.securityHeadersCspEnabled
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "base-uri": ["'self'"],
            "font-src": ["'self'", "https:", "data:"],
            "form-action": ["'self'"],
            "frame-ancestors": ["'self'"],
            "img-src": ["'self'", "data:", "https:"],
            "object-src": ["'none'"],
            "script-src": ["'self'"],
            "script-src-attr": ["'none'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "connect-src": buildConnectSrc(),
            "upgrade-insecure-requests": env.isProduction ? [] : null,
          },
        }
      : false,

    crossOriginEmbedderPolicy: false,

    hsts: env.securityHstsEnabled
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,

    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },

    noSniff: true,
    frameguard: {
      action: "sameorigin",
    },
  });
}

export default securityHeaders;
