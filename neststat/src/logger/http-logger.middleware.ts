import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Middleware to log HTTP requests and responses
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Log request
    this.logger.info('Incoming request', {
      context: 'HTTP',
      method,
      url: originalUrl,
      ip,
      userAgent,
    });

    // Log response when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      const logLevel = statusCode >= 400 ? 'error' : 'info';
      this.logger.log(logLevel, 'Request completed', {
        context: 'HTTP',
        method,
        url: originalUrl,
        statusCode,
        responseTime: `${responseTime}ms`,
      });
    });

    next();
  }
}
