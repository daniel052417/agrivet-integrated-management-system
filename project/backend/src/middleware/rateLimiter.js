const rateLimit = require('express-rate-limit');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

// Custom rate limiter using Redis
const createRedisRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const now = Date.now();
      const window = Math.floor(now / windowMs);

      // Get current count for this window
      const currentCount = await cache.get(`${key}:${window}`) || 0;
      
      if (currentCount >= max) {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Increment count
      await cache.set(`${key}:${window}`, currentCount + 1, Math.ceil(windowMs / 1000));
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - currentCount - 1),
        'X-RateLimit-Reset': new Date((window + 1) * windowMs).toISOString()
      });

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // If Redis fails, allow the request to proceed
      next();
    }
  };
};

// Standard rate limiter
const standardLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// PWA-specific rate limiter
const pwaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // limit each IP to 200 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Order creation rate limiter
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 orders per minute
  message: {
    success: false,
    message: 'Too many order requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  createRedisRateLimit,
  standardLimiter,
  strictLimiter,
  pwaLimiter,
  orderLimiter
};











