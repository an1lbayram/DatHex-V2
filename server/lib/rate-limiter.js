// Simple in-memory rate limiter (per key, N requests per window).
function createRateLimiter(maxRequests, windowMs) {
  const hits = new Map(); // key -> { count, resetAt }
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  }, windowMs);
  cleanupTimer.unref();

  function isAllowed(key) {
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    return entry.count <= maxRequests;
  }

  isAllowed.reset = () => hits.clear();
  isAllowed.stop = () => clearInterval(cleanupTimer);

  return isAllowed;
}

module.exports = { createRateLimiter };
