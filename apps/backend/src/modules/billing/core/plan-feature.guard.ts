import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PlanFeature } from '@boilerplate/core';
import type { UserSessionData } from '@shared/decorators/user-session.decorator';
import { BillingEntitlementsService } from './billing-entitlements.service';

export const PLAN_FEATURE_KEY = 'requiredPlanFeature';

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<PlanFeature | undefined>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: UserSessionData }>();
    if (!user?.organizationId) throw new UnauthorizedException();
    await this.entitlements.assertFeature(user.organizationId, feature);
    return true;
  }
}
