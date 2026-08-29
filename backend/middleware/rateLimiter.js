/**
 * Lightweight, zero-dependency in-memory rate limiter middleware.
 * Implements sliding-window counter with standard rate limit headers.
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 30,
  message = 'Too many requests. Please slow down and try again later.',
} = {}) {
  const clientRecords = new Map()

  // Periodic cleanup of expired window records
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of clientRecords.entries()) {
      if (now > record.resetTime) {
        clientRecords.delete(key)
      }
    }
  }, 3 * 60 * 1000)

  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }

  return function rateLimiter(req, res, next) {
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown'

    const now = Date.now()
    let record = clientRecords.get(clientIp)

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      }
      clientRecords.set(clientIp, record)
    } else {
      record.count++
    }

    const remaining = Math.max(0, max - record.count)
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000))

    res.setHeader('RateLimit-Limit', max)
    res.setHeader('RateLimit-Remaining', remaining)
    res.setHeader('RateLimit-Reset', retryAfterSeconds)

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds)
      return res.status(429).json({
        error: message,
        retryAfter: retryAfterSeconds,
      })
    }

    next()
  }
}

// 1. Rate limiter for generating digests & fetching trees (20 requests per 15 minutes)
export const digestRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Digest generation limit reached. Please wait a few minutes before requesting more repositories.',
})

// 2. Rate limiter for AI chat requests (40 questions per minute)
export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: 'Chat message rate limit reached. Please wait a moment before sending more questions.',
})
