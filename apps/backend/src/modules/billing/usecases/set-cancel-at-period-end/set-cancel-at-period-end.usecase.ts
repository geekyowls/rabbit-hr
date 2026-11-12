import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OrgSubscriptionStatus } from '@boilerplate/core';
import { OrganizationRepository } from '@db/repositories';
import { BillingEntitlementsService } from '../../core/billing-entitlements.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../services/payment-provider.interface';
import { GetBillingSummary } from '../get-billing-summary/get-billing-summary.usecase';
import { GetBillingSummaryCommand } from '../get-billing-summary/get-billing-summary.command';
import { BillingSummaryDto } from '../../dtos/billing.dto';
import { SetCancelAtPeriodEndCommand } from './set-cancel-at-period-end.command';

const CANCELLABLE_STATUSES = [
  OrgSubscriptionStatus.ACTIVE,
  OrgSubscriptionStatus.TRIAL,
  OrgSubscriptionStatus.PAST_DUE,
];

@Injectable()
export class SetCancelAtPeriodEnd {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly entitlements: BillingEntitlementsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly getBillingSummary: GetBillingSummary,
  ) {}

  async execute(
    command: SetCancelAtPeriodEndCommand,
  ): Promise<BillingSummaryDto> {
    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: command.organizationId },
    });
    if (
      !organization.dodoSubscriptionId ||
      !CANCELLABLE_STATUSES.includes(organization.subscriptionStatus)
    ) {
      throw new BadRequestException('No active subscription');
    }
    await this.provider.setCancelAtPeriodEnd(
      organization.dodoSubscriptionId,
      command.cancelAtPeriodEnd,
    );
    organization.cancelAtPeriodEnd = command.cancelAtPeriodEnd;
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
