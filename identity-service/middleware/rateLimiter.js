const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const RedisStore = require('rate-limit-redis').default;
const logger = require('../utils/logger');

// Redis client setup
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Handle Redis errors
redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

// General rate limiter
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10, // Number of points
  duration: 1 // Per second
});

// Middleware function
const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests'
      });
    });
};

// Auth/Sensitive endpoints limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts'
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:auth:'
  })
});

module.exports = {
  rateLimiterMiddleware,
  authLimiter
};