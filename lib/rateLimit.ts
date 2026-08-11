export interface RateLimitOptions {
  limit: number;      // Max allowed requests in time window
  windowMs: number;   // Time window in milliseconds
}

interface RequestLog {
  [ip: string]: number[];
}

const ipLogStore: RequestLog = {};

// Periodically purge old IP timestamps every 3 minutes to keep memory usage minimal
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const ip in ipLogStore) {
      ipLogStore[ip] = ipLogStore[ip].filter((timestamp) => now - timestamp < 120000);
      if (ipLogStore[ip].length === 0) {
        delete ipLogStore[ip];
      }
    }
  }, 180000);
}

/**
 * Checks if an IP has exceeded the rate limit.
 * @param ip Client IP address
 * @param options RateLimitOptions ({ limit, windowMs })
 */
export function checkRateLimit(
  ip: string,
  options: RateLimitOptions = { limit: 30, windowMs: 10000 }
) {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  if (!ipLogStore[ip]) {
    ipLogStore[ip] = [];
  }

  // Keep only timestamps that occurred inside the current sliding time window
  ipLogStore[ip] = ipLogStore[ip].filter((timestamp) => timestamp > windowStart);

  if (ipLogStore[ip].length >= options.limit) {
    const oldestTimestamp = ipLogStore[ip][0];
    const resetMs = Math.max(0, oldestTimestamp + options.windowMs - now);
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetMs,
    };
  }

  // Record timestamp for current request
  ipLogStore[ip].push(now);

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - ipLogStore[ip].length,
    resetMs: options.windowMs,
  };
}
