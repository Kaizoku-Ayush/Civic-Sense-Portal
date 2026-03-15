const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const buckets = new Map();

function getKey(req) {
  if (req.user?._id) return `user:${req.user._id}`;
  return `ip:${req.ip || req.connection?.remoteAddress || 'unknown'}`;
}

export function chatRateLimit(req, res, next) {
  const key = getKey(req);
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.set('Retry-After', String(Math.max(1, retryAfter)));
    return res.status(429).json({
      error: 'Too many chat requests. Please wait a moment and try again.',
      code: 'RATE_LIMITED',
    });
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return next();
}
