const SENSITIVE_PATTERNS = [
  /cookie/i,
  /authorization/i,
  /token/i,
  /password/i,
  /secret/i,
  /LOGIN_INFO/i,
  /SID/i,
  /HSID/i,
  /SSID/i,
  /APISID/i,
  /SAPISID/i,
];

export const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    console.log(`[INFO] ${message}`, meta ? sanitizeMeta(meta) : '');
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    console.warn(`[WARN] ${message}`, meta ? sanitizeMeta(meta) : '');
  },
  error: (message: string, meta?: Record<string, unknown>): void => {
    console.error(`[ERROR] ${message}`, meta ? sanitizeMeta(meta) : '');
  },
};

const sanitizeMeta = (meta: Record<string, unknown>): Record<string, unknown> => {
  const safeMeta: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      safeMeta[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      safeMeta[key] = sanitizeMeta(value as Record<string, unknown>);
    } else {
      safeMeta[key] = value;
    }
  }

  return safeMeta;
};
