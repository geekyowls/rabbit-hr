import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { BillingAccess } from '@boilerplate/core';
import type { UserSessionData } from '@shared/decorators/user-session.decorator';
import { BillingEntitlementsService } from './core/billing-entitlements.service';
import { BillingInactiveException } from './core/billing.errors';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const EXEMPT_PREFIXES = [
  '/billing',
  '/auth/',
  '/users/me',
  '/me/',
  '/system-admin/',
];
const READ_ONLY_SUFFIXES = ['/list', '/board', '/preview'];
const API_PREFIX = /^\/api\/v\d+/;

@Injectable()
export class BillingAccessInterceptor implements NestInterceptor {
  constructor(private readonly entitlements: BillingEntitlementsService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') return next.handle();
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UserSessionData }>();
    const organizationId = request.user?.organizationId;
    if (
      !organizationId ||
      SAFE_METHODS.includes(request.method) ||
      this.isExemptPath(request.path) ||
      !this.entitlements.isEnforced()
    ) {
      return next.handle();
    }
    const access = await this.entitlements.getAccess(organizationId);
    if (access !== BillingAccess.FULL) {
      throw new BillingInactiveException(access);
    }
    return next.handle();
  }

  private isExemptPath(path: string): boolean {
    const route = path.replace(API_PREFIX, '');
    return (
      EXEMPT_PREFIXES.some((prefix) => route.startsWith(prefix)) ||
      READ_ONLY_SUFFIXES.some((suffix) => route.endsWith(suffix))
    );
  }
}
