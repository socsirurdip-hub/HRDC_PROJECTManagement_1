const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Indian Standard Time (IST) timestamp formatter compliant with CERT-In 2022 guidelines
const istTimestamp = winston.format((info) => {
  info.timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' IST';
  return info;
});

// CERT-In 2022 Mandate: Daily log rotation with minimum 180 days retention
const dailyErrorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '180d',
  maxSize: '20m',
  zippedArchive: true,
});

const dailyCombinedTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '180d',
  maxSize: '20m',
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    istTimestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `${timestamp} [${level}]: ${message}\n${stack}`
        : `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    dailyErrorTransport,
    dailyCombinedTransport,
  ],
});

module.exports = logger;

