require('dotenv').config()

const express = require('express')

const cors = require('cors')

const Redis = require('ioredis')

const helmet = require('helmet')

const rateLimit = require('express-rate-limit')


const { RedisStore } = require("rate-limit-redis");

const logger = require('../utils/logger')

const proxy = require('express-http-proxy')

const errorHandler = require('../middlware/errorHandler')

const app = express()

const PORT = process.env.PORT || 3000

const redisClient = new Redis(process.env.RedisURL)

app.use(helmet())

app.use(cors())

app.use(express.json())

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: "rl:general:",
  }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: "rl:auth:",
  }),
});



const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

//setting up proxy for our identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

  app.use(rateLimit);
  app.use(errorHandler)


  app.listen(PORT, () => {
    logger.info(`API Gateaway is running on port ${PORT}`)
    logger.info(`Identity Service is running on port ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Redis is running on port ${process.env.Redis_URL}`)

  })