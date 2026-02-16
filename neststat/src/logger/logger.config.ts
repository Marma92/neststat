import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston logger configuration
 * Provides console and file logging with different formats for dev/production
 */
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
        }),
      ),
    }),

    // Error log file - only errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // Combined log file - all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
  level: process.env.LOG_LEVEL || 'info',
};
