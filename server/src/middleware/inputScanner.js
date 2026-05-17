const SECRET_AND_ATTACK_PATTERNS = [
  {
    code: "AWS_ACCESS_KEY",
    pattern: /AKIA[0-9A-Z]{16}/,
  },
  {
    code: "PRIVATE_KEY",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY-----/i,
  },
  {
    code: "SHELL_DROPPER",
    pattern: /(rm\s+-rf|curl\s+.*\|\s*bash|wget\s+.*\|\s*sh|sudo\s+)/i,
  },
  {
    code: "PROMPT_INJECTION",
    pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  },
  {
    code: "SYSTEM_PROMPT_OVERRIDE",
    pattern: /\b(system|developer)\s*:\s*(you are|ignore|override)/i,
  },
];

const BASE64_LIKE_PATTERN = /[A-Za-z0-9+/]{120,}={0,2}/;

function scanValue(value, path = "root", findings = []) {
  if (typeof value === "string") {
    for (const rule of SECRET_AND_ATTACK_PATTERNS) {
      if (rule.pattern.test(value)) {
        findings.push({
          code: rule.code,
          path,
        });
      }
    }

    if (BASE64_LIKE_PATTERN.test(value)) {
      findings.push({
        code: "HIGH_ENTROPY_STRING",
        path,
      });
    }

    return findings;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanValue(item, `${path}[${index}]`, findings));
    return findings;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => scanValue(item, `${path}.${key}`, findings));
  }

  return findings;
}

export function inputScanner(req, res, next) {
  const findings = [
    ...scanValue(req.body, "body"),
    ...scanValue(req.query, "query"),
    ...scanValue(req.params, "params"),
  ];

  if (findings.length > 0) {
    return res.status(400).json({
      error: "Request blocked by input security policy.",
      code: "INPUT_POLICY_BLOCKED",
      findings: findings.map((finding) => ({
        code: finding.code,
        path: finding.path,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  return next();
}

export default inputScanner;
