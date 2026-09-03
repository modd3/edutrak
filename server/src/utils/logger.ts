import winston from 'winston';
import { format } from 'winston';
import { stripAnsi, stripAnsiDeep } from './sanitize';

const { combine, timestamp, errors, json, printf, colorize } = format;

/**
 * Strip ANSI escape sequences (e.g. from Prisma/chalk error messages, which
 * Prisma emits with color codes like \u001b[31m) from log messages, stacks and
 * metadata so logs stay readable and JSON-serializable cleanly.
 */
const stripAnsiFormat = format((info) => {
  if (typeof info.message === 'string') info.message = stripAnsi(info.message);
  if (typeof info.stack === 'string') info.stack = stripAnsi(info.stack);
  for (const key of Object.keys(info)) {
    if (key === 'message' || key === 'stack') continue;
    const value = info[key];
    if (typeof value === 'string') {
      info[key] = stripAnsi(value);
    } else if (value && typeof value === 'object') {
      info[key] = stripAnsiDeep(value);
    }
  }
  return info;
})();

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${stack || message}`;

  // Add metadata if present (excluding stack which we already handled)
  const metaWithoutStack = { ...meta };
  delete metaWithoutStack.stack; // Remove stack since we handle it separately

  if (Object.keys(metaWithoutStack).length > 0) {
    log += ` ${JSON.stringify(metaWithoutStack)}`;
  }

  return log;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    stripAnsiFormat,
    json()
  ),
  defaultMeta: { service: 'EduTrak-school-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), stripAnsiFormat, json())
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), stripAnsiFormat, json())
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      stripAnsiFormat,
      consoleFormat
    )
  }));
}

export default logger;