import { Inject, Injectable } from '@nestjs/common';
import {
  BillingInterval,
  isPlanId,
  SELF_SERVE_PLAN_IDS,
} from '@boilerplate/core';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  type PlanSelection,
} from '../../services/payment-provider.interface';
import { BillingEntitlementsService } from '../../core/billing-entitlements.service';
import { BillingSummaryDto } from '../../dtos/billing.dto';
import { GetBillingSummaryCommand } from './get-billing-summary.command';

@Injectable()
export class GetBillingSummary {
  constructor(
    private readonly entitlements: BillingEntitlementsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async execute(command: GetBillingSummaryCommand): Promise<BillingSummaryDto> {
    const state = await this.entitlements.getState(command.organizationId);
    const members = await this.entitlements.getMemberUsage(
      command.organizationId,
    );
    return {
      configured: this.entitlements.isConfigured(),
      enforced: this.entitlements.isEnforced(),
      isSystemOrg: state.isSystemOrg,
      plan: isPlanId(state.plan) ? state.plan : null,
      billingInterval: state.billingInterval,
      status: state.status,
      access: this.entitlements.accessFor(state),
      trialEndsAt: state.trialEndsAt,
      currentPeriodEnd: state.subscriptionEndsAt,
      pastDueSince: state.pastDueSince,
      cancelAtPeriodEnd: state.cancelAtPeriodEnd,
      features: this.entitlements.featuresFor(state),
      members,
      hasSubscription: !!state.dodoSubscriptionId,
      hasCustomer: !!state.dodoCustomerId,
      checkoutOptions: this.checkoutOptions(),
    };
  }

  private checkoutOptions(): PlanSelection[] {
    return SELF_SERVE_PLAN_IDS.flatMap((plan) =>
      Object.values(BillingInterval).map((interval) => ({ plan, interval })),
    ).filter((selection) => this.provider.isAvailable(selection));
  }
}
