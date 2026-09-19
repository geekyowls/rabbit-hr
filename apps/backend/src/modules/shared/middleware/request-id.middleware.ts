import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requestContextStorage } from './request-context';

export interface RequestWithReqId extends Request {
  _reqId: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithReqId, res: Response, next: NextFunction) {
    const reqId = `req_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    req._reqId = reqId;
    res.setHeader('X-Request-ID', reqId);

    requestContextStorage.run({ reqId }, () => next());
  }
}
