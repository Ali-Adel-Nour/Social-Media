const winston = require('winston');
const { createLogger, format, transports } = winston;
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }),
    format.json()
  ),
  defaultMeta: {
    service: 'api-gateway',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console transport with different format for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, metadata }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
        })
      )
    }),
    // Rotating file transport for errors
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    // Rotating file transport for all logs
    new transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ],
  exitOnError: false
});

// Add request ID tracking
logger.requestId = null;
const originalLoggerInfo = logger.info;
logger.info = function(msg, meta) {
  if (this.requestId) {
    meta = meta || {};
    meta.requestId = this.requestId;
  }
  originalLoggerInfo.call(this, msg, meta);
};

module.exports = logger;
