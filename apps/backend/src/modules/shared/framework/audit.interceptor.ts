import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogRepository } from '@db/repositories';

interface RequestUser {
  userId?: string;
  organizationId?: string;
  impersonatedBy?: string;
}

const SENSITIVE_FIELDS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'refreshtoken',
  'invitetoken',
  'accesstoken',
  'secret',
  'apikey',
  'otp',
  'code',
]);

const SKIP_METHODS = ['GET', 'OPTIONS', 'HEAD'];

const SKIP_PATH_PREFIXES = ['/api/v1/client-app/', '/api/v1/health'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (SKIP_METHODS.includes(request.method)) {
      return next.handle();
    }

    const url = request.originalUrl || request.url || '';
    if (SKIP_PATH_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      return next.handle();
    }

    const startTime = Date.now();
    const auditData = this.buildAuditData(request);

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        this.saveAuditLog({
          ...auditData,
          statusCode: response.statusCode,
          duration: Date.now() - startTime,
        });
      }),
      catchError((error) => {
        this.saveAuditLog({
          ...auditData,
          statusCode: error.status || 500,
          duration: Date.now() - startTime,
        });
        throw error;
      }),
    );
  }

  private buildAuditData(request: Request) {
    const { user } = request as Request & { user?: RequestUser };
    const routePath = (request.route as { path?: string })?.path || request.url;

    return {
      organizationId: user?.organizationId || null,
      actorId: user?.userId || null,
      impersonatedBy: user?.impersonatedBy || null,
      method: request.method,
      path: request.originalUrl,
      action: this.buildAction(request.method, routePath),
      ipAddress: this.getIpAddress(request),
      userAgent: request.get('user-agent')?.substring(0, 500) || null,
      metadata: this.buildMetadata(request),
    };
  }

  private buildAction(method: string, routePath: string): string {
    const cleanPath = routePath
      .replace(/^\/api\/v\d+\//, '')
      .replace(/:[^/]+/g, '')
      .replace(/\/+/g, '/')
      .replace(/^\/|\/$/g, '');

    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length === 0) {
      return `unknown.${method.toLowerCase()}`;
    }

    const resource = parts[0];
    let actionName: string;

    if (parts.length === 1) {
      actionName = method === 'POST' ? 'create' : method.toLowerCase();
    } else {
      const lastPart = parts[parts.length - 1];
      actionName = lastPart || method.toLowerCase();
    }

    const methodToAction: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    if (actionName === 'create' || actionName === method.toLowerCase()) {
      actionName = methodToAction[method] || method.toLowerCase();
    }

    return `${resource}.${actionName}`;
  }

  private buildMetadata(request: Request): Record<string, unknown> | null {
    const metadata: Record<string, unknown> = {};

    if (request.params && Object.keys(request.params).length > 0) {
      metadata.params = request.params;
    }

    if (request.body && Object.keys(request.body).length > 0) {
      metadata.body = this.sanitizeBody(request.body);
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    if (Array.isArray(body)) {
      return body.map((item) => this.sanitizeBody(item));
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeBody(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private getIpAddress(request: Request): string | null {
    const cfConnectingIp = request.headers['cf-connecting-ip'];
    if (cfConnectingIp) {
      return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
    }
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips?.trim() || null;
    }
    return request.ip || null;
  }

  private saveAuditLog(data: {
    organizationId: string | null;
    actorId: string | null;
    impersonatedBy: string | null;
    method: string;
    path: string;
    action: string;
    statusCode: number;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: Record<string, unknown> | null;
    duration: number;
  }): void {
    this.auditLogRepository.save(data).catch((error) => {
      this.logger.error('Failed to save audit log', error);
    });
  }
}
