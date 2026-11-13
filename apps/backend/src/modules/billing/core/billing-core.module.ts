import { Global, Module } from '@nestjs/common';
import { BillingEntitlementsService } from './billing-entitlements.service';
import { PlanFeatureGuard } from './plan-feature.guard';

@Global()
@Module({
  providers: [BillingEntitlementsService, PlanFeatureGuard],
  exports: [BillingEntitlementsService, PlanFeatureGuard],
})
export class BillingCoreModule {}
