require('dotenv').config()

const express = require('express')

const cors = require('cors')

const Redis = require('ioredis')

const helmet = require('helmet')

const {rateLimit} = require('express-rate-limit')

const {RedisStore} = require('express-redis-store')

const app = express()

const PORT = process.env.PORT || 3000

const redisClient = new Redis(process.env.RedisURL)

app.use(helmet())

app.use(cors())

app.use(express.json())


const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10, // Number of points
  duration: 1 // Per second
})


 const rateLimit = rateLimit({
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


  app.use(rateLimit);