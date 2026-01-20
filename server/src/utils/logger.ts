import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, errors, json, printf, colorize } = format;


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
    json()
  ),
  defaultMeta: { service: 'EduTrak-school-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json())
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json())
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    )
  }));
}

export default logger;