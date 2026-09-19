import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { getRequestContext } from '../middleware/request-context';

interface UserSession {
  userId: string;
  email: string;
  organizationId: string;
}

interface ClientSession {
  clientId: string;
  organizationId: string;
}

interface RequestWithReqId extends Request {
  _reqId?: string;
  user?: UserSession | ClientSession;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly structured = process.env.NODE_ENV === 'production';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithReqId>();
    const response = ctx.getResponse<Response>();
    const { method, url } = request;

    const reqCtx = getRequestContext();
    const reqId = request._reqId || reqCtx?.reqId || 'no-id';

    const userInfo = this.resolveUserInfo(request);
    const userAgent = request.get('user-agent') || 'Unknown';

    if (reqCtx && request.user) {
      if ('userId' in request.user) {
        reqCtx.userId = request.user.userId;
        reqCtx.email = request.user.email;
        reqCtx.organizationId = request.user.organizationId;
      } else if ('clientId' in request.user) {
        reqCtx.clientId = request.user.clientId;
        reqCtx.organizationId = request.user.organizationId;
      }
    }

    const startMessage = `→ ${method} ${url} (${reqId}) - ${userInfo} - UA: ${userAgent}`;
    if (this.structured) {
      this.logger.log(startMessage, { method, path: url });
    } else {
      this.logger.log(startMessage);
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logResponse(method, url, reqId, statusCode, duration);
        },
        error: (error: any) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          this.logResponse(method, url, reqId, statusCode, duration, error);
        },
      }),
    );
  }

  private resolveUserInfo(request: RequestWithReqId): string {
    if (!request.user) return 'Unauthenticated';
    if ('userId' in request.user) {
      return `User: ${request.user.email} (${request.user.userId})`;
    }
    if ('clientId' in request.user) {
      return `Client: ${request.user.clientId}`;
    }
    return 'Unknown session';
  }

  private logResponse(
    method: string,
    url: string,
    reqId: string,
    statusCode: number,
    duration: number,
    error?: any,
  ) {
    const message = `← ${method} ${url} (${reqId}) - ${statusCode} (${duration}ms)`;

    if (this.structured) {
      const meta = { method, path: url, statusCode, durationMs: duration };
      if (statusCode >= 500) {
        this.logger.error(message, error?.stack, meta);
      } else if (statusCode >= 400) {
        this.logger.warn(message, meta);
      } else {
        this.logger.log(message, meta);
      }
      return;
    }

    if (statusCode >= 500) {
      this.logger.error(message, error?.stack);
    } else if (statusCode >= 400) {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }
}
