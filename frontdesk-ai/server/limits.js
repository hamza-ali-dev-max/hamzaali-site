// Small in-memory rate limiter and structured logger. Good for one server instance.
// If you ever run several instances, move these counters to Redis.

export function createLimiter(now = () => Date.now()) {
  const buckets = new Map(); // key -> array of timestamps

  function hits(key, windowMs) {
    const cutoff = now() - windowMs;
    const list = (buckets.get(key) || []).filter((t) => t > cutoff);
    buckets.set(key, list);
    return list;
  }

  return {
    // Returns { ok, retryAfterSeconds }. Counts the hit only when it is allowed.
    take(key, max, windowMs) {
      const list = hits(key, windowMs);
      if (list.length >= max) {
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((list[0] + windowMs - now()) / 1000)) };
      }
      list.push(now());
      return { ok: true, retryAfterSeconds: 0 };
    },
    peek(key, max, windowMs) { return hits(key, windowMs).length < max; },
    sweep() {
      for (const [key, list] of buckets) if (!list.length || list[list.length - 1] < now() - 86400000) buckets.delete(key);
    },
  };
}

// One JSON line per event, so Railway, Docker or journald logs can be searched and added up.
export function log(event, fields = {}) {
  process.stdout.write(`${JSON.stringify({ time: new Date().toISOString(), event, ...fields })}\n`);
}

export const usd = (seconds, perMinute) => Math.round((seconds / 60) * perMinute * 10000) / 10000;

// Mask a phone number for logs: keep the country code and last two digits.
export const maskPhone = (phone) => String(phone || '').replace(/^(\+?\d{2})\d+(\d{2})$/, '$1*******$2');
