import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  getPlanMemberLimit,
  OrgSubscriptionStatus,
  PLANS,
} from '@boilerplate/core';
import { OrganizationRepository } from '@db/repositories';
import { BillingEntitlementsService } from '../../core/billing-entitlements.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../services/payment-provider.interface';
import { GetBillingSummary } from '../get-billing-summary/get-billing-summary.usecase';
import { GetBillingSummaryCommand } from '../get-billing-summary/get-billing-summary.command';
import { BillingSummaryDto } from '../../dtos/billing.dto';
import { ChangePlanCommand } from './change-plan.command';

const CHANGEABLE_STATUSES = [
  OrgSubscriptionStatus.ACTIVE,
  OrgSubscriptionStatus.TRIAL,
  OrgSubscriptionStatus.PAST_DUE,
];

@Injectable()
export class ChangePlan {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly entitlements: BillingEntitlementsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly getBillingSummary: GetBillingSummary,
  ) {}

  async execute(command: ChangePlanCommand): Promise<BillingSummaryDto> {
    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: command.organizationId },
    });
    if (
      !organization.dodoSubscriptionId ||
      !CHANGEABLE_STATUSES.includes(organization.subscriptionStatus)
    ) {
      throw new BadRequestException(
        'No active subscription to change. Choose a plan to subscribe',
      );
    }
    if (
      organization.plan === command.plan &&
      organization.billingInterval === command.interval
    ) {
      throw new BadRequestException('You are already on this plan');
    }
    const selection = { plan: command.plan, interval: command.interval };
    if (!this.provider.isAvailable(selection)) {
      throw new BadRequestException(
        'This plan is not available for online checkout. Contact us to switch',
      );
    }
    const limit = getPlanMemberLimit(
      command.plan,
      organization.memberLimitOverride,
    );
    const members = await this.entitlements.countMembers(organization.id);
    if (limit !== null && members > limit) {
      throw new ConflictException(
        `The ${PLANS[command.plan].name} plan includes up to ${limit} team members and you have ${members}. Remove members first`,
      );
    }
    await this.provider.changePlan(organization.dodoSubscriptionId, selection);
    organization.plan = command.plan;
    organization.billingInterval = command.interval;
    await this.organizationRepository.save(organization);
    await this.entitlements.invalidate(organization.id);
    return this.getBillingSummary.execute(
      GetBillingSummaryCommand.create({
        userId: command.userId,
        organizationId: command.organizationId,
      }),
    );
  }
}
