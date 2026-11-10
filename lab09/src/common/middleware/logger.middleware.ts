import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { RequestWithId } from './request-id.middleware';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const idPrefix = req.id ? `[${req.id}]` : '[no-id]';
      console.log(
        `${idPrefix} ${method} ${originalUrl} -> ${res.statusCode} (${duration}ms)`,
      );
    });

    next();
  }
}
