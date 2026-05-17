import env from "./env.js";

const LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

const SENSITIVE_KEY_PATTERN =
  /(password|pass|secret|token|authorization|cookie|api[_-]?key|apikey|private[_-]?key|session|credential|card|ssn|email|phone)/i;

const SENSITIVE_VALUE_PATTERNS = [
  {
    pattern: /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
    replacement: "Bearer [REDACTED]",
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: "[REDACTED_AWS_KEY]",
  },
  {
    pattern: /AIza[0-9A-Za-z_-]{20,}/g,
    replacement: "[REDACTED_GOOGLE_KEY]",
  },
  {
    pattern:
      /-----BEGIN (?:RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY-----/gi,
    replacement: "[REDACTED_PRIVATE_KEY]",
  },
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[REDACTED_SSN]",
  },
  {
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
    replacement: "[REDACTED_CARD_OR_LONG_NUMBER]",
  },
  {
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    replacement: "[REDACTED_EMAIL]",
  },
];

function shouldLog(level) {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[env.logLevel];
}

export function redactLogValue(value, depth = 0) {
  if (depth > 6) {
    return "[REDACTED_DEPTH_LIMIT]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return SENSITIVE_VALUE_PATTERNS.reduce(
      (current, rule) => current.replace(rule.pattern, rule.replacement),
      value
    );
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactLogValue(item, depth + 1));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactLogValue(value.message, depth + 1),
      stack: env.logErrorStacks
        ? redactLogValue(value.stack || "", depth + 1)
        : undefined,
    };
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          return [key, "[REDACTED]"];
        }

        return [key, redactLogValue(item, depth + 1)];
      })
    );
  }

  return "[REDACTED_UNSUPPORTED]";
}

export function createLogEntry(level, event, metadata = {}) {
  return {
    level,
    event,
    service: "world-cup-in-miami-api",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    ...redactLogValue(metadata),
  };
}

export function log(level, event, metadata = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = createLogEntry(level, event, metadata);
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(event, metadata = {}) {
    log("debug", event, metadata);
  },

  info(event, metadata = {}) {
    log("info", event, metadata);
  },

  warn(event, metadata = {}) {
    log("warn", event, metadata);
  },

  error(event, metadata = {}) {
    log("error", event, metadata);
  },

  security(event, metadata = {}) {
    log("warn", event, {
      category: "security",
      ...metadata,
    });
  },

  audit(event, metadata = {}) {
    if (!env.auditLogEnabled) {
      return;
    }

    log("info", event, {
      category: "audit",
      ...metadata,
    });
  },
};

export default logger;
